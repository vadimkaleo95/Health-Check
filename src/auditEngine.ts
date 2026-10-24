import { PerformanceState, SeoMetricsState, SeoCheckItem, PerformancePage } from './types';
import { detectAnalyticsFromHtml, ToolStatus } from './analyticsDetect';

export interface AuditLog {
  source: 'HTML Proxy' | 'Google PageSpeed' | 'Analytics Scanner';
  status: 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
}

export function extractDomainInfo(rawUrl: string): { host: string; brand: string } {
  try {
    let clean = rawUrl.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }
    const u = new URL(clean);
    const host = u.hostname.replace(/^www\./, '');
    const parts = host.split('.');
    const rawBrand = parts.length > 1 ? parts[0] : host;
    const brand = rawBrand.charAt(0).toUpperCase() + rawBrand.slice(1);
    return { host, brand };
  } catch {
    return { host: rawUrl, brand: rawUrl || "Магазин" };
  }
}

export async function fetchStoreHtml(targetUrl: string): Promise<{ html: string; usedProxy: string }> {
  const isVercel = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
  
  const sources = [
    ...(isVercel ? [{ name: 'Vercel Edge Proxy', url: `/api/fetch-html?url=${encodeURIComponent(targetUrl)}` }] : []),
    { name: 'allorigins.win', url: `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}` },
    { name: 'corsproxy.io', url: `https://corsproxy.io/?${encodeURIComponent(targetUrl)}` }
  ];

  const errors: string[] = [];

  for (const src of sources) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(src.url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 250 && !text.includes('Challenge Validation') && !text.includes('Just a moment...')) {
          return { html: text, usedProxy: src.name };
        }
      }
      errors.push(`${src.name}: HTTP ${res.status}`);
    } catch (e: any) {
      errors.push(`${src.name}: ${e?.message || 'таймаут/відмова'}`);
    }
  }

  throw new Error(`Не вдалося завантажити HTML сайту (${errors.join('; ')}). Перевірте доступність сайту.`);
}

