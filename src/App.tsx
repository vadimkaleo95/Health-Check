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
  Globe, 
  Activity, 
  ExternalLink,
  Terminal,
  AlertCircle,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { TabType, ToolStatus, PerformanceState, SeoMetricsState, ActionPlanTask } from './types';
import { applyNetworkEvidence } from './analyticsDetect';
import { extractDomainInfo, parseStoreHtml, runGooglePageSpeed, generateDynamicFallback, AuditLog } from './auditEngine';
import { AuditTabs } from './AuditTabs';

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

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Журнал діагностики для відлагодження
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      source: 'Google PageSpeed',
      status: 'success',
      message: 'Система готова до запуску. Введіть адресу Shopify магазину.',
      timestamp: 'Старт'
    }
  ]);
  const [showDevLogs, setShowDevLogs] = useState(true);

  const [activeTab, setActiveTab] = useState<TabType>('summary');
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

  const [perfData, setPerfData] = useState<PerformanceState>({
    status: "warning",
    statusLabel: "Потребує уваги",
    summary: "Офіційний Google PageSpeed: оцінка 58/100, LCP 3.9 c.",
    salesHook: "⚡ Кожна додаткова секунда затримки мобільного першого екрана зрізає конверсію на 7-10%.",
    pages: [
      { name: "Головна сторінка (Google Lighthouse Live)", type: "Home", mobileScore: 58, desktopScore: 92, lcp: "3.9 c", tbt: "480 мс", a11y: 96, share: "Основний вхід" }
    ],
    blockers: [
      "Синхронні JS-скрипти теми блокують First Contentful Paint",
      "CSS файли шрифтів та модулів кошика завантажуються без відкладення"
    ]
  });

  const [seoMetrics, setSeoMetrics] = useState<SeoMetricsState>({
    titleText: "Gunia Project — Офіційний інтернет-магазин виробів ручної роботи",
    titleLength: 64,
    metaDescText: "Автентична кераміка, прикраси та аксесуари ручної роботи з традиційними українськими мотивами.",
    metaDescLength: 98,
    canonicalStatus: "pass",
    canonicalDetails: "Тег <link rel=\"canonical\"> налаштовано коректно."
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

    const newLogs: AuditLog[] = [];

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
      const { seo, tools, log: htmlLog } = await parseStoreHtml(cleanHome, host, brand);
      setSeoMetrics(seo);
      setAnalyticsTools(tools);
      detectedTools = tools;
      newLogs.push(htmlLog);
    } catch (e: any) {
      newLogs.push({
        source: 'HTML Proxy',
        status: 'error',
        message: `Помилка аналізу вихідного коду: ${e?.message || 'невідома помилка'}`,
        timestamp: new Date().toLocaleTimeString('uk-UA')
      });
    }

    try {
      setLoadingStep(1);
      const { perfData: livePerf, finalScore, networkUrls, log: pageSpeedLog } = await runGooglePageSpeed(cleanHome, host, brand);
      setPerfData(livePerf);
      setCurrentScore(finalScore);
      newLogs.push(pageSpeedLog);

      if (detectedTools.length && networkUrls.length) {
        setAnalyticsTools(applyNetworkEvidence(detectedTools, networkUrls));
        newLogs.push({
          source: 'Analytics Scanner',
          status: 'success',
          message: `Звірено результати з ${networkUrls.length} мережевими викликами Lighthouse.`,
          timestamp: new Date().toLocaleTimeString('uk-UA')
        });
      }
      setStatusMessage(`Аудит для ${host} успішно сформовано наживо через Google PageSpeed!`);
    } catch (err: any) {
      const { perfData: fallbackPerf, finalScore: fallbackScore, log: fallbackLog } = generateDynamicFallback(host, brand, err?.message || 'Timeout / Rate limit');
      setPerfData(fallbackPerf);
      setCurrentScore(fallbackScore);
      newLogs.push(fallbackLog);
      setStatusMessage(`Аудит для ${host} сформовано (застосовано резервну оцінку через збій Google API)!`);
    } finally {
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setAuditLogs(newLogs);
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
    <div className="min-h-screen bg-slate-50/70 text-slate-900 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
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
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        
        {/* Input Bar */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <Search className="w-3.5 h-3.5 text-indigo-600" />
                <span>Аналіз магазину</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Введіть адресу Shopify магазину. Звіт, назва бренду та метрики генеруються в реальному часі.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-600" />
                Адреса магазину для сканування
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
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
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
        <div className="flex border-b border-slate-200 bg-transparent space-x-1 overflow-x-auto text-xs sm:text-sm">
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

        {/* Dynamic Tab Views rendered from AuditTabs */}
        <AuditTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          brandName={brandName}
          currentHost={currentHost}
          perfData={perfData}
          seoMetrics={seoMetrics}
          analyticsTools={analyticsTools}
          filteredTasks={filteredTasks}
          planFilter={planFilter}
          setPlanFilter={setPlanFilter}
        />

        {/* Секція діагностики джерел даних (System Health & Developer Logs) */}
        <section className="bg-slate-900 text-slate-200 border border-slate-800 rounded-2xl p-4 shadow-sm text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-slate-100 tracking-tight">
                Діагностика джерел даних (Dev / QA Mode)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                Автоматичний контроль правдивості
              </span>
            </div>

            <button
              onClick={() => setShowDevLogs(!showDevLogs)}
              className="text-[11px] text-slate-400 hover:text-indigo-400 transition cursor-pointer"
            >
              {showDevLogs ? 'Приховати логи' : 'Показати деталі'}
            </button>
          </div>

          {showDevLogs && (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-400">
                ℹ️ Цей блок показує, чи вдалося отримати пряму відповідь від Google Lighthouse та завантажити вихідний HTML магазину без блокувань Cloudflare.
              </p>

              <div className="space-y-1.5 font-mono text-[11px]">
                {auditLogs.map((log, i) => (
                  <div 
                    key={i} 
                    className={`p-2.5 rounded-lg border flex items-start space-x-2.5 ${
                      log.status === 'success' 
                        ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' 
                        : log.status === 'warning' 
                          ? 'bg-amber-950/40 border-amber-800/60 text-amber-300' 
                          : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                    }`}
                  >
                    {log.status === 'success' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />}
                    {log.status === 'warning' && <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />}
                    {log.status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />}
                    
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold uppercase tracking-wider text-[10px]">
                          [{log.source}]
                        </span>
                        <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                      </div>
                      <p className="leading-relaxed">{log.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

      </main>

      <footer className="mt-8 border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        Shopify Health Check Engine • Live Google PageSpeed & Web Pixels Analyzer
      </footer>
    </div>
  );
}
