import React from 'react';

interface UxTabProps {
  brandName: string;
}

export const UxTab: React.FC<UxTabProps> = ({ brandName }) => {
  return (
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
  );
};
