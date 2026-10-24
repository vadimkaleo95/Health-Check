import React from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { TabType } from './types';
import { useAudit } from './hooks/useAudit';
import { AuditInput } from './components/AuditInput';
import { AuditLogs } from './components/AuditLogs';
import { AuditTabs } from './AuditTabs';

const TABS_CONFIG: { id: TabType; label: string }[] = [
  { id: 'summary', label: 'Підсумок' },
  { id: 'performance', label: 'Швидкість' },
  { id: 'analytics', label: 'Аналітика' },
  { id: 'shopify', label: 'Shopify' },
  { id: 'seo', label: 'SEO & AI' },
  { id: 'ux', label: 'UX / CRO' },
  { id: 'plan', label: 'План робіт' }
];

export const App: React.FC = () => {
  const {
    inputUrl,
    setInputUrl,
    isLoading,
    hasAudited,
    error,
    currentHost,
    brandName,
    finalScore,
    activeTab,
    setActiveTab,
    logs,
    perfData,
    seoMetrics,
    analyticsTools,
    planFilter,
    setPlanFilter,
    filteredTasks,
    handleRunAudit
  } = useAudit();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      {/* Шапка сервісу */}
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
        {/* Форма пошуку */}
        <AuditInput
          inputUrl={inputUrl}
          setInputUrl={setInputUrl}
          isLoading={isLoading}
          onRunAudit={handleRunAudit}
        />

        {/* Повідомлення про помилку */}
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
            {/* Головна картка оцінки */}
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
                <div
                  className={`w-3 h-10 rounded-full ${
                    finalScore >= 75
                      ? 'bg-emerald-500'
                      : finalScore >= 45
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                />
              </div>
            </div>

            {/* Навігація вкладками */}
            <nav className="flex space-x-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs">
              {TABS_CONFIG.map((tab) => (
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

            {/* Вміст вкладок */}
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

        {/* Системний журнал дій */}
        <AuditLogs logs={logs} />
      </main>
    </div>
  );
};
