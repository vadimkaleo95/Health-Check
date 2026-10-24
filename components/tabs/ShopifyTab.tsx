import React from 'react';
import { SeoMetricsState } from '../../types';

interface ShopifyTabProps {
  seoMetrics: SeoMetricsState;
  currentHost: string;
}

export const ShopifyTab: React.FC<ShopifyTabProps> = ({
  seoMetrics,
  currentHost
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900">
          Діагностика канонічних тегів (Canonical Tags) для {currentHost}
        </h3>
        
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
  );
};
