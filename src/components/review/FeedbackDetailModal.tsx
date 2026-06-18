import { useState } from 'react';
import { X, MessageSquareText, ListTodo, GitBranch, Rocket, User, Clock, FileText, Tag } from 'lucide-react';
import { clsx } from 'clsx';
import { useReviewStore } from '../../store/useReviewStore';
import { useDiffStore } from '../../store/useDiffStore';
import { useDialogStore } from '../../store/useDialogStore';
import type { PlayerFeedback, TraceStage, ReviewTodo } from '../../types';

const stageMeta: Record<TraceStage, { label: string; icon: typeof MessageSquareText; color: string; }> = {
  feedback: { label: '玩家反馈', icon: MessageSquareText, color: 'border-void-500/60 text-void-400 bg-void-800/60' },
  todo: { label: '复盘待办', icon: ListTodo, color: 'border-amber-500/60 text-amber-400 bg-amber-900/40' },
  edit: { label: '对白编辑', icon: GitBranch, color: 'border-blood-500/60 text-blood-400 bg-blood-900/40' },
  release: { label: '版本发布', icon: Rocket, color: 'border-moss-500/60 text-moss-400 bg-moss-800/50' },
};

interface Props {
  feedback: PlayerFeedback;
  onClose: () => void;
}

export function FeedbackDetailModal({ feedback, onClose }: Props) {
  const { getTracesByFeedback, getTodosByFeedback } = useReviewStore();
  const { nodes } = useDialogStore();
  const { getVersionById } = useDiffStore();
  const [editNote, setEditNote] = useState('');

  const traces = getTracesByFeedback(feedback.id);
  const todoIds = new Set(traces.filter((t) => t.todoId).map((t) => t.todoId));
  const todos = Array.from(todoIds).flatMap((id) => getTodosByFeedback(feedback.id)).filter(
    (t, i, arr) => arr.findIndex((x) => x.id === t.id) === i
  );

  // 按阶段分组 trace，每个阶段取最新的
  const latestByStage: Partial<Record<TraceStage, any>> = {};
  traces.forEach((t) => {
    const existing = latestByStage[t.stage];
    if (!existing || t.timestamp > existing.timestamp) {
      latestByStage[t.stage] = t;
    }
  });

  const relatedNode = feedback.relatedNodeId ? nodes[feedback.relatedNodeId] : null;

  return (
    <div className="fixed inset-0 bg-abyss-950/85 backdrop-blur-md flex items-start justify-center z-[100] p-6 overflow-y-auto">
      <div className="gothic-card p-6 w-full max-w-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-sm flex items-center justify-center text-ghost-900 hover:text-blood-400 hover:bg-blood-900/30 transition-colors"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        {/* 反馈基本信息 */}
        <div className="mb-6 pb-4 border-b border-abyss-700/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-sm bg-void-800/60 border border-void-600/50 flex items-center justify-center">
              <MessageSquareText className="w-5 h-5 text-void-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-sm bg-abyss-700/50 border border-abyss-600/50 text-[10px] text-ghost-700 font-semibold tracking-wider uppercase">
                  {feedback.source}
                </span>
                <span className={`px-2 py-0.5 rounded-sm border text-[10px] font-semibold tracking-wider uppercase ${
                  feedback.sentiment === 'negative'
                    ? 'bg-blood-900/40 border-blood-700/50 text-blood-400'
                    : feedback.sentiment === 'positive'
                    ? 'bg-moss-800/40 border-moss-700/50 text-moss-400'
                    : 'bg-abyss-700/40 border-abyss-600/50 text-ghost-700'
                }`}>
                  {feedback.sentiment}
                </span>
                <span className="text-[10px] text-ghost-900 font-mono">{feedback.id}</span>
              </div>
              <div className="text-[10px] text-ghost-900 flex items-center gap-2 mt-1">
                <span className="flex items-center gap-0.5"><User className="w-2.5 h-2.5" /> {feedback.author}</span>
                <span>·</span>
                <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {feedback.createdAt}</span>
                <span>·</span>
                <span className="flex items-center gap-0.5"><Tag className="w-2.5 h-2.5" /> {feedback.heat} 热度</span>
                <span>·</span>
                <span>提及 {feedback.mentionCount} 次</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-ghost-500 leading-relaxed font-serif">
            {feedback.content}
          </p>
          {feedback.keywords.length > 0 && (
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              {feedback.keywords.map((kw) => (
                <span
                  key={kw}
                  className="px-2 py-0.5 rounded-sm bg-blood-900/30 border border-blood-700/40 text-[10px] text-blood-400"
                >
                  #{kw}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 处理轨迹时间线 */}
        <div className="mb-6">
          <h3 className="text-xs font-serif font-semibold text-ghost-500 tracking-wider mb-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            处理轨迹
          </h3>
          <div className="relative pl-5 border-l border-abyss-700/60 space-y-4">
            {traces.length === 0 ? (
              <div className="text-[11px] text-ghost-900">
                暂无处理记录。选择此反馈并生成待办开始处理。
              </div>
            ) : (
              traces
                .sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1))
                .map((trace) => {
                  const meta = stageMeta[trace.stage];
                  const StageIcon = meta.icon;
                  const todo = trace.todoId ? todos.find((t) => t.id === trace.todoId) : null;
                  const version = trace.versionId ? getVersionById(trace.versionId) : null;
                  const node = trace.nodeId ? nodes[trace.nodeId] : null;

                  return (
                    <div key={trace.id} className="relative">
                      <div
                        className={clsx(
                          'absolute -left-[22px] top-0 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center',
                          meta.color
                        )}
                      />
                      <div className="gothic-card p-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <StageIcon className="w-3.5 h-3.5" style={{ color: meta.color.match(/text-([\w-]+)/)?.[1] ? undefined : undefined }} />
                          <span className={`text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-sm border ${meta.color}`}>
                            {meta.label}
                          </span>
                          <span className="text-[9px] text-ghost-900 ml-auto">{trace.timestamp}</span>
                        </div>

                        {todo && (
                          <div className="mb-1.5 text-[11px] text-amber-400 font-medium">
                            <span className="text-ghost-900 mr-1">待办:</span>
                            {todo.title}
                          </div>
                        )}
                        {node && (
                          <div className="mb-1.5 text-[10px] text-blood-400">
                            <span className="text-ghost-900 mr-1">节点:</span>
                            {node.id} · {node.speaker}: {node.text.slice(0, 20)}…
                          </div>
                        )}
                        {version && (
                          <div className="mb-1.5 text-[10px] text-moss-400">
                            <span className="text-ghost-900 mr-1">版本:</span>
                            {version.name} ({version.versionCode}) · {version.publishTime ?? version.createdAt}
                          </div>
                        )}
                        {trace.operator && (
                          <div className="text-[9px] text-ghost-800 flex items-center gap-1">
                            <User className="w-2 h-2" /> {trace.operator}
                            {trace.note && (
                              <>
                                <span className="text-ghost-900">·</span>
                                <FileText className="w-2 h-2" />
                                <span>{trace.note}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* 关联待办列表 */}
        {todos.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-serif font-semibold text-ghost-500 tracking-wider mb-3 flex items-center gap-1.5">
              <ListTodo className="w-3.5 h-3.5" />
              关联待办 ({todos.length})
            </h3>
            <div className="space-y-2">
              {todos.map((todo) => (
                <div key={todo.id} className="gothic-card p-3">
                  <div className="flex items-start gap-2">
                    <h4 className="text-xs font-medium text-ghost-500 flex-1">{todo.title}</h4>
                    <span
                      className={clsx(
                        'text-[9px] px-1.5 py-0.5 rounded-sm border font-semibold tracking-wider uppercase',
                        todo.status === 'resolved'
                          ? 'bg-moss-800/50 border-moss-700/50 text-moss-400'
                          : todo.status === 'processing'
                          ? 'bg-amber-900/40 border-amber-700/50 text-amber-400 animate-pulse-slow'
                          : todo.status === 'rejected'
                          ? 'bg-abyss-700/40 border-abyss-600/50 text-ghost-900'
                          : 'bg-abyss-700/60 border-abyss-600/60 text-ghost-700'
                      )}
                    >
                      {todo.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-ghost-900 mt-1 line-clamp-2">{todo.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-[9px] text-ghost-900 flex-wrap">
                    <span className="flex items-center gap-0.5"><User className="w-2 h-2" /> {todo.assignee}</span>
                    <span>·</span>
                    <span>{todo.createdAt.slice(5)}</span>
                    {todo.resolvedVersion && (
                      <>
                        <span>·</span>
                        <span className="text-moss-400">{todo.resolvedVersion}</span>
                      </>
                    )}
                  </div>
                  {todo.processingNote && (
                    <div className="mt-2 pt-2 border-t border-abyss-700/40 text-[10px] text-ghost-700">
                      <span className="text-amber-500 font-semibold">处理备注: </span>
                      {todo.processingNote}
                    </div>
                  )}
                  {todo.resolvedNote && (
                    <div className="mt-1 text-[10px] text-ghost-700">
                      <span className="text-moss-500 font-semibold">结案备注: </span>
                      {todo.resolvedNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 关联节点 */}
        {relatedNode && (
          <div className="mb-6">
            <h3 className="text-xs font-serif font-semibold text-ghost-500 tracking-wider mb-3 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5" />
              关联对白节点
            </h3>
            <div className="gothic-card p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-blood-900/40 border border-blood-700/50 text-blood-400 font-mono">
                  {relatedNode.id}
                </span>
                <span className="text-[10px] text-ghost-900">{relatedNode.type}</span>
                <span className="text-[10px] text-ghost-800 ml-auto">{relatedNode.speaker}</span>
              </div>
              <p className="text-xs text-ghost-500 leading-relaxed font-serif">{relatedNode.text}</p>
              {relatedNode.visibleInfo.length > 0 && (
                <div className="mt-2 pt-2 border-t border-abyss-700/40">
                  <p className="text-[9px] text-ghost-900 mb-1">玩家可见信息:</p>
                  <div className="flex flex-wrap gap-1">
                    {relatedNode.visibleInfo.map((info, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded-sm bg-abyss-700/50 border border-abyss-600/50 text-[9px] text-ghost-700">
                        {info}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="gothic-btn !py-2 !px-5 !text-xs"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
