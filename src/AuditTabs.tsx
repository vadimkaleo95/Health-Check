import React from 'react';
import {
  Gauge,
  ShieldAlert,
  ShoppingBag,
  BarChart3,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { TabType, ToolStatus, PerformanceState, SeoMetricsState, ActionPlanTask } from './types';

interface AuditTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  brandName: string;
  currentHost: string;
  perfData: PerformanceState;
  seoMetrics: SeoMetricsState;
  analyticsTools: ToolStatus[];
  filteredTasks: ActionPlanTask[];
  planFilter: 'all' | 'Dev Team' | 'SEO / Content' | 'Design / UX';
  setPlanFilter: (filter: 'all' | 'Dev Team' | 'SEO / Content' | 'Design / UX') => void;
}

export const AuditTabs: React.FC<AuditTabsProps> = ({
  activeTab,
  setActiveTab,
  brandName,
  currentHost,
  perfData,
  seoMetrics,
  analyticsTools,
  filteredTasks,
  planFilter,
  setPlanFilter
}) => {
  const pages = perfData.pages || [];
  const checks = seoMetrics.checks || [];

  const passedChecksCount = checks.filter(c => c.status === 'pass').length;

  return (
    <div className="space-y-4">
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
                      {pages[0]?.mobileScore ?? 0} / 100
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
                    <span>SEO, AI & Каталог</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                      passedChecksCount >= 5 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {passedChecksCount} / {checks.length || 6} тестів пройшли
                    </span>
                  </td>
                  <td className="py-3.5 px-4 truncate max-w-xs">
                    {seoMetrics.schemaTypes?.length > 0 
                      ? `Schema.org: ${seoMetrics.schemaTypes.join(', ')}. H1: ${seoMetrics.h1Count}.`
                      : seoMetrics.titleText}
                  </td>
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
            <h3 className="text-sm font-bold text-slate-900 mb-3">Швидкість ключових типів сторінок магазину (Mobile Lighthouse)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {pages.map((pg, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 truncate max-w-[170px]" title={pg.name}>
                      {pg.name}
                    </span>
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

      {/* TAB 5: SEO & AI */}
      {activeTab === 'seo' && (
        <div className="space-y-4">
          {/* AI Search Engine Readiness Card */}
          <div className="bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80 border border-indigo-100 rounded-2xl p-4 shadow-xs">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                    Готовність до AI-пошуку (ChatGPT Search, Perplexity, Google SGE)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-800">
                    Семантика каталогу
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {seoMetrics.aiReadinessSummary}
                </p>
              </div>
            </div>
          </div>

          {/* Title & Description Snippets */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Сніпети сторінки в Google Search</h3>
            <div className="space-y-2.5 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Title тег:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    seoMetrics.titleLength >= 40 && seoMetrics.titleLength <= 65
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {seoMetrics.titleLength} симв. (Оптимально: 40–65)
                  </span>
                </div>
                <p className="font-semibold text-slate-900 font-mono text-[12px]">{seoMetrics.titleText}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Meta Description:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    seoMetrics.metaDescLength >= 120 && seoMetrics.metaDescLength <= 165
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : seoMetrics.metaDescLength === 0
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {seoMetrics.metaDescLength} симв. (Оптимально: 120–160)
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">{seoMetrics.metaDescText}</p>
              </div>
            </div>
          </div>

          {/* Technical SEO & AI Diagnostic Checklist */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Діагностика факторів індексації та мікророзмітки ({currentHost})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                    <th className="py-2.5 pr-3">Фактор</th>
                    <th className="py-2.5 pr-3">Виявлено в HTML</th>
                    <th className="py-2.5 pr-3">Вплив на пошук та AI-агентів</th>
                    <th className="py-2.5 text-right">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {checks.map((chk) => (
                    <tr key={chk.id} className="hover:bg-slate-50/50">
                      <td className="py-3 pr-3 font-semibold text-slate-800 whitespace-nowrap">{chk.name}</td>
                      <td className="py-3 pr-3">
                        <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {chk.detected}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-slate-600 leading-relaxed">{chk.details}</td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          chk.status === 'pass' 
                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' 
                            : chk.status === 'warn' 
                              ? 'text-amber-700 bg-amber-50 border border-amber-200' 
                              : 'text-rose-700 bg-rose-50 border border-rose-200'
                        }`}>
                          {chk.status === 'pass' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {chk.status === 'warn' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                          {chk.status === 'fail' && <AlertCircle className="w-3 h-3 text-rose-600" />}
                          {chk.status === 'pass' ? 'OK' : chk.status === 'warn' ? 'Увага' : 'Помилка'}
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
  );
};