function discoverShopifySubpages(html: string, baseUrl: string): { productUrl?: string; collectionUrl?: string } {
  const origin = new URL(baseUrl).origin;

  const productMatches = html.match(/href=["'](\/products\/[^"'\?#]+)["']/gi) || [];
  let productUrl: string | undefined;
  for (const match of productMatches) {
    const clean = match.replace(/href=["']/i, '').replace(/["']$/, '');
    if (clean && !clean.includes('/products/all') && clean.length > 10) {
      productUrl = `${origin}${clean}`;
      break;
    }
  }

  const collectionMatches = html.match(/href=["'](\/collections\/[^"'\?#]+)["']/gi) || [];
  let collectionUrl: string | undefined;
  for (const match of collectionMatches) {
    const clean = match.replace(/href=["']/i, '').replace(/["']$/, '');
    if (clean && clean !== '/collections' && clean !== '/collections/all') {
      collectionUrl = `${origin}${clean}`;
      break;
    }
  }

  return { productUrl, collectionUrl };
}

export async function parseStoreHtml(cleanUrl: string, host: string, brand: string): Promise<{
  seo: SeoMetricsState;
  tools: ToolStatus[];
  subpages: { productUrl?: string; collectionUrl?: string };
  log: AuditLog;
}> {
  const { html, usedProxy } = await fetchStoreHtml(cleanUrl);

  // 1. Title та Description
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const realTitle = titleMatch ? titleMatch[1].trim() : '';

  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const realDesc = descMatch ? descMatch[1].trim() : '';

  // 2. Canonical
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
  const hasCanonical = !!canonicalMatch;

  // 3. Структура H1
  const h1Matches = Array.from(html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi));
  const h1Count = h1Matches.length;
  const rawH1 = h1Count > 0 ? h1Matches[0][1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ') : '';

  // 4. Schema.org (JSON-LD)
  const jsonLdScripts = Array.from(html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
  const schemaTypesSet = new Set<string>();
  for (const script of jsonLdScripts) {
    const content = script[1];
    const typeMatches = Array.from(content.matchAll(/"@type"\s*:\s*["']([^"']+)["']/gi));
    for (const tm of typeMatches) {
      schemaTypesSet.add(tm[1]);
    }
  }
  const schemaTypes = Array.from(schemaTypesSet);

  // 5. Open Graph
  const ogImageMatch = html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                       html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i);
  const ogImageUrl = ogImageMatch ? ogImageMatch[1].trim() : '';
  const hasOgImage = !!ogImageUrl;

  // 6. Hreflang
  const hreflangMatches = Array.from(html.matchAll(/hreflang=["']([^"']+)["']/gi)).map(m => m[1]);
  const hreflangCount = new Set(hreflangMatches).size;

  // 7. Robots
  const robotsMatch = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i) ||
                      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']robots["']/i);
  const robotsDirectives = robotsMatch ? robotsMatch[1].trim() : 'index, follow (за замовчуванням)';
  const isNoindex = robotsDirectives.toLowerCase().includes('noindex');

  // 8. Аналіз готовності до AI
  const hasSemanticMarkup = schemaTypes.length > 0;
  const hasSingleH1 = h1Count === 1;
  let aiReadinessSummary = '';
  let aiStatus: 'pass' | 'warn' | 'fail' = 'pass';

  if (isNoindex) {
    aiStatus = 'fail';
    aiReadinessSummary = 'Сайт закрито від сканування (noindex). AI-агенти та пошукові боти не бачать вміст сторінки.';
  } else if (hasSemanticMarkup && hasSingleH1) {
    aiStatus = 'pass';
    aiReadinessSummary = `Висока готовність до AI-пошуку. Виявлено структуровані сутності (${schemaTypes.join(', ')}) та чітку ієрархію H1.`;
  } else if (hasSemanticMarkup || hasSingleH1) {
    aiStatus = 'warn';
    aiReadinessSummary = 'Помірна готовність до AI. Рекомендовано додати специфічні сутності Schema.org (Product/Organization).';
  } else {
    aiStatus = 'warn';
    aiReadinessSummary = 'Низька семантична розмітка. AI-моделі спираються лише на неструктурований текст сторінки.';
  }

  // 9. Реальні діагностичні чеки
  const checks: SeoCheckItem[] = [
    {
      id: 'h1',
      name: 'Структура заголовків (H1)',
      detected: h1Count === 1 ? '1 тег H1 (Норма)' : h1Count === 0 ? 'H1 відсутній' : `${h1Count} тегів H1 (Дублювання)`,
      details: h1Count === 1 
        ? `Текст заголовка: "${rawH1.slice(0, 75)}${rawH1.length > 75 ? '...' : ''}"`
        : h1Count === 0 
          ? 'На сторінці немає жодного тегу H1.'
          : 'Виявлено кілька тегів H1. Рекомендовано залишити один головний заголовок.',
      status: h1Count === 1 ? 'pass' : 'warn'
    },
    {
      id: 'schema',
      name: 'Мікророзмітка Schema.org (JSON-LD)',
      detected: schemaTypes.length > 0 ? `Знайдено: ${schemaTypes.join(', ')}` : 'Не виявлено',
      details: schemaTypes.length > 0 
        ? `Підключено сутності (${schemaTypes.join(', ')}).`
        : 'Блок application/ld+json не знайдено у вихідному коді.',
      status: schemaTypes.length > 0 ? 'pass' : 'warn'
    },
    {
      id: 'og',
      name: 'Open Graph прев’ю (og:image)',
      detected: hasOgImage ? 'og:image активний' : 'og:image не знайдено',
      details: hasOgImage 
        ? 'Мета-тег og:image налаштований для формування карток у соцмережах та месенджерах.'
        : 'og:image відсутній у розмітці.',
      status: hasOgImage ? 'pass' : 'warn'
    },
    {
      id: 'hreflang',
      name: 'Мовні копії та ринки (Hreflang)',
      detected: hreflangCount > 0 ? `${hreflangCount} локалей / мов` : 'Теги hreflang відсутні',
      details: hreflangCount > 0 
        ? 'Знайдено налаштовані мовні альтернативи сторінки.'
        : 'Якщо магазин орієнтований на кілька країн/мов, необхідна наявність hreflang.',
      status: hreflangCount > 0 ? 'pass' : 'warn'
    },
    {
      id: 'robots',
      name: 'Технічна індексація (Meta Robots)',
      detected: robotsDirectives,
      details: isNoindex 
        ? 'КРИТИЧНО: директива noindex забороняє пошукову індексацію.'
        : 'Індексацію дозволено.',
      status: isNoindex ? 'fail' : 'pass'
    },
    {
      id: 'ai',
      name: 'Відображення та цитування для AI-агентів',
      detected: aiStatus === 'pass' ? 'Висока семантика' : 'Потребує оптимізації',
      details: aiReadinessSummary,
      status: aiStatus
    }
  ];

  const subpages = discoverShopifySubpages(html, cleanUrl);

  return {
    seo: {
      titleText: realTitle || 'Title відсутній',
      titleLength: realTitle.length,
      metaDescText: realDesc || 'Meta description відсутній у коді сторінки.',
      metaDescLength: realDesc.length,
      canonicalStatus: hasCanonical ? 'pass' : 'warn',
      canonicalDetails: hasCanonical 
        ? `Canonical знайдено: ${canonicalMatch ? canonicalMatch[1] : 'Налаштовано'}` 
        : 'Тег <link rel="canonical"> не виявлено.',
      h1Count,
      h1Text: rawH1,
      schemaTypes,
      hasOgImage,
      ogImageUrl,
      hreflangCount,
      robotsDirectives,
      aiReadinessSummary,
      checks
    },
    tools: detectAnalyticsFromHtml(html),
    subpages,
    log: {
      source: 'HTML Proxy',
      status: 'success',
      message: `HTML отримано через ${usedProxy}. Реальні дані: H1 (${h1Count}), Schema (${schemaTypes.length}), OG (${hasOgImage ? 'OK' : 'Немає'}).`,
      timestamp: new Date().toLocaleTimeString('uk-UA')
    }
  };
}

async function fetchSinglePageSpeed(url: string) {
  const envKey = import.meta.env.VITE_GOOGLE_PAGESPEED_KEY || '';
  const keyParam = envKey ? `&key=${envKey}` : '';
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile${keyParam}`;
  
  const res = await fetch(apiUrl);
  if (!res.ok) throw new Error(`Google API повернув HTTP ${res.status}`);
  return await res.json();
}

export async function runGooglePageSpeed(
  cleanUrl: string, 
  host: string, 
  brand: string,
  subpages?: { productUrl?: string; collectionUrl?: string }
): Promise<{
  perfData: PerformanceState;
  finalScore: number;
  networkUrls: string[];
  log: AuditLog;
}> {
  const requests: Promise<any>[] = [fetchSinglePageSpeed(cleanUrl)];
  
  if (subpages?.productUrl) {
    requests.push(fetchSinglePageSpeed(subpages.productUrl));
  }
  if (subpages?.collectionUrl) {
    requests.push(fetchSinglePageSpeed(subpages.collectionUrl));
  }

  const results = await Promise.allSettled(requests);

  if (results[0].status === 'rejected') {
    throw new Error(`Google PageSpeed API не зміг перевірити головну сторінку: ${results[0].reason?.message || 'Помилка доступу'}`);
  }

  const homeJson = results[0].value;
  const homeLighthouse = homeJson.lighthouseResult;
  const homeCat = homeLighthouse?.categories;
  const homeAudits = homeLighthouse?.audits;

  const realHomeScore = Math.round((homeCat?.performance?.score || 0) * 100);
  const realA11yScore = Math.round((homeCat?.accessibility?.score || 0) * 100);
  const realLcpNumeric = homeAudits?.['largest-contentful-paint']?.numericValue || 0;
  const realLcpDisplay = realLcpNumeric ? `${(realLcpNumeric / 1000).toFixed(1)} c` : '—';
  const realTbtNumeric = Math.round(homeAudits?.['total-blocking-time']?.numericValue || 0);
  const realTbtDisplay = `${realTbtNumeric} мс`;

  const pages: PerformancePage[] = [
    {
      name: `Головна: ${host}`,
      type: "Home",
      mobileScore: realHomeScore,
      desktopScore: 0,
      lcp: realLcpDisplay,
      tbt: realTbtDisplay,
      a11y: realA11yScore,
      share: "Головна вітрина"
    }
  ];

  let resultIndex = 1;
  if (subpages?.productUrl) {
    const prodRes = results[resultIndex++];
    if (prodRes && prodRes.status === 'fulfilled') {
      const pLh = prodRes.value.lighthouseResult;
      const pScore = Math.round((pLh?.categories?.performance?.score || 0) * 100);
      const pLcp = pLh?.audits?.['largest-contentful-paint']?.numericValue;
      const pTbt = pLh?.audits?.['total-blocking-time']?.numericValue;
      pages.push({
        name: `Товар: /${subpages.productUrl.split('/').slice(-2).join('/')}`,
        type: "Product",
        mobileScore: pScore,
        desktopScore: 0,
        lcp: pLcp ? `${(pLcp / 1000).toFixed(1)} c` : '—',
        tbt: pTbt !== undefined ? `${Math.round(pTbt)} мс` : '—',
        a11y: Math.round((pLh?.categories?.accessibility?.score || 0) * 100),
        share: "Картка товару"
      });
    }
  }

  if (subpages?.collectionUrl) {
    const colRes = results[resultIndex++];
    if (colRes && colRes.status === 'fulfilled') {
      const cLh = colRes.value.lighthouseResult;
      const cScore = Math.round((cLh?.categories?.performance?.score || 0) * 100);
      const cLcp = cLh?.audits?.['largest-contentful-paint']?.numericValue;
      const cTbt = cLh?.audits?.['total-blocking-time']?.numericValue;
      pages.push({
        name: `Колекція: /${subpages.collectionUrl.split('/').slice(-2).join('/')}`,
        type: "Collection",
        mobileScore: cScore,
        desktopScore: 0,
        lcp: cLcp ? `${(cLcp / 1000).toFixed(1)} c` : '—',
        tbt: cTbt !== undefined ? `${Math.round(cTbt)} мс` : '—',
        a11y: Math.round((cLh?.categories?.accessibility?.score || 0) * 100),
        share: "Сторінка каталогу"
      });
    }
  }

  const blockers: string[] = [];
  const renderBlockingAudit = homeAudits?.['render-blocking-resources'];
  if (renderBlockingAudit?.details?.items?.length) {
    renderBlockingAudit.details.items.slice(0, 5).forEach((item: any) => {
      const fileName = item.url ? item.url.split('/').pop().split('?')[0] : 'resource.js';
      const wasted = Math.round(item.wastedMs || 0);
      blockers.push(`Блокуючий ресурс: ${fileName} (+${wasted} мс до першого відмалювання)`);
    });
  } else {
    blockers.push("Критичних блокуючих ресурсів у першому екрані не виявлено.");
  }

  const perfData: PerformanceState = {
    status: realHomeScore >= 75 ? 'good' : realHomeScore >= 45 ? 'warning' : 'critical',
    statusLabel: realHomeScore >= 75 ? 'Добре' : realHomeScore >= 45 ? 'Потребує уваги' : 'Низька швидкість',
    summary: `Фактичний Google PageSpeed для ${host}: ${realHomeScore}/100 на мобільних пристроях. Перевірено сторінок: ${pages.length}.`,
    salesHook: realHomeScore < 50
      ? `⚡ Мобільна оцінка (${realHomeScore}/100) свідчить про затримки відмалювання для рекламного трафіку бренду ${brand}.`
      : `⚡ Швидкість головної сторінки ${brand} (${realHomeScore}/100) на задовільному рівні.`,
    pages,
    blockers
  };

  const networkUrls: string[] = (homeAudits?.['network-requests']?.details?.items || [])
    .map((item: { url?: string }) => item.url || '')
    .filter(Boolean);

  const finalScore = realHomeScore;
  
  return { 
    perfData, 
    finalScore, 
    networkUrls,
    log: {
      source: 'Google PageSpeed',
      status: 'success',
      message: `Отримано фактичні метрики для ${pages.length} стор. (Головна: ${realHomeScore}/100, LCP: ${realLcpDisplay}).`,
      timestamp: new Date().toLocaleTimeString('uk-UA')
    }
  };
}
