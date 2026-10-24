import React from 'react';
import { Search, Loader2, Globe } from 'lucide-react';

interface AuditInputProps {
  inputUrl: string;
  setInputUrl: (url: string) => void;
  isLoading: boolean;
  onRunAudit: (e?: React.FormEvent) => void;
}

export const AuditInput: React.FC<AuditInputProps> = ({
  inputUrl,
  setInputUrl,
  isLoading,
  onRunAudit
}) => {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
      <form onSubmit={onRunAudit} className="space-y-3">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Адреса магазину Shopify:
        </label>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="наприклад, gymshark.com або allbirds.com"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !inputUrl.trim()}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-xs disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Сканування...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Запустити аудит</span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
};
