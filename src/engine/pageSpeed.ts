import { PerformanceState, PerformancePage } from '../types';
import { AuditLog } from '../auditEngine';

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
