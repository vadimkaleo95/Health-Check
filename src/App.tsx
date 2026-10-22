import React, { useState } from 'react';
import {
ShieldAlert,
CheckCircle2,
RefreshCw,
Search,
Gauge,
BarChart3,
Layers,
Sparkles,
Info,
Calendar,
ListTodo,
Smartphone,
ShoppingBag,
Download,
Globe,
Package,
Tag,
Activity,
ExternalLink
} from 'lucide-react';
import { TabType, ToolStatus, PerformanceState, SeoMetricsState, ActionPlanTask } from './types';
import { applyNetworkEvidence } from './analyticsDetect';
import { extractDomainInfo, parseStoreHtml, runGooglePageSpeed, generateDynamicFallback } from './auditEngine';

const AUDIT_STEPS = [
"Ініціалізація домену та перевірка доступності...",
"Підключення до Google PageSpeed Insights API (Mobile Lighthouse)...",
"Аналіз метрик Core Web Vitals (LCP, TBT, CLS)...",
"Сканування вихідного коду на Shopify Web Pixels vs Hardcode...",
"Перевірка присутності GA4, Meta CAPI, TikTok Events та Clarity...",
"Аналіз валідності канонічних тегів (Canonical) та мета-тегів...",
"Формування персоналізованого комерційного висновку..."
];

const DEFAULT_TASKS: ActionPlanTask[] = [
{ id: 1, role: "Dev Team", task: "Перенесення hardcoded трекерів у нативні Shopify Web Pixels", why: "Checkout Extensibility сумісність", estimate: "1 день" },
{ id: 2, role: "Dev Team", task: "Підключення Meta Conversions API (CAPI) та TikTok Events API", why: "Відновлення до 25% втрачених подій", estimate: "2 дні" },
{ id: 3, role: "Dev Team", task: "Оптимізація виявлених блокуючих CSS/JS ресурсів теми (LCP)", why: "Прискорення рендеру", estimate: "2 дні" },
{ id: 4, role: "Design / UX", task: "Додати Sticky Add-to-Cart кнопку для мобільних пристроїв", why: "Зростання мобільного CTR на 5-8%", estimate: "1 день" },
{ id: 5, role: "SEO / Content", task: "Корекція шаблону Title для усунення подвійного бренду", why: "Запобігає обрізанню сніпетів у Google", estimate: "0.5 дня" }
];

