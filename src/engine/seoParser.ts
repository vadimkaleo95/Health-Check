import { SeoMetricsState, SeoCheckItem } from '../types';
import { detectAnalyticsFromHtml, ToolStatus } from '../analyticsDetect';
import { fetchStoreHtml, AuditLog } from '../auditEngine';

export function discoverShopifySubpages(html: string, baseUrl: string): { productUrl?: string; collectionUrl?: string } {
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
