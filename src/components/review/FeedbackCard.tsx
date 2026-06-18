import { Flame, MessageCircle, Check, User, Clock, Link2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useReviewStore } from '../../store/useReviewStore';
import type { PlayerFeedback, FeedbackSource, Sentiment } from '../../types';

const sourceMeta: Record<FeedbackSource, { label: string; color: string; }> = {
  steam: { label: 'Steam', color: 'bg-[#1b2838] border-[#66c0f4]/40 text-[#66c0f4]' },
  taptap: { label: 'TapTap', color: 'bg-[#1a2e1a] border-moss-600/40 text-moss-400' },
  weibo: { label: '微博', color: 'bg-[#3d0a0a] border-blood-600/40 text-blood-400' },
  discord: { label: 'Discord', color: 'bg-[#1a0a2e] border-void-600/40 text-void-400' },
  official_forum: { label: '官方论坛', color: 'bg-[#2e2a1a] border-amber-600/40 text-amber-400' },
};

const sentimentMeta: Record<Sentiment, { label: string; color: string; icon: string; }> = {
  negative: { label: '负面', color: 'text-blood-400', icon: '😠' },
  neutral: { label: '中立', color: 'text-ghost-700', icon: '😐' },
  positive: { label: '正面', color: 'text-moss-400', icon: '😍' },
};

interface Props {
  feedback: PlayerFeedback;
}

export function FeedbackCard({ feedback }: Props) {
  const { selectedFeedbackIds, toggleFeedbackSelection } = useReviewStore();
  const isSelected = selectedFeedbackIds.includes(feedback.id);
  const src = sourceMeta[feedback.source];
  const sent = sentimentMeta[feedback.sentiment];
  const isHot = feedback.heat >= 85;

  return (
    <div
      onClick={() => toggleFeedbackSelection(feedback.id)}
      className={clsx(
        'gothic-card p-3 cursor-pointer transition-all duration-200 relative group',
        isSelected && 'border-amber-500/60 shadow-glow-amber',
        isHot && 'border-blood-700/50',
        isHot && !isSelected && 'animate-pulse-slow'
      )}
    >
      {isSelected && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-abyss-950 flex items-center justify-center shadow-glow-amber z-10">
          <Check className="w-3 h-3" />
        </div>
      )}
      {isHot && (
        <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm bg-blood-900/60 border border-blood-700/60 z-[1]">
          <Flame className="w-2.5 h-2.5 text-blood-400" />
          <span className="text-[9px] text-blood-300 font-bold">{feedback.heat}</span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full bg-void-800/80 border border-void-700/60 flex items-center justify-center text-[11px] font-serif font-semibold text-ghost-500 shrink-0 overflow-hidden">
          {feedback.author.slice(0, 1)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-ghost-500 truncate flex items-center gap-1.5">
            <User className="w-2.5 h-2.5 text-ghost-900 shrink-0" />
            {feedback.author}
            <span className={clsx('text-[9px]', sent.color)}>{sent.icon}</span>
          </p>
          <p className="text-[9px] text-ghost-900 flex items-center gap-1">
            <Clock className="w-2 h-2" />
            {feedback.createdAt}
            <span className="mx-1">·</span>
            <MessageCircle className="w-2 h-2" />
            {feedback.mentionCount} 讨论
          </p>
        </div>
      </div>

      <p className="text-xs text-ghost-500 leading-relaxed mb-2.5 line-clamp-3">
        {feedback.content}
      </p>

      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        {feedback.keywords.slice(0, 4).map((kw, i) => (
          <span
            key={i}
            className="px-1.5 py-0.5 text-[9px] rounded-sm bg-abyss-700/50 border border-abyss-600/60 text-ghost-700"
          >
            #{kw}
          </span>
        ))}
        {feedback.keywords.length > 4 && (
          <span className="text-[9px] text-ghost-900">+{feedback.keywords.length - 4}</span>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-abyss-700/40">
        <span className={clsx('text-[9px] px-1.5 py-0.5 rounded-sm border', src.color)}>
          {src.label}
        </span>
        {feedback.relatedNodeId ? (
          <span className="text-[9px] text-amber-400 flex items-center gap-1">
            <Link2 className="w-2 h-2" />
            {feedback.relatedNodeId}
          </span>
        ) : (
          <button className="text-[9px] text-ghost-900 group-hover:text-amber-400 transition-colors flex items-center gap-1">
            <Link2 className="w-2 h-2" />
            关联节点
          </button>
        )}
      </div>
    </div>
  );
}
