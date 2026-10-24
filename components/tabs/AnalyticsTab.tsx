import React from 'react';
import { ToolStatus } from '../../types';

interface AnalyticsTabProps {
  analyticsTools: ToolStatus[];
  currentHost: string;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  analyticsTools,
  currentHost
}) => {
  return (
    <div className="space-y-4">
      {/* Інформаційне повідомлення про Checkout Extensibility */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900">
        <span className="font-bold">🛍️ Чому важливий спосіб підключення: </span>
        Shopify активно переводить усі магазини на новий <strong>Checkout Extensibility</strong>. Скрипти, підключені прямим кодом у <code>theme.liquid</code>, блокуються на сторінці оплати! Усі пікселі (Meta, GA4, TikTok) повинні бути підключені через офіційні Shopify Apps або Web Pixels API.
      </div>

      {/* Таблиця виявлених аналітичних інструментів */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3">
          Діагностика сервісів аналітики в коді {currentHost}
        </h3>
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
                      t.status === 'pass' 
                        ? 'text-emerald-700 bg-emerald-50' 
                        : t.status === 'warn' 
                          ? 'text-amber-700 bg-amber-50' 
                          : 'text-rose-700 bg-rose-50'
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
  );
};
