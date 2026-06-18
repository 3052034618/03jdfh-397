import { useState } from 'react';
import { Plus, User, Link2, ListTodo, Sparkles } from 'lucide-react';
import { useReviewStore } from '../../store/useReviewStore';
import type { TodoPriority } from '../../types';

const priorityOptions: Array<{ value: TodoPriority; label: string; color: string; }> = [
  { value: 'low', label: '低', color: 'bg-moss-800/60 text-moss-400 border-moss-700/50' },
  { value: 'medium', label: '中', color: 'bg-abyss-700/60 text-ghost-500 border-abyss-600/60' },
  { value: 'high', label: '高', color: 'bg-amber-900/50 text-amber-400 border-amber-700/50' },
  { value: 'urgent', label: '紧急', color: 'bg-blood-900/60 text-blood-300 border-blood-700/60 animate-pulse-slow' },
];

export function TodoGenerator() {
  const { selectedFeedbackIds, feedbacks, createTodoFromFeedback, clearFeedbackSelection } = useReviewStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('medium');
  const [assignee, setAssignee] = useState('叙事-墨白');
  const [relatedNodeId, setRelatedNodeId] = useState('');

  const selectedFeedbacks = feedbacks.filter((f) => selectedFeedbackIds.includes(f.id));
  const topKeywords = Array.from(
    new Set(selectedFeedbacks.flatMap((f) => f.keywords))
  ).slice(0, 6);
  const suggestedNode = selectedFeedbacks.find((f) => f.relatedNodeId)?.relatedNodeId;

  const autoFill = () => {
    if (!selectedFeedbacks.length) return;
    setTitle(selectedFeedbacks[0].keywords[0] ? `【${selectedFeedbacks[0].keywords[0]}】社区反馈优化` : '社区反馈处理');
    setDescription(
      selectedFeedbacks.map((f, i) => `${i + 1}. @${f.author}: ${f.content.slice(0, 50)}${f.content.length > 50 ? '…' : ''}`).join('\n\n')
    );
    const totalHeat = selectedFeedbacks.reduce((s, f) => s + f.heat, 0) / selectedFeedbacks.length;
    if (totalHeat >= 85) setPriority('urgent');
    else if (totalHeat >= 70) setPriority('high');
    else if (totalHeat >= 50) setPriority('medium');
    else setPriority('low');
    if (suggestedNode) setRelatedNodeId(suggestedNode);
  };

  const submit = () => {
    if (!title.trim() || !selectedFeedbackIds.length) return;
    createTodoFromFeedback(
      selectedFeedbackIds,
      title,
      description,
      priority,
      assignee,
      relatedNodeId || undefined
    );
    setTitle('');
    setDescription('');
    setPriority('medium');
    setRelatedNodeId('');
    clearFeedbackSelection();
  };

  return (
    <div className="border-b border-abyss-700/60 bg-abyss-850/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <ListTodo className="w-4 h-4 text-blood-400" />
        <h2 className="font-serif font-semibold text-ghost-500 tracking-wider">
          待办生成器
        </h2>
        {selectedFeedbackIds.length > 0 && (
          <button
            onClick={autoFill}
            className="ml-auto text-[10px] px-2 py-1 rounded-sm bg-amber-900/30 border border-amber-700/40 text-amber-400 flex items-center gap-1 hover:bg-amber-900/50 transition-colors"
          >
            <Sparkles className="w-2.5 h-2.5" />
            智能填充
          </button>
        )}
      </div>

      {selectedFeedbackIds.length === 0 ? (
        <div className="py-6 text-center border border-dashed border-abyss-600/60 rounded-sm">
          <div className="text-3xl opacity-20 mb-2">📝</div>
          <p className="text-[11px] text-ghost-900 font-serif tracking-wide">
            从左侧选中一条或多条玩家反馈，开始生成复盘待办
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-2.5 rounded-sm bg-abyss-900/60 border border-abyss-700/60 space-y-1.5">
            <p className="text-[10px] text-ghost-900 tracking-wider uppercase">已选反馈 ({selectedFeedbackIds.length})

            </p>
            <div className="flex flex-wrap gap-1">
              {topKeywords.map((k) => (
                <span key={k} className="text-[9px] px-1.5 py-0.5 rounded-sm bg-void-800/50 border border-void-700/50 text-void-400">
                  #{k}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="gothic-label mb-1">待办标题</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="gothic-input !py-1.5 !text-xs" placeholder="简明描述要处理的问题…" />
            </div>
            <div className="col-span-2">
              <label className="gothic-label mb-1">处理说明</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="gothic-input !py-1.5 !text-xs resize-none" placeholder="详细说明问题原因和处理方向…" />
            </div>
            <div>
              <label className="gothic-label mb-1 flex items-center gap-1">
                <User className="w-2.5 h-2.5" /> 负责人
              </label>
              <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="gothic-input !py-1.5 !text-xs">
                <option>叙事-墨白</option>
                <option>文案-苏晚</option>
                <option>主策-林夜</option>
                <option>校对-AI助手</option>
                <option>技术-阿Ken</option>
              </select>
            </div>
            <div>
              <label className="gothic-label mb-1 flex items-center gap-1">
                <Link2 className="w-2.5 h-2.5" /> 关联节点ID
              </label>
              <input value={relatedNodeId} onChange={(e) => setRelatedNodeId(e.target.value)} placeholder="如 n-005" className="gothic-input !py-1.5 !text-xs font-mono" />
            </div>
            <div className="col-span-2">
              <label className="gothic-label mb-1.5">优先级</label>
              <div className="grid grid-cols-4 gap-1.5">
                {priorityOptions.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPriority(p.value)}
                    className={`py-1.5 text-[11px] font-semibold rounded-sm border transition-all ${priority === p.value ? p.color + ' shadow-inner-abyss' : 'bg-abyss-800/40 text-ghost-900 border-abyss-700/40 hover:border-abyss-600/60'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={submit}
            disabled={!title.trim()}
            className="w-full gothic-btn-primary !py-2 flex items-center justify-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            创建复盘待办并回流
          </button>
        </div>
      )}
    </div>
  );
}
