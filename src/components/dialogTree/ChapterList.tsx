import { Search, Flame, BookOpen, Sparkles, Puzzle, Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import { useDialogStore } from '../../store/useDialogStore';
import type { ChapterType } from '../../types';

const typeMeta: Record<ChapterType, { label: string; icon: typeof BookOpen; color: string; }> = {
  main: { label: '主线', icon: BookOpen, color: 'text-blood-400' },
  side: { label: '番外', icon: Sparkles, color: 'text-void-500' },
  event: { label: '活动', icon: Calendar, color: 'text-amber-400' },
  dlc: { label: 'DLC', icon: Puzzle, color: 'text-ghost-700' },
};

export function ChapterList() {
  const {
    chapters,
    currentChapterId,
    searchKeyword,
    filterControversy,
    selectChapter,
    setSearchKeyword,
    setFilterControversy,
  } = useDialogStore();

  const filtered = chapters.filter((c) => {
    if (searchKeyword && !c.title.toLowerCase().includes(searchKeyword.toLowerCase())) return false;
    if (filterControversy !== null && c.controversy < filterControversy) return false;
    return true;
  });

  const grouped = {
    main: filtered.filter((c) => c.type === 'main'),
    side: filtered.filter((c) => c.type === 'side'),
    event: filtered.filter((c) => c.type === 'event'),
    dlc: filtered.filter((c) => c.type === 'dlc'),
  };

  return (
    <div className="w-72 shrink-0 h-full bg-abyss-900/60 border-r border-abyss-700/60 flex flex-col">
      <div className="p-4 border-b border-abyss-700/50 space-y-3">
        <h2 className="font-serif font-semibold text-base text-ghost-500 tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blood-400" />
          章节目录
        </h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ghost-900" />
          <input
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索章节名称…"
            className="gothic-input pl-8 !py-1.5 text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <Flame className="w-3.5 h-3.5 text-blood-500 shrink-0" />
          <span className="text-[10px] text-ghost-900 tracking-wider shrink-0">争议度 ≥</span>
          <input
            type="range"
            min={0}
            max={100}
            value={filterControversy ?? 0}
            onChange={(e) => setFilterControversy(e.target.value === '0' ? null : Number(e.target.value))}
            className="flex-1 accent-blood-600 h-1"
          />
          <span className="text-[10px] text-blood-400 font-medium w-7 text-right">
            {filterControversy ?? 0}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-4">
        {(Object.keys(grouped) as ChapterType[]).map((type) => {
          const items = grouped[type];
          if (!items.length) return null;
          const meta = typeMeta[type];
          const TypeIcon = meta.icon;
          return (
            <div key={type}>
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <TypeIcon className={clsx('w-3 h-3', meta.color)} />
                <span className={clsx('text-[10px] font-medium tracking-[0.15em] uppercase', meta.color)}>
                  {meta.label}章节
                </span>
                <span className="ml-auto text-[10px] text-ghost-900">{items.length}</span>
              </div>
              <div className="space-y-1.5">
                {items
                  .sort((a, b) => a.order - b.order)
                  .map((c) => {
                    const isActive = c.id === currentChapterId;
                    const controversyHigh = c.controversy >= 70;
                    return (
                      <button
                        key={c.id}
                        onClick={() => selectChapter(c.id)}
                        className={clsx(
                          'w-full text-left p-2.5 rounded-[2px] transition-all duration-200 group relative overflow-hidden',
                          isActive
                            ? 'bg-blood-800/20 border border-blood-700/50'
                            : 'bg-abyss-850/40 border border-abyss-700/40 hover:border-abyss-600/70 hover:bg-abyss-800/60'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p
                              className={clsx(
                                'text-xs font-medium truncate',
                                isActive ? 'text-ghost-300 text-glow-red' : 'text-ghost-500'
                              )}
                            >
                              {c.title}
                            </p>
                            <p className="mt-1 text-[10px] text-ghost-900 flex items-center gap-2">
                              <span>{c.nodeCount} 节点</span>
                              <span>·</span>
                              <span className="truncate">{c.lastUpdated}</span>
                            </p>
                          </div>
                          <div
                            className={clsx(
                              'shrink-0 px-1.5 py-0.5 rounded-sm text-[10px] font-semibold tracking-wider',
                              controversyHigh
                                ? 'bg-blood-900/60 text-blood-400 border border-blood-800/70 animate-pulse-slow'
                                : 'bg-abyss-700/50 text-ghost-700 border border-abyss-600/60'
                            )}
                          >
                            {c.controversy}
                          </div>
                        </div>
                        <div className="mt-2 h-[3px] bg-abyss-700/60 rounded-full overflow-hidden">
                          <div
                            className={clsx(
                              'h-full transition-all duration-500',
                              controversyHigh
                                ? 'bg-gradient-to-r from-blood-800 via-blood-500 to-blood-300'
                                : c.controversy >= 40
                                ? 'bg-gradient-to-r from-amber-800 to-amber-500'
                                : 'bg-gradient-to-r from-moss-800 to-moss-600'
                            )}
                            style={{ width: `${c.controversy}%` }}
                          />
                        </div>
                        <span className="absolute top-1 right-1 text-[9px] text-ghost-900/70 font-mono">
                          {c.version}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-10 text-center text-xs text-ghost-900">无匹配章节</div>
        )}
      </div>
    </div>
  );
}
