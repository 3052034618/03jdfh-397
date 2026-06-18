import { useState } from 'react';
import { ArrowRight, MessageSquareText, ListTodo, GitBranch, Rocket, User, Clock, FileText } from 'lucide-react';
import { useReviewStore } from '../../store/useReviewStore';
import type { TraceStage, PlayerFeedback } from '../../types';
import { clsx } from 'clsx';
import { FeedbackDetailModal } from './FeedbackDetailModal';

const stageMeta: Record<TraceStage, { label: string; icon: typeof MessageSquareText; color: string; step: number; }> = {
  feedback: { label: '玩家反馈', icon: MessageSquareText, color: 'border-void-500/60 text-void-400 bg-void-800/60', step: 0 },
  todo: { label: '复盘待办', icon: ListTodo, color: 'border-amber-500/60 text-amber-400 bg-amber-900/40', step: 1 },
  edit: { label: '对白编辑', icon: GitBranch, color: 'border-blood-500/60 text-blood-400 bg-blood-900/40', step: 2 },
  release: { label: '版本发布', icon: Rocket, color: 'border-moss-500/60 text-moss-400 bg-moss-800/50', step: 3 },
};

export function TraceFlow() {
  const { traces, feedbacks, todos } = useReviewStore();
  const [selectedFeedback, setSelectedFeedback] = useState<PlayerFeedback | null>(null);

  const flows: Record<string, Record<TraceStage, any>> = {};
  traces.forEach((t) => {
    if (!flows[t.feedbackId]) flows[t.feedbackId] = {} as any;
    if (!flows[t.feedbackId][t.stage] || t.timestamp > flows[t.feedbackId][t.stage].timestamp) {
      flows[t.feedbackId][t.stage] = t;
    }
  });

  const flowEntries = Object.entries(flows);

  return (
    <div className="border-t border-abyss-700/60 bg-abyss-850/60 p-4">
      <h3 className="section-title flex items-center gap-2">
        <Rocket className="w-3.5 h-3.5" />
        回流追踪链路
        <span className="ml-auto text-[10px] text-ghost-900 font-sans font-normal normal-case tracking-normal">
          已完成闭环 {Object.values(flows).filter(f => f.release).length} 条
        </span>
      </h3>

      <div className="space-y-2.5 max-h-72 overflow-y-auto scrollbar-thin pr-1">
        {flowEntries.map(([fbId, stages]) => {
          const fb = feedbacks.find((f) => f.id === fbId);
          const maxStep = Math.max(...(Object.keys(stages) as TraceStage[]).map((s) => stageMeta[s].step), 0);
          return (
            <div
              key={fbId}
              className="gothic-card p-2.5 cursor-pointer hover:border-blood-700/50 transition-all active:scale-[0.995]"
              onClick={() => fb && setSelectedFeedback(fb)}
            >
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[11px] text-ghost-500 flex-1 min-w-0 truncate leading-snug">
                  {fb?.content.slice(0, 50)}{fb && fb.content.length > 50 ? '…' : ''}
                </p>
                {stages.release && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-moss-800/50 border border-moss-700/50 text-moss-400 font-semibold animate-pulse-slow flex items-center gap-1">
                    ✓ 闭环
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute top-4 left-0 right-0 h-px bg-gradient-to-r from-abyss-600/70 via-abyss-600/40 to-abyss-600/70" />
                <div className="grid grid-cols-4 relative">
                  {(['feedback', 'todo', 'edit', 'release'] as TraceStage[]).map((stg) => {
                    const meta = stageMeta[stg];
                    const StageIcon = meta.icon;
                    const active = !!stages[stg];
                    const isCurrent = meta.step === maxStep;
                    const todo = stages.todo && todos.find((t) => t.id === stages.todo.todoId);
                    return (
                      <div key={stg} className="flex flex-col items-center gap-1 px-1">
                        <div
                          className={clsx(
                            'relative w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10',
                            active
                              ? `${meta.color} ${isCurrent && 'animate-float'}`
                              : 'border-abyss-600/60 text-abyss-600/60 bg-abyss-800/40'
                          )}
                        >
                          <StageIcon className="w-3.5 h-3.5" />
                          {active && isCurrent && (
                            <span className="absolute -inset-1 rounded-full border border-blood-500/30 animate-pulse-slow" />
                          )}
                        </div>
                        <span className={clsx('text-[8.5px] font-medium tracking-wide text-center leading-tight', active ? 'text-ghost-500' : 'text-ghost-900')}>
                          {meta.label}
                        </span>
                        {active && stages[stg].todoId && todo && (
                          <span className="text-[8px] text-amber-400 font-mono truncate w-full text-center">
                            {todo.title.slice(0, 8)}
                          </span>
                        )}
                        {active && stages[stg].nodeId && (
                          <span className="text-[8px] text-blood-400 font-mono truncate w-full text-center">
                            {stages[stg].nodeId}
                          </span>
                        )}
        {active && stages[stg].versionId && (
                          <>
                            <span className="text-[8px] text-moss-400 font-mono truncate w-full text-center">
                              {stages[stg].versionName ?? stages[stg].versionId.slice(0, 8)}
                            </span>
                            {stages[stg].versionCode && (
                              <span className="text-[7.5px] text-moss-500/80 font-mono truncate w-full text-center">
                                {stages[stg].versionCode}
                              </span>
                            )}
                            {stages[stg].versionTime && (
                              <span className="text-[7px] text-ghost-700 flex items-center gap-0.5 justify-center w-full">
                                <Clock className="w-1.5 h-1.5" />
                                {stages[stg].versionTime.slice(5)}
                              </span>
                            )}
                          </>
                        )}
                        {active && stages[stg].operator && (
                          <span className="text-[7px] text-ghost-800 flex items-center gap-0.5 justify-center w-full">
                            <User className="w-1.5 h-1.5" />
                            {stages[stg].operator}
                          </span>
                        )}
                        {active && stages[stg].note && (
                          <span className="text-[7px] text-ghost-700 flex items-center gap-0.5 justify-center w-full">
                            <FileText className="w-1.5 h-1.5" />
                            {stages[stg].note.slice(0, 10)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="hidden">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          );
        })}
        {flowEntries.length === 0 && (
          <div className="py-4 text-center text-[11px] text-ghost-900">暂无回流链路</div>
        )}
      </div>

      {selectedFeedback && (
        <FeedbackDetailModal
          feedback={selectedFeedback}
          onClose={() => setSelectedFeedback(null)}
        />
      )}
    </div>
  );
}
