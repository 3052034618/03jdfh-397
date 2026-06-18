import { useState } from 'react';
import { clsx } from 'clsx';
import { CheckCircle2, Clock, XCircle, Play, User, GitBranch, History, X, Package, Tag } from 'lucide-react';
import { useReviewStore } from '../../store/useReviewStore';
import { useDiffStore } from '../../store/useDiffStore';
import type { TodoStatus, TodoPriority, VersionSnapshot } from '../../types';

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
  const { todos, updateTodoStatus, resolveTodoWithVersion } = useReviewStore();
  const { versions: allVersions } = useDiffStore();
  const [resolveModalTodoId, setResolveModalTodoId] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');

  const byStatus = {
    pending: todos.filter((t) => t.status === 'pending'),
    processing: todos.filter((t) => t.status === 'processing'),
    resolved: todos.filter((t) => t.status === 'resolved'),
    rejected: todos.filter((t) => t.status === 'rejected'),
  };

  const openResolveModal = (todoId: string) => {
    setResolveModalTodoId(todoId);
    setSelectedVersionId('');
  };

  const handleConfirmResolve = () => {
    if (!resolveModalTodoId || !selectedVersionId) return;
    resolveTodoWithVersion(resolveModalTodoId, selectedVersionId);
    setResolveModalTodoId(null);
  };

  const modalTodo = resolveModalTodoId ? todos.find((t) => t.id === resolveModalTodoId) : null;
  const publishedVersions = allVersions.filter(
    (v) => v.status === 'published' || v.status === 'pending-review'
  );

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-3 space-y-3 relative">
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
                    {t.feedbackIds.length > 1 && (
                      <span className="px-1 py-0.5 rounded-sm bg-abyss-700/50 border border-abyss-600/60 text-ghost-700">
                        {t.feedbackIds.length} 条反馈
                      </span>
                    )}
                    {t.resolvedVersion && (
                      <span className="ml-auto px-1 py-0.5 rounded-sm bg-moss-800/50 border border-moss-700/50 text-moss-400 font-mono flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {t.resolvedVersion}
                      </span>
                    )}
                  </div>
                  {nextStatus[t.status] && t.status !== 'resolved' && (
                    <div className="mt-2 pt-2 border-t border-abyss-700/40 flex items-center gap-1">
                      {t.status === 'processing' ? (
                        <button
                          onClick={() => openResolveModal(t.id)}
                          className="flex-1 py-1 text-[10px] text-moss-400 rounded-sm hover:bg-moss-900/20 border border-transparent hover:border-moss-700/40 transition-colors flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          标记已解决 · 选择发布版本
                        </button>
                      ) : (
                        <button
                          onClick={() => updateTodoStatus(t.id, nextStatus[t.status]!)}
                          className="flex-1 py-1 text-[10px] text-amber-400 rounded-sm hover:bg-amber-900/20 border border-transparent hover:border-amber-700/40 transition-colors"
                        >
                          → 推进到「{statusMeta[nextStatus[t.status]!].label}」
                        </button>
                      )}
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

      {/* 选择版本弹窗 */}
      {resolveModalTodoId && modalTodo && (
        <div className="absolute inset-0 bg-abyss-950/80 backdrop-blur-sm flex items-start justify-center z-50 pt-20 overflow-y-auto">
          <div className="gothic-card p-5 w-full max-w-md relative">
            <button
              onClick={() => setResolveModalTodoId(null)}
              className="absolute top-3 right-3 w-7 h-7 rounded-sm flex items-center justify-center text-ghost-900 hover:text-blood-400 hover:bg-blood-900/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-sm bg-moss-800/50 border border-moss-700/60 flex items-center justify-center">
                <Package className="w-4 h-4 text-moss-400" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-ghost-500 tracking-wider text-sm">
                  标记为已解决
                </h3>
                <p className="text-[10px] text-ghost-900">
                  请选择该待办对应的发布版本或热修草稿
                </p>
              </div>
            </div>

            <div className="mb-3 px-3 py-2 bg-abyss-800/50 border border-abyss-700/60 rounded-sm">
              <div className="text-xs text-ghost-500 font-medium mb-0.5">{modalTodo.title}</div>
              <div className="text-[10px] text-ghost-900">
                关联 {modalTodo.feedbackIds.length} 条反馈 · 负责人 {modalTodo.assignee}
              </div>
            </div>

            <div className="mb-2">
              <label className="gothic-label">选择发布版本</label>
              <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin pr-1">
                {publishedVersions.length === 0 ? (
                  <div className="text-[11px] text-ghost-900 py-4 text-center border border-dashed border-abyss-600/60 rounded-sm">
                    暂无已发布版本
                  </div>
                ) : (
                  publishedVersions.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVersionId(v.id)}
                      className={clsx(
                        'w-full text-left p-2.5 rounded-sm border transition-all',
                        selectedVersionId === v.id
                          ? 'border-moss-600/70 bg-moss-900/30'
                          : 'border-abyss-700/60 bg-abyss-800/30 hover:border-abyss-600/70 hover:bg-abyss-800/60'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-ghost-500">{v.name}</span>
                        <span
                          className={clsx(
                            'text-[9px] px-1 py-0.5 rounded-sm border',
                            v.status === 'published'
                              ? 'text-moss-400 bg-moss-800/40 border-moss-700/50'
                              : 'text-amber-400 bg-amber-900/30 border-amber-700/50'
                          )}
                        >
                          {v.status === 'published' ? '已发布' : '待审核'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-ghost-900">
                        <span className="flex items-center gap-0.5">
                          <Tag className="w-2.5 h-2.5" /> {v.versionCode}
                        </span>
                        <span>·</span>
                        <span>{v.createdAt.slice(5)}</span>
                        <span>·</span>
                        <span>{v.nodes.length} 节点</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setResolveModalTodoId(null)}
                className="gothic-btn flex-1 !py-1.5 !text-xs"
              >
                取消
              </button>
              <button
                onClick={handleConfirmResolve}
                disabled={!selectedVersionId}
                className="gothic-btn-primary flex-1 !py-1.5 !text-xs flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                确认已解决
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
