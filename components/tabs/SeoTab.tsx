import React from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { SeoMetricsState } from '../../types';

interface SeoTabProps {
  seoMetrics: SeoMetricsState;
  currentHost: string;
}

export const SeoTab: React.FC<SeoTabProps> = ({
  seoMetrics,
  currentHost
}) => {
  const checks = seoMetrics.checks || [];

  return (
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
  );
};
