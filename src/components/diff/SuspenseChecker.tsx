import { AlertTriangle, ChevronRight, Eye } from 'lucide-react';
import { useDiffStore } from '../../store/useDiffStore';

export function SuspenseChecker() {
  const { diffReport } = useDiffStore();
  if (!diffReport) return null;
  const warnings = diffReport.summary.suspenseWarnings;
  if (!warnings.length) return null;

  return (
    <div className="border-b border-abyss-700/60 bg-gradient-to-r from-blood-900/25 via-abyss-850 to-abyss-850 p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-blood-600/70 animate-pulse-slow" />
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 shrink-0 rounded-sm bg-blood-900/50 border border-blood-700/60 flex items-center justify-center animate-float">
          <AlertTriangle className="w-5 h-5 text-blood-400 animate-pulse-slow" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif font-semibold text-sm text-blood-300 tracking-wider mb-2 flex items-center gap-2">
            悬念完整性检查
            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-blood-900/60 border border-blood-700/60 text-blood-300">
              {warnings.length} 条警告
            </span>
          </h3>
          <ul className="space-y-1.5">
            {warnings.map((w, i) => (
              <li
                key={i}
                className="flex items-start gap-2 p-2 rounded-sm bg-abyss-900/50 border border-abyss-700/60 text-[11px] text-ghost-500 leading-relaxed hover:border-blood-700/50 cursor-pointer transition-colors group"
              >
                <ChevronRight className="w-3.5 h-3.5 mt-0.5 text-blood-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                <span className="flex-1">{w}</span>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 px-1.5 py-0.5 rounded-sm bg-blood-900/40 border border-blood-800/60 text-blood-400 text-[9px] flex items-center gap-1 hover:bg-blood-800/50">
                  <Eye className="w-2.5 h-2.5" />
                  定位
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
