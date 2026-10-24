import React from 'react';
import { Gauge, ShieldAlert, ShoppingBag, BarChart3 } from 'lucide-react';
import { TabType, PerformanceState, SeoMetricsState } from '../../types';

interface SummaryTabProps {
  brandName: string;
  perfData: PerformanceState;
  seoMetrics: SeoMetricsState;
  setActiveTab: (tab: TabType) => void;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({
  brandName,
  perfData,
  seoMetrics,
  setActiveTab
}) => {
  const pages = perfData.pages || [];
  const checks = seoMetrics.checks || [];
  const passedChecksCount = checks.filter(c => c.status === 'pass').length;

  return (
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
                  {passedChecksCount} / {checks.length || 6} тестів
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
  );
};
