import { clsx } from 'clsx';
import { CheckCircle2, Clock, XCircle, Play, User, GitBranch, History } from 'lucide-react';
import { useReviewStore } from '../../store/useReviewStore';
import type { TodoStatus, TodoPriority } from '../../types';

const statusMeta: Record<TodoStatus, { label: string; color: string; icon: typeof Play; }> = {
  pending: { label: '待处理', color: 'text-ghost-700 bg-abyss-700/60 border-abyss-600/60', icon: Clock },
  processing: { label: '处理中', color: 'text-amber-400 bg-amber-900/40 border-amber-700/50 animate-pulse-slow', icon: Play },
  resolved: { label: '已解决', color: 'text-moss-400 bg-moss-800/50 border-moss-700/50', icon: CheckCircle2 },
  rejected: { label: '已拒绝', color: 'text-ghost-900 bg-abyss-700/40 border-abyss-600/50', icon: XCircle },
};

const priorityColor: Record<TodoPriority, string> = {
  low: 'border-l-moss-600/60',
  medium: 'border-abyss-600/60',
  high: 'border-l-amber-600/70',
  urgent: 'border-l-blood-500/80',
};

export function TodoList() {
  const { todos, updateTodoStatus } = useReviewStore();

  const byStatus = {
    pending: todos.filter((t) => t.status === 'pending'),
    processing: todos.filter((t) => t.status === 'processing'),
    resolved: todos.filter((t) => t.status === 'resolved'),
    rejected: todos.filter((t) => t.status === 'rejected'),
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3 space-y-3">
      <h3 className="section-title flex items-center gap-2">
        <History className="w-3.5 h-3.5" />
        待办队列
        <span className="ml-auto text-[10px] text-ghost-900 font-sans font-normal normal-case tracking-normal">
          共 {todos.length} 项
        </span>
      </h3>
      {(['pending', 'processing', 'resolved', 'rejected'] as TodoStatus[]).map((status) => {
        const items = byStatus[status];
        if (!items.length) return null;
        const meta = statusMeta[status];
        const StatusIcon = meta.icon;
        return (
          <div key={status} className="space-y-1.5">
            <div className="flex items-center gap-1.5 px-1">
              <StatusIcon className="w-3 h-3" style={{ color: meta.color.match(/text-([\w-]+)/)?.[1] ? undefined : undefined }} />
              <span className={`text-[10px] font-semibold tracking-widest uppercase px-1.5 py-0.5 rounded-sm border ${meta.color}`}>
                {meta.label}
              </span>
              <span className="text-[10px] text-ghost-900">{items.length}</span>
            </div>
            {items.map((t) => {
              const nextStatus: Record<TodoStatus, TodoStatus | null> = {
                pending: 'processing',
                processing: 'resolved',
                resolved: null,
                rejected: null,
              };
              return (
                <div
                  key={t.id}
                  className={clsx(
                    'gothic-card p-2.5 border-l-4 transition-all hover:translate-x-0.5',
                    priorityColor[t.priority]
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-xs font-medium text-ghost-500 leading-snug flex-1 min-w-0">
                      {t.title}
                    </h4>
                    <span className="text-[9px] text-ghost-900 font-mono shrink-0">{t.id.slice(-6)}</span>
                  </div>
                  <p className="text-[10px] text-ghost-900 leading-relaxed line-clamp-2 mb-2">
                    {t.description.split('\n')[0]}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap text-[9px] text-ghost-900">
                    <span className="flex items-center gap-0.5"><User className="w-2 h-2" /> {t.assignee}</span>
                    <span className="flex items-center gap-0.5"><GitBranch className="w-2 h-2" /> {t.relatedNodeId ?? '未关联'}</span>
                    <span>·</span>
                    <span>{t.createdAt.slice(5)}</span>
                    {t.resolvedVersion && (
                      <span className="ml-auto px-1 py-0.5 rounded-sm bg-moss-800/50 border border-moss-700/50 text-moss-400 font-mono">
                        ✓ {t.resolvedVersion}
                      </span>
                    )}
                  </div>
                  {nextStatus[t.status] && t.status !== 'resolved' && (
                    <div className="mt-2 pt-2 border-t border-abyss-700/40 flex items-center gap-1">
                      <button
                        onClick={() => updateTodoStatus(t.id, nextStatus[t.status]!)}
                        className="flex-1 py-1 text-[10px] text-amber-400 rounded-sm hover:bg-amber-900/20 border border-transparent hover:border-amber-700/40 transition-colors"
                      >
                        → 推进到「{statusMeta[nextStatus[t.status]!].label}」
                      </button>
                      {t.status === 'pending' && (
                        <button
                          onClick={() => updateTodoStatus(t.id, 'rejected')}
                          className="px-2 py-1 text-[10px] text-ghost-900 rounded-sm hover:bg-abyss-700/50 border border-transparent hover:border-abyss-600/60 transition-colors"
                        >
                          拒绝
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
