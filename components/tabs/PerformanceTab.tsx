import React from 'react';
import { PerformanceState } from '../../types';

interface PerformanceTabProps {
  perfData: PerformanceState;
  currentHost: string;
}

export const PerformanceTab: React.FC<PerformanceTabProps> = ({
  perfData,
  currentHost
}) => {
  const pages = perfData.pages || [];

  return (
    <div className="space-y-4">
      {/* Інформаційний висновок PageSpeed */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-xs text-indigo-900">
        <span className="font-bold">⚡ Офіційний звіт Google PageSpeed для {currentHost}: </span>
        {perfData.salesHook}
      </div>

      {/* Мобільні оцінки 3 ключових типів сторінок */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3">
          Швидкість ключових типів сторінок магазину (Mobile Lighthouse)
        </h3>
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

      {/* Список виявлених блокуючих ресурсів */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-2">
          Блокуючі ресурси теми, виявлені Lighthouse:
        </h3>
        <ul className="list-disc list-inside text-xs text-slate-600 space-y-1.5">
          {perfData.blockers.map((b, i) => (
            <li key={i} className="font-mono">{b}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
