import React from 'react';
import { ActionPlanTask } from '../../types';

interface PlanTabProps {
  filteredTasks: ActionPlanTask[];
  planFilter: 'all' | 'Dev Team' | 'SEO / Content' | 'Design / UX';
  setPlanFilter: (filter: 'all' | 'Dev Team' | 'SEO / Content' | 'Design / UX') => void;
}

export const PlanTab: React.FC<PlanTabProps> = ({
  filteredTasks,
  planFilter,
  setPlanFilter
}) => {
  return (
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
  );
};
