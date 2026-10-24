import React, { useState } from 'react';
import { 
  Search, 
  Loader2, 
  AlertCircle, 
  Sparkles, 
  RefreshCw, 
  Terminal, 
  CheckCircle2, 
  Globe, 
  ShieldCheck 
} from 'lucide-react';
import { TabType, ToolStatus, PerformanceState, SeoMetricsState, ActionPlanTask } from './types';
import { extractDomainInfo, parseStoreHtml, runGooglePageSpeed, AuditLog } from './auditEngine';
import { AuditTabs } from './AuditTabs';

const INITIAL_TASKS: ActionPlanTask[] = [
  {
    id: 1,
    role: 'Dev Team',
    task: 'Міграція пікселів з theme.liquid на Web Pixels API',
    why: 'Запобігає втраті даних конверсій на новому Checkout Extensibility',
    estimate: '3–4 год'
  },
  {
    id: 2,
    role: 'Dev Team',
    task: 'Відкладене завантаження сторонніх маркетингових скриптів (defer/async)',
    why: 'Знижує Total Blocking Time (TBT) на мобільних пристроях',
    estimate: '2–3 год'
  },
  {
    id: 3,
    role: 'SEO / Content',
    task: 'Усунення дублювання H1 на головній сторінці (переведення логотипу на div/span)',
    why: 'Фокусує релевантність сторінки для пошукових ботів Google',
    estimate: '1 год'
  },
  {
    id: 4,
    role: 'Design / UX',
    task: 'Впровадження Sticky-кнопки «Додати в кошик» для мобільної картки товару',
    why: 'Збільшує мобільний CTR переходу до оформлення замовлення до +7%',
    estimate: '2 год'
  }
];

export const App: React.FC = () => {
  const [inputUrl, setInputUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasAudited, setHasAudited] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Стан результатів
  const [currentHost, setCurrentHost] = useState('');
  const [brandName, setBrandName] = useState('');
  const [finalScore, setFinalScore] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [logs, setLogs] = useState<AuditLog[]>([]);

  // Дані вкладок
  const [perfData, setPerfData] = useState<PerformanceState>({
    status: 'good',
    statusLabel: 'Очікує перевірки',
    summary: '',
    salesHook: '',
    pages: [],
    blockers: []
  });

  const [seoMetrics, setSeoMetrics] = useState<SeoMetricsState>({
    titleText: '',
    titleLength: 0,
    metaDescText: '',
    metaDescLength: 0,
    canonicalStatus: 'pass',
    canonicalDetails: '',
    h1Count: 0,
    h1Text: '',
    schemaTypes: [],
    hasOgImage: false,
    hreflangCount: 0,
    robotsDirectives: '',
    aiReadinessSummary: '',
    checks: []
  });

  const [analyticsTools, setAnalyticsTools] = useState<ToolStatus[]>([]);
  const [tasks] = useState<ActionPlanTask[]>(INITIAL_TASKS);
  const [planFilter, setPlanFilter] = useState<'all' | 'Dev Team' | 'SEO / Content' | 'Design / UX'>('all');

  const filteredTasks = tasks.filter(t => planFilter === 'all' || t.role === planFilter);

  const handleRunAudit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputUrl.trim()) return;

    setIsLoading(true);
    setError(null);
    setLogs([]);

    const { host, brand } = extractDomainInfo(inputUrl);
    setCurrentHost(host);
    setBrandName(brand);

    const targetUrl = inputUrl.trim().startsWith('http') 
      ? inputUrl.trim() 
      : `https://${inputUrl.trim()}`;

    try {
      // 1. Аналіз публічного HTML та технічного SEO
      const htmlResult = await parseStoreHtml(targetUrl, host, brand);
      setSeoMetrics(htmlResult.seo);
      setAnalyticsTools(htmlResult.tools);
      setLogs(prev => [...prev, htmlResult.log]);

      // 2. Реальний аудит продуктивності Google PageSpeed
      const speedResult = await runGooglePageSpeed(targetUrl, host, brand, htmlResult.subpages);
      setPerfData(speedResult.perfData);
      setFinalScore(speedResult.finalScore);
      setLogs(prev => [...prev, speedResult.log]);

      setHasAudited(true);
    } catch (err: any) {
      const message = err?.message || 'Не вдалося виконати сканування домену.';
      setError(message);
      setLogs(prev => [
        ...prev,
        {
          source: 'HTML Proxy',
          status: 'error',
          message,
          timestamp: new Date().toLocaleTimeString('uk-UA')
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const tabsConfig: { id: TabType; label: string }[] = [
    { id: 'summary', label: 'Підсумок' },
    { id: 'performance', label: 'Швидкість' },
    { id: 'analytics', label: 'Аналітика' },
    { id: 'shopify', label: 'Shopify' },
    { id: 'seo', label: 'SEO & AI' },
    { id: 'ux', label: 'UX / CRO' },
    { id: 'plan', label: 'План робіт' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      {/* Верхня навігаційна панель */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-xs">
              🛍️
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm tracking-tight block">
                Shopify Health Check
              </span>
              <span className="text-[11px] text-slate-500 block">
                Технічний, швидкісний та AI-аудит вітрини
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Real-time аудит без симуляцій</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-8 space-y-6">
        {/* Поле запуску аудиту */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <form onSubmit={handleRunAudit} className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Адреса магазину Shopify:
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="наприклад, gymshark.com або allbirds.com"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !inputUrl.trim()}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-xs disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Сканування...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Запустити аудит</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Сповіщення про помилку без застосування фіктивних даних */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-3 text-rose-900 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Помилка отримання фактичних даних:</span>
              <p className="leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Результати аудиту */}
        {hasAudited && (
          <div className="space-y-6">
            {/* Головна картка загальної оцінки */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold text-slate-900">{brandName}</h2>
                  <span className="font-mono text-xs text-slate-400">({currentHost})</span>
                </div>
                <p className="text-xs text-slate-600">{perfData.summary}</p>
              </div>

              <div className="flex items-center gap-4 bg-slate-50 px-5 py-3 rounded-xl border border-slate-100 self-start sm:self-auto">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                    Mobile Speed
                  </span>
                  <span className="text-2xl font-black text-slate-900">
                    {finalScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
                  </span>
                </div>
                <div className={`w-3 h-10 rounded-full ${
                  finalScore >= 75 ? 'bg-emerald-500' : finalScore >= 45 ? 'bg-amber-500' : 'bg-rose-500'
                }`} />
              </div>
            </div>

            {/* Навігація вкладками */}
            <nav className="flex space-x-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs">
              {tabsConfig.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 rounded-xl font-semibold transition whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Контейнер вмісту вкладок */}
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
          </div>
        )}

        {/* Системний журнал перевірки */}
        {logs.length > 0 && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-300 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px] text-slate-400">
              <div className="flex items-center space-x-2">
                <Terminal className="w-3.5 h-3.5" />
                <span>Журнал викликів сканера (Audit Logs)</span>
              </div>
              <span>Всього операцій: {logs.length}</span>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pt-1">
              {logs.map((lg, i) => (
                <div key={i} className="flex items-start space-x-2 text-[11px]">
                  <span className="text-slate-500">[{lg.timestamp}]</span>
                  <span className={`font-semibold ${
                    lg.status === 'success' ? 'text-emerald-400' : 
                    lg.status === 'warning' ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {lg.source}:
                  </span>
                  <span className="text-slate-300">{lg.message}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
