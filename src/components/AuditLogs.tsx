import React from 'react';
import { Terminal } from 'lucide-react';
import { AuditLog } from '../auditEngine';

interface AuditLogsProps {
  logs: AuditLog[];
}

export const AuditLogs: React.FC<AuditLogsProps> = ({ logs }) => {
  if (logs.length === 0) return null;

  return (
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
            <span
              className={`font-semibold ${
                lg.status === 'success'
                  ? 'text-emerald-400'
                  : lg.status === 'warning'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {lg.source}:
            </span>
            <span className="text-slate-300">{lg.message}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
