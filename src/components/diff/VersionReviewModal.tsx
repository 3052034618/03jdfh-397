import { useState, useMemo } from 'react';
import { X, Package, Eye, User, Clock, FileText, GitBranch, CheckCircle2, XCircle, Send, Play, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { useDiffStore } from '../../store/useDiffStore';
import { useReviewStore } from '../../store/useReviewStore';
import type { VersionSnapshot, NodeDiff, AuditAction } from '../../types';

const actionLabel: Record<AuditAction, { label: string; color: string }> = {
  create_draft: { label: '创建草稿', color: 'text-ghost-700' },
  submit_review: { label: '提交审核', color: 'text-amber-400' },
  reject_review: { label: '审核退回', color: 'text-blood-400' },
  approve_publish: { label: '审核通过', color: 'text-moss-400' },
  rollback_executed: { label: '执行回滚', color: 'text-blood-500' },
  rollback_planned: { label: '计划回滚', color: 'text-amber-500' },
  archive: { label: '归档', color: 'text-ghost-800' },
  unarchive: { label: '恢复草稿', color: 'text-ghost-700' },
};

const severityStyle: Record<string, { color: string; bg: string; border: string; label: string }> = {
  low: { color: 'text-moss-400', bg: 'bg-moss-900/20', border: 'border-moss-700/40', label: '低' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-900/20', border: 'border-amber-700/40', label: '中' },
  high: { color: 'text-blood-400', bg: 'bg-blood-900/20', border: 'border-blood-700/50', label: '高' },
  critical: { color: 'text-blood-500', bg: 'bg-blood-900/40', border: 'border-blood-600/60', label: '致命' },
};

interface Props {
  version: VersionSnapshot;
  onClose: () => void;
}

export function VersionReviewModal({ version, onClose }: Props) {
  const { getVersionReviewDiff, promoteDraftToPending, updateVersionStatus, publishVersion, getVersionById, versions } = useDiffStore();
  const { todos } = useReviewStore();
  const [reviewNote, setReviewNote] = useState('');
  const [baselineId, setBaselineId] = useState(version.baselineVersionId ?? '');
  const [activeTab, setActiveTab] = useState<'changes' | 'audit' | 'todos'>('changes');

  const chapterVersions = versions.filter(
    (v) => v.chapterId === version.chapterId && v.id !== version.id && v.status !== 'archived'
  );

  const diffReport = useMemo(() => {
    if (!baselineId) return null;
    return getVersionReviewDiff(version.id, baselineId);
  }, [version.id, baselineId, getVersionReviewDiff]);

  const baseline = baselineId ? getVersionById(baselineId) : null;

  const relatedTodos = version.relatedTodoIds
    ?.map((tid) => todos.find((t) => t.id === tid))
    .filter(Boolean) ?? [];

  const highRiskCount = diffReport?.nodeDiffs.filter((d) => d.severity === 'high' || d.severity === 'critical').length ?? 0;

  // 按字段类型分组 diffs
  const groupedDiffs = useMemo(() => {
    if (!diffReport) return {};
    return diffReport.nodeDiffs.reduce((acc: Record<string, NodeDiff[]>, d) => {
      const key = d.field;
      if (!acc[key]) acc[key] = [];
      acc[key].push(d);
      return acc;
    }, {});
  }, [diffReport]);

  const fieldLabels: Record<string, string> = {
    text: '对白文本',
    emotion: '情绪配置',
    choices: '选项',
    visibleInfo: '可见信息',
    conditions: '触发条件',
  };

  return (
    <div className="fixed inset-0 bg-abyss-950/85 backdrop-blur-md flex items-start justify-center z-[100] p-6 overflow-y-auto">
      <div className="gothic-card p-6 w-full max-w-3xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-sm flex items-center justify-center text-ghost-900 hover:text-blood-400 hover:bg-blood-900/30 transition-colors z-10"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        {/* 版本基本信息 */}
        <div className="mb-5 pb-4 border-b border-abyss-700/60">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-sm bg-blood-900/50 border border-blood-700/60 flex items-center justify-center shrink-0">
              <Package className="w-5.5 h-5.5 text-blood-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="font-serif font-semibold text-ghost-500 tracking-wider text-base">
                  {version.name}
                </h2>
                <span
                  className={clsx(
                    'text-[10px] px-2 py-0.5 rounded-sm border font-semibold tracking-wider uppercase',
                    version.status === 'published'
                      ? 'bg-moss-800/50 border-moss-700/50 text-moss-400'
                      : version.status === 'pending-review'
                      ? 'bg-amber-900/40 border-amber-700/50 text-amber-400 animate-pulse-slow'
                      : version.status === 'archived'
                      ? 'bg-abyss-700/40 border-abyss-600/50 text-ghost-900'
                      : 'bg-abyss-700/60 border-abyss-600/60 text-ghost-700'
                  )}
                >
                  {version.status === 'pending-review' ? '待审核' : version.status}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-wrap text-[10px] text-ghost-900">
                <span className="font-mono">{version.versionCode}</span>
                <span>·</span>
                <span className="flex items-center gap-0.5"><User className="w-2.5 h-2.5" /> {version.createdBy}</span>
                <span>·</span>
                <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {version.createdAt}</span>
                {version.publishTime && (
                  <>
                    <span>·</span>
                    <span className="text-moss-400">发布 {version.publishTime}</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-ghost-700 mt-1.5 leading-relaxed">{version.description}</p>
              {version.tags.length > 0 && (
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  {version.tags.map((tag) => (
                    <span key={tag} className="px-1.5 py-0.5 rounded-sm bg-abyss-700/40 border border-abyss-600/50 text-[9px] text-ghost-700">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 基线选择 */}
          <div className="mt-4 flex items-end gap-3">
            <div className="flex-1">
              <label className="gothic-label">对比基线版本</label>
              <select
                value={baselineId}
                onChange={(e) => setBaselineId(e.target.value)}
                className="gothic-input !py-1.5 !text-xs w-full"
              >
                <option value="">-- 请选择基线版本 --</option>
                {chapterVersions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.versionCode}) · {v.status}
                  </option>
                ))}
              </select>
            </div>
            {diffReport && (
              <div className="shrink-0 text-right">
                <div className="text-[9px] text-ghost-900">差异数</div>
                <div className="text-lg font-serif font-bold text-ghost-500">
                  {diffReport.summary.totalChanges}
                </div>
                {highRiskCount > 0 && (
                  <div className="text-[9px] text-blood-400 flex items-center gap-0.5 justify-end">
                    <AlertTriangle className="w-2 h-2" />
                    {highRiskCount} 项高风险
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tab 导航 */}
        <div className="flex items-center gap-1 mb-4 border-b border-abyss-700/60 pb-2">
          {(['changes', 'todos', 'audit'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'px-3 py-1.5 text-[10px] font-medium tracking-wider rounded-t-sm border border-b-0 transition-colors -mb-[2px]',
                activeTab === tab
                  ? 'bg-abyss-800/80 border-abyss-700/60 text-ghost-500'
                  : 'border-transparent text-ghost-900 hover:text-ghost-700 hover:bg-abyss-800/30'
              )}
            >
              {tab === 'changes' && '字段级变更'}
              {tab === 'todos' && `关联待办 (${relatedTodos.length})`}
              {tab === 'audit' && `操作记录 (${version.auditLogs?.length ?? 0})`}
            </button>
          ))}
        </div>

        {/* 字段级变更内容 */}
        {activeTab === 'changes' && (
          <div>
            {!baselineId ? (
              <div className="text-center py-10 text-[11px] text-ghost-900">
                请先选择一个基线版本以查看变更对比
              </div>
            ) : !diffReport ? (
              <div className="text-center py-10 text-[11px] text-ghost-900">
                未找到有效基线版本
              </div>
            ) : diffReport.nodeDiffs.length === 0 ? (
              <div className="text-center py-10 text-[11px] text-moss-400 font-serif">
                ✓ 与基线版本完全一致，无任何变更
              </div>
            ) : (
              <div className="space-y-4 max-h-[480px] overflow-y-auto scrollbar-thin pr-1">
                {Object.entries(groupedDiffs).map(([field, diffs]) => (
                  <div key={field} className="gothic-card p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-xs font-semibold text-ghost-500 tracking-wider">
                        {fieldLabels[field] ?? field}
                      </h4>
                      <span className="text-[9px] text-ghost-900 font-mono">{diffs.length} 处变更</span>
                      {diffs.some((d) => d.severity === 'high' || d.severity === 'critical') && (
                        <span className="ml-auto px-1.5 py-0.5 rounded-sm bg-blood-900/40 border border-blood-700/50 text-blood-400 text-[9px] font-semibold animate-pulse-slow">
                          含高风险
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {diffs.map((diff) => {
                        const sev = severityStyle[diff.severity];
                        return (
                          <div key={diff.nodeId + diff.field} className="flex items-start gap-2">
                            <span className={clsx('px-1.5 py-0.5 text-[8.5px] font-bold tracking-wider rounded-sm border shrink-0 mt-0.5', sev.color, sev.bg, sev.border)}>
                              {sev.label}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-mono text-ghost-700">{diff.nodeId}</span>
                                {diff.suspenseRisk && (
                                  <span className="text-[8.5px] text-blood-400">⚠ 悬念风险</span>
                                )}
                                <span className="text-[9px] text-ghost-900 ml-auto">{diff.description}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 rounded-sm bg-blood-900/15 border border-blood-800/30">
                                  <p className="text-[9px] text-blood-500 tracking-wider mb-1 uppercase">基线</p>
                                  <p className="text-[10.5px] text-ghost-900/80 leading-relaxed break-words">
                                    {Array.isArray(diff.oldValue)
                                      ? diff.oldValue.join(', ') || '(空)'
                                      : typeof diff.oldValue === 'object'
                                      ? JSON.stringify(diff.oldValue, null, 1)
                                      : String(diff.oldValue)}
                                  </p>
                                </div>
                                <div className="p-2 rounded-sm bg-moss-800/20 border border-moss-700/40">
                                  <p className="text-[9px] text-moss-500 tracking-wider mb-1 uppercase">当前</p>
                                  <p className="text-[10.5px] text-ghost-500 leading-relaxed break-words">
                                    {Array.isArray(diff.newValue)
                                      ? diff.newValue.join(', ') || '(空)'
                                      : typeof diff.newValue === 'object'
                                      ? JSON.stringify(diff.newValue, null, 1)
                                      : String(diff.newValue)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 关联待办 */}
        {activeTab === 'todos' && (
          <div className="max-h-[480px] overflow-y-auto scrollbar-thin pr-1">
            {relatedTodos.length === 0 ? (
              <div className="text-center py-10 text-[11px] text-ghost-900">
                暂无关联待办
              </div>
            ) : (
              <div className="space-y-2">
                {relatedTodos.map((todo) => (
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
                    <div className="flex items-center gap-2 mt-2 text-[9px] text-ghost-900">
                      <span className="flex items-center gap-0.5"><User className="w-2 h-2" /> {todo.assignee}</span>
                      <span>·</span>
                      <span>{todo.createdAt.slice(5)}</span>
                      {todo.relatedNodeId && (
                        <>
                          <span>·</span>
                          <span className="font-mono">{todo.relatedNodeId}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 操作记录 */}
        {activeTab === 'audit' && (
          <div className="max-h-[480px] overflow-y-auto scrollbar-thin pr-1">
            {!version.auditLogs || version.auditLogs.length === 0 ? (
              <div className="text-center py-10 text-[11px] text-ghost-900">
                暂无操作记录
              </div>
            ) : (
              <div className="relative pl-5 border-l border-abyss-700/60 space-y-3">
                {version.auditLogs
                  .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
                  .map((log) => {
                    const meta = actionLabel[log.action];
                    return (
                      <div key={log.id} className="relative">
                        <div className="absolute -left-[22px] top-1 w-3.5 h-3.5 rounded-full bg-abyss-800 border-2 border-abyss-600" />
                        <div className="gothic-card p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-semibold tracking-wider uppercase ${meta.color}`}>
                              {meta.label}
                            </span>
                            <span className="text-[9px] text-ghost-900 ml-auto">{log.timestamp}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[9px] text-ghost-800">
                            <span className="flex items-center gap-0.5"><User className="w-2 h-2" /> {log.operator}</span>
                            {log.note && (
                              <>
                                <span>·</span>
                                <span className="text-ghost-700">{log.note}</span>
                              </>
                            )}
                            {log.relatedTodoId && (
                              <>
                                <span>·</span>
                                <span className="font-mono text-amber-400">待办 {log.relatedTodoId.slice(-6)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* 审核操作区 */}
        {(version.status === 'draft' || version.status === 'pending-review') && (
          <div className="mt-5 pt-4 border-t border-abyss-700/60">
            <div className="mb-2">
              <label className="gothic-label">审核备注</label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={2}
                className="gothic-input !py-1.5 !text-xs w-full resize-none"
                placeholder="请输入审核意见..."
              />
            </div>
            <div className="flex items-center gap-2">
              {version.status === 'draft' && (
                <button
                  onClick={() => {
                    promoteDraftToPending(version.id);
                    setReviewNote('');
                  }}
                  disabled={!baselineId}
                  className="gothic-btn-amber flex-1 !py-2 !text-xs flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  提交审核
                </button>
              )}
              {version.status === 'pending-review' && (
                <>
                  <button
                    onClick={() => {
                      updateVersionStatus(version.id, 'draft', reviewNote || '退回修改');
                      setReviewNote('');
                    }}
                    className="flex-1 !py-2 !text-xs flex items-center justify-center gap-1.5 bg-blood-900/40 border border-blood-700/60 text-blood-400 hover:bg-blood-900/60 rounded-sm transition-colors font-semibold tracking-wider"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    退回修改
                  </button>
                  <button
                    onClick={() => {
                      publishVersion(version.id);
                      setReviewNote('');
                    }}
                    disabled={!baselineId}
                    className="gothic-btn-primary flex-1 !py-2 !text-xs flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    审核通过并发布
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="gothic-btn !py-2 !px-4 !text-xs"
              >
                关闭
              </button>
            </div>
          </div>
        )}

        {version.status !== 'draft' && version.status !== 'pending-review' && (
          <div className="flex justify-end mt-4">
            <button onClick={onClose} className="gothic-btn !py-2 !px-5 !text-xs">
              关闭
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