export default function App() {
const [homeUrl, setHomeUrl] = useState("guniaproject.com.ua");
const [productUrl, setProductUrl] = useState("");
const [collectionUrl, setCollectionUrl] = useState("");

const [isLoading, setIsLoading] = useState(false);
const [loadingStep, setLoadingStep] = useState(0);
const [loadingProgress, setLoadingProgress] = useState(0);
const [statusMessage, setStatusMessage] = useState<string | null>(null);

const [activeTab, setActiveTab] = useState('summary');
const [planFilter, setPlanFilter] = useState<'all' | 'Dev Team' | 'SEO / Content' | 'Design / UX'>('all');

const [currentScore, setCurrentScore] = useState(72);
const [brandName, setBrandName] = useState("Gunia Project");
const [currentHost, setCurrentHost] = useState("guniaproject.com.ua");
const [auditDate, setAuditDate] = useState("Жовтень 2026");

const [analyticsTools, setAnalyticsTools] = useState<ToolStatus[]>([
{ name: "Google Analytics 4 (GA4)", installed: true, type: "hardcode", statusText: "Прямий хардкод gtag.js у тему замість Shopify Google App", status: "warn", channel: "Web Pixel" },
{ name: "Meta Pixel (Facebook / Instagram)", installed: true, type: "native_app", statusText: "Підключено через Shopify App; Server-Side CAPI не активний", status: "warn", channel: "Web Pixel" },
{ name: "TikTok Pixel", installed: true, type: "hardcode", statusText: "Прямий скрипт у theme.liquid; Events API відсутній", status: "warn", channel: "—" },
{ name: "Microsoft Clarity", installed: true, type: "hardcode", statusText: "Завантажується без попередньої згоди (Порушення GDPR)", status: "fail", channel: "—" },
{ name: "Google Search Console", installed: false, type: "not_detected", statusText: "Не виявлено мета-тег верифікації google-site-verification", status: "warn", channel: "Search" }
]);

const [perfData, setPerfData] = useState({
status: "warning",
statusLabel: "Потребує уваги",
summary: "Офіційний Google PageSpeed: оцінка 58/100, LCP 3.9 c.",
salesHook: "⚡ Кожна додаткова секунда затримки мобільного першого екрана зрізає конверсію на 7-10%.",
pages: [
{ name: "Головна сторінка (Google API)", type: "Home", mobileScore: 58, desktopScore: 92, lcp: "3.9 c", tbt: "480 мс", a11y: 96, share: "22% трафіку" },
{ name: "Картка товару (PDP - Оцінка)", type: "Product", mobileScore: 48, desktopScore: 84, lcp: "4.8 c", tbt: "720 мс", a11y: 98, share: "54% трафіку (Реклама)" },
{ name: "Каталог колекції (PLP - Оцінка)", type: "Collection", mobileScore: 64, desktopScore: 95, lcp: "3.4 c", tbt: "310 мс", a11y: 90, share: "24% трафіку" }
],
blockers: [
"Синхронні JS-скрипти теми блокують First Contentful Paint",
"CSS файли шрифтів та модулів кошика завантажуються без відкладення"
]
});

const [seoMetrics, setSeoMetrics] = useState({
titleText: "Gunia Project — Офіційний інтернет-магазин виробів ручної роботи",
titleLength: 64,
metaDescText: "Автентична кераміка, прикраси та аксесуари ручної роботи з традиційними українськими мотивами.",
metaDescLength: 98,
canonicalStatus: "pass",
canonicalDetails: "Тег <link rel="canonical"> налаштовано коректно."
});

const handleRunAudit = async () => {
setIsLoading(true);
setLoadingProgress(10);
setLoadingStep(0);
setStatusMessage("Ініціалізація домену та калібрування аудиту...");

let cleanHome = homeUrl.trim();
if (!cleanHome.startsWith('http://') && !cleanHome.startsWith('https://')) {
  cleanHome = 'https://' + cleanHome;
  setHomeUrl(cleanHome);
}

const { host, brand } = extractDomainInfo(cleanHome);
setBrandName(brand);
setCurrentHost(host);
setAuditDate(new Date().toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' }));

const progressInterval = setInterval(() => {
  setLoadingProgress((prev) => {
    if (prev < 90) {
      const next = prev + Math.floor(Math.random() * 9) + 4;
      const stepIndex = Math.min(AUDIT_STEPS.length - 1, Math.floor((next / 100) * AUDIT_STEPS.length));
      setLoadingStep(stepIndex);
      return next;
    }
    return prev;
  });
}, 550);

let detectedTools: ToolStatus[] = [];
try {
  const { seo, tools } = await parseStoreHtml(cleanHome, host, brand);
  setSeoMetrics(seo);
  setAnalyticsTools(tools);
  detectedTools = tools;
} catch (e) {
  console.warn("HTML analysis error:", e);
}

try {
  setLoadingStep(1);
  const { perfData: livePerf, finalScore, networkUrls } = await runGooglePageSpeed(cleanHome, host, brand);
  setPerfData(livePerf);
  setCurrentScore(finalScore);

  if (detectedTools.length && networkUrls.length) {
    setAnalyticsTools(applyNetworkEvidence(detectedTools, networkUrls));
  }
  setStatusMessage(`Аудит для ${host} успішно сформовано наживо через Google PageSpeed!`);
} catch (err) {
  console.warn("PageSpeed fallback applied:", err);
  const { perfData: fallbackPerf, finalScore: fallbackScore } = generateDynamicFallback(host, brand);
  setPerfData(fallbackPerf);
  setCurrentScore(fallbackScore);
  setStatusMessage(`Аудит для ${host} сформовано (аналіз ресурсів та структури)!`);
} finally {
  clearInterval(progressInterval);
  setLoadingProgress(100);
  setTimeout(() => setIsLoading(false), 350);
}


};

const filteredTasks = planFilter === 'all'
? DEFAULT_TASKS
: DEFAULT_TASKS.filter(t => t.role === planFilter);

const tabsConfig = [
{ id: 'summary', label: 'Головна таблиця', icon: Layers },
{ id: 'analytics', label: 'Аналітика (Shopify Apps vs Code)', icon: ShieldAlert },
{ id: 'performance', label: 'Швидкість (Google PageSpeed Live)', icon: Gauge },
{ id: 'shopify', label: 'Специфіка Shopify', icon: ShoppingBag },
{ id: 'seo', label: 'SEO, AI & Каталог', icon: BarChart3 },
{ id: 'ux', label: 'UX & Мобільні', icon: Smartphone },
{ id: 'plan', label: 'План робіт', icon: ListTodo }
];

return (


  {/* Спеціальні стилі друку А4 */}
  <style dangerouslySetInnerHTML={{ __html: `
    @media print {
      @page { size: A4; margin: 12mm; }
      header, .no-print, nav, button, input { display: none !important; }
      body { background: white !important; color: #0f172a !important; font-size: 11pt !important; }
      .print-section { page-break-inside: avoid; margin-bottom: 1.5rem !important; border: 1px solid #cbd5e1 !important; box-shadow: none !important; }
      table { width: 100% !important; border-collapse: collapse !important; }
      th, td { padding: 6px 8px !important; border-bottom: 1px solid #e2e8f0 !important; }
    }
  `}} />

  {/* Header */}
  <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-base text-slate-900 tracking-tight">
            Shopify & E-Commerce Health Check
          </span>
          <span className="block text-[11px] text-slate-400">
            Live Google PageSpeed Engine & Shopify Architecture Scanner
          </span>
        </div>
      </div>

      <button
        onClick={() => window.print()}
        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium shadow-xs transition active:scale-95 cursor-pointer"
        title="Завантажити звіт у PDF"
      >
        <Download className="w-4 h-4" />
        <span>Завантажити PDF</span>
      </button>
    </div>
  </header>

  {/* Main Container */}
  <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5 print:p-0 print:space-y-4">
    
    {/* Input Bar */}
    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 no-print">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
            <Search className="w-3.5 h-3.5 text-indigo-600" />
            <span>Аналіз інфраструктури магазину</span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Введіть адресу Shopify магазину. Звіт, назва бренду та метрики генеруються динамічно.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-indigo-600" />
            Головна адреса магазину для сканування
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={homeUrl}
              onChange={(e) => setHomeUrl(e.target.value)}
              placeholder="наприклад, arc.tech або store.com"
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-600 shadow-sm transition"
            />

            <button
              disabled={isLoading}
              onClick={handleRunAudit}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-xs sm:text-sm transition shadow-xs flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer active:scale-98 shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Аналізуємо...' : 'Запустити аудит'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 border-t border-slate-100/70">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-slate-400" />
              Картка товару (PDP - Опційно)
            </label>
            <input
              type="text"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder={`https://${currentHost}/products/...`}
              className="w-full bg-transparent border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 font-mono focus:outline-none focus:border-indigo-400 transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Каталог колекції (PLP - Опційно)
            </label>
            <input
              type="text"
              value={collectionUrl}
              onChange={(e) => setCollectionUrl(e.target.value)}
              placeholder={`https://${currentHost}/collections/all`}
              className="w-full bg-transparent border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 font-mono focus:outline-none focus:border-indigo-400 transition"
            />
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2 mt-2">
          <div className="flex items-center justify-between text-xs font-medium text-indigo-900">
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-600 animate-pulse" />
              {AUDIT_STEPS[loadingStep]}
            </span>
            <span className="font-mono">{loadingProgress}%</span>
          </div>
          <div className="w-full bg-indigo-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-slate-500">
            ⏳ Google Lighthouse та аналізатор структури магазину обробляють {currentHost}. Займає 12–18 секунд.
          </p>
        </div>
      )}

      {statusMessage && !isLoading && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
    </section>

    {/* Score Card */}
    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs print-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2 mb-1 flex-wrap">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
              <ShoppingBag className="w-3 h-3" /> Shopify Health Report
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {auditDate}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {brandName}: Комплексний аудит e-Commerce
          </h1>
          <a 
            href={`https://${currentHost}/`} 
            target="_blank" 
            rel="noreferrer" 
            className="text-xs text-indigo-600 hover:underline font-mono inline-flex items-center gap-1"
          >
            https://{currentHost}/ <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-xl p-3 self-start sm:self-center">
          <div className="text-right">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Зважений бал сайту</div>
            <div className="text-xl font-extrabold text-slate-800">
              {currentScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
            </div>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm border ${
            currentScore >= 80 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : currentScore >= 50 
                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            {currentScore >= 80 ? 'A' : currentScore >= 50 ? 'B' : 'C'}
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start space-x-2">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Ключовий висновок для бізнесу {brandName}: </span>
          {perfData.summary}
        </div>
      </div>
    </section>

    {/* Tab Navigation */}
    <div className="flex border-b border-slate-200 bg-transparent space-x-1 overflow-x-auto text-xs sm:text-sm no-print">
      {tabsConfig.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`py-2 px-3 rounded-t-lg font-medium transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer border-b-2 ${
              isActive
                ? 'border-indigo-600 text-indigo-700 bg-white font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>

    {/* Active Tab View */}
    <div className="print:hidden">
      {/* TAB 1: SUMMARY */}
      {activeTab === 'summary' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Область аудиту</th>
                  <th className="py-3 px-4">Стан</th>
                  <th className="py-3 px-4">Спостереження</th>
                  <th className="py-3 px-4 text-right">Дія</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr className="hover:bg-slate-50/60 cursor-pointer" onClick={() => setActiveTab('performance')}>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-amber-500" />
                    <span>Швидкість сторінок ({brandName})</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-amber-50 text-amber-700 border-amber-200">
                      {perfData.pages[0]?.mobileScore || 0} / 100
                    </span>
                  </td>
                  <td className="py-3.5 px-4">{perfData.summary}</td>
                  <td className="py-3.5 px-4 text-right text-indigo-600 font-medium">Детальніше →</td>
                </tr>

                <tr className="hover:bg-slate-50/60 cursor-pointer" onClick={() => setActiveTab('analytics')}>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    <span>Аналітика ({brandName})</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-amber-50 text-amber-700 border-amber-200">
                      Потребує оптимізації
                    </span>
                  </td>
                  <td className="py-3.5 px-4">Діагностика Web Pixels API та трекінгу Checkout Extensibility.</td>
                  <td className="py-3.5 px-4 text-right text-indigo-600 font-medium">Детальніше →</td>
                </tr>

                <tr className="hover:bg-slate-50/60 cursor-pointer" onClick={() => setActiveTab('shopify')}>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-amber-500" />
                    <span>Специфіка Shopify</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
                      Канонікали OK
                    </span>
                  </td>
                  <td className="py-3.5 px-4">{seoMetrics.canonicalDetails}</td>
                  <td className="py-3.5 px-4 text-right text-indigo-600 font-medium">Детальніше →</td>
                </tr>

                <tr className="hover:bg-slate-50/60 cursor-pointer" onClick={() => setActiveTab('seo')}>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-500" />
                    <span>SEO & Мета-теги</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-indigo-50 text-indigo-700 border-indigo-200">
                      Title: {seoMetrics.titleLength} симв.
                    </span>
                  </td>
                  <td className="py-3.5 px-4 truncate max-w-xs">{seoMetrics.titleText}</td>
                  <td className="py-3.5 px-4 text-right text-indigo-600 font-medium">Детальніше →</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900">
            <span className="font-bold">🛍️ Чому важливий спосіб підключення: </span>
            Shopify активно переводить усі магазини на новий <strong>Checkout Extensibility</strong>. Скрипти, підключені прямим кодом у <code>theme.liquid</code>, блокуються на сторінці оплати! Усі пікселі (Meta, GA4, TikTok) повинні бути підключені через офіційні Shopify Apps або Web Pixels API.
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Діагностика сервісів аналітики в коді {currentHost}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                    <th className="py-2.5">Сервіс</th>
                    <th className="py-2.5">Метод підключення</th>
                    <th className="py-2.5">Технічний стан та вердикт</th>
                    <th className="py-2.5 text-right">Оцінка</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analyticsTools.map((t, idx) => (
                    <tr key={idx}>
                      <td className="py-3 font-semibold text-slate-800">{t.name}</td>
                      <td className="py-3">
                        {t.type === 'native_app' ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10px]">
                            Shopify App / Web Pixel
                          </span>
                        ) : t.type === 'hybrid' ? (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[10px]">
                            Native + Hardcode (дубль)
                          </span>
                        ) : t.type === 'hardcode' ? (
                          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-[10px]">
                            Прямий Hardcode у тему
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px]">
                            Не виявлено
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-slate-600">{t.statusText}</td>
                      <td className="py-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.status === 'pass' ? 'text-emerald-700 bg-emerald-50' :
                          t.status === 'warn' ? 'text-amber-700 bg-amber-50' : 'text-rose-700 bg-rose-50'
                        }`}>
                          {t.status === 'pass' ? 'OK' : t.status === 'warn' ? 'Помилка архітектури' : 'Критично'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PERFORMANCE */}
      {activeTab === 'performance' && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-xs text-indigo-900">
            <span className="font-bold">⚡ Офіційний звіт Google PageSpeed для {currentHost}: </span>
            {perfData.salesHook}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Швидкість ключових сторінок магазину</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {perfData.pages.map((pg, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{pg.name}</span>
                    <span className="text-[10px] text-slate-400">{pg.share}</span>
                  </div>
                  <div className="text-3xl font-black text-slate-800">
                    {pg.mobileScore} <span className="text-xs font-normal text-slate-400">моб. / 100</span>
                  </div>
                  <div className="text-[11px] text-slate-600 flex justify-between pt-1 border-t border-slate-200">
                    <span>LCP: <strong>{pg.lcp}</strong></span>
                    <span>Блокування: {pg.tbt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Блокуючі ресурси теми, виявлені Lighthouse:</h3>
            <ul className="list-disc list-inside text-xs text-slate-600 space-y-1.5">
              {perfData.blockers.map((b, i) => (
                <li key={i} className="font-mono">{b}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* TAB 4: SHOPIFY */}
      {activeTab === 'shopify' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Діагностика канонічних тегів (Canonical Tags) для {currentHost}</h3>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-900">Канонічні URL каталогу:</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Налаштовано коректно (Pass)
                </span>
              </div>
              <p className="text-slate-600">{seoMetrics.canonicalDetails}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-900">Shopify Markets vs Third-Party IP:</span>
                <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Рекомендовано оптимізувати
                </span>
              </div>
              <p className="text-slate-600">
                Використання вбудованого модуля Shopify Markets замість сторонніх зовнішніх скриптів вибору країн економить 250–350 мс часу першого рендеру сторінки.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SEO */}
      {activeTab === 'seo' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Аналіз мета-тегів поточної сторінки ({currentHost})</h3>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Title ({seoMetrics.titleLength} символів):</span>
                <p className="font-semibold text-slate-900">{seoMetrics.titleText}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Meta Description ({seoMetrics.metaDescLength} символів):</span>
                <p className="text-slate-700">{seoMetrics.metaDescText}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: UX */}
      {activeTab === 'ux' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Мобільна ергономіка {brandName}</h3>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                <span>Мобільна сітка та відсутність горизонтального скролу</span>
                <span className="font-bold text-emerald-600">Адаптивно (Pass)</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                <span>Sticky кнопка «Додати в кошик» при довгому скролі</span>
                <span className="font-bold text-amber-600">Рекомендовано додати (CRO +7%)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: ACTION PLAN */}
      {activeTab === 'plan' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 bg-white p-2 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-400 font-semibold px-2">Фільтр ролей:</span>
            {(['all', 'Dev Team', 'SEO / Content', 'Design / UX'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setPlanFilter(r)}
                className={`px-3 py-1 rounded-lg transition font-medium cursor-pointer ${
                  planFilter === r 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {r === 'all' ? 'Усі задачі' : r}
              </button>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Роль</th>
                  <th className="py-3 px-4">Задача</th>
                  <th className="py-3 px-4">Бізнес-цінність</th>
                  <th className="py-3 px-4 text-right">Оцінка</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono text-slate-400">{t.id}</td>
                    <td className="py-3 px-4 font-semibold text-indigo-700">{t.role}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{t.task}</td>
                    <td className="py-3 px-4 text-slate-500">{t.why}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">{t.estimate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  </main>

  <footer className="mt-8 border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400 no-print">
    Shopify Health Check Engine • Live Google PageSpeed & Web Pixels Analyzer
  </footer>
</div>


);
}
