import { Filter, SortAsc, Layers, Sparkles } from 'lucide-react';
import { useReviewStore } from '../../store/useReviewStore';
import { FeedbackCard } from './FeedbackCard';

export function FeedbackBoard() {
  const {
    feedbacks,
    filterSource,
    filterSentiment,
    sortBy,
    setFilterSource,
    setFilterSentiment,
    setSortBy,
    selectedFeedbackIds,
    clearFeedbackSelection,
  } = useReviewStore();

  let list = [...feedbacks];
  if (filterSource) list = list.filter((f) => f.source === filterSource);
  if (filterSentiment) list = list.filter((f) => f.sentiment === filterSentiment);
  list.sort((a, b) => {
    if (sortBy === 'heat') return b.heat - a.heat;
    if (sortBy === 'mentionCount') return b.mentionCount - a.mentionCount;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="flex-1 min-w-0 h-full flex flex-col border-r border-abyss-700/60">
      <div className="border-b border-abyss-700/50 bg-abyss-850/60 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h2 className="font-serif font-semibold text-ghost-500 tracking-wider">
              玩家反馈池
            </h2>
          </div>
          {selectedFeedbackIds.length > 0 && (
            <div className="ml-3 flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-sm bg-amber-900/40 border border-amber-700/50 text-amber-400">
                已选 {selectedFeedbackIds.length} 条
              </span>
              <button
                onClick={clearFeedbackSelection}
                className="text-[10px] text-ghost-900 hover:text-blood-400 transition-colors"
              >
                清除
              </button>
            </div>
          )}
          <div className="ml-auto text-[10px] text-ghost-900 tracking-widest uppercase">
            共 {list.length} 条反馈
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-ghost-900 tracking-wider uppercase flex items-center gap-1 mb-1">
              <Filter className="w-2.5 h-2.5" /> 来源平台
            </label>
            <select
              value={filterSource ?? ''}
              onChange={(e) => setFilterSource(e.target.value || null)}
              className="gothic-input !py-1 !text-xs"
            >
              <option value="">全部平台</option>
              <option value="steam">Steam</option>
              <option value="taptap">TapTap</option>
              <option value="weibo">微博</option>
              <option value="discord">Discord</option>
              <option value="official_forum">官方论坛</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-ghost-900 tracking-wider uppercase flex items-center gap-1 mb-1">
              <Sparkles className="w-2.5 h-2.5" /> 情感倾向
            </label>
            <select
              value={filterSentiment ?? ''}
              onChange={(e) => setFilterSentiment(e.target.value || null)}
              className="gothic-input !py-1 !text-xs"
            >
              <option value="">全部情感</option>
              <option value="negative">负面</option>
              <option value="neutral">中立</option>
              <option value="positive">正面</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-ghost-900 tracking-wider uppercase flex items-center gap-1 mb-1">
              <SortAsc className="w-2.5 h-2.5" /> 排序方式
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="gothic-input !py-1 !text-xs"
            >
              <option value="heat">热度优先</option>
              <option value="mentionCount">讨论量优先</option>
              <option value="createdAt">最新发布</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3">
        <div className="grid grid-cols-2 gap-2.5">
          {list.map((f) => (
            <FeedbackCard key={f.id} feedback={f} />
          ))}
        </div>
      </div>
    </div>
  );
}
