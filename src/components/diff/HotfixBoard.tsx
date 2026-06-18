import { useState } from 'react';
import { clsx } from 'clsx';
import { Package, Clock, CheckCircle2, AlertTriangle, FileWarning, GitBranch, Send, Play, Archive } from 'lucide-react';
import { useDiffStore } from '../../store/useDiffStore';
import { useReviewStore } from '../../store/useReviewStore';
import type { VersionStatus, VersionSnapshot } from '../../types';
import { VersionReviewModal } from './VersionReviewModal';

const statusMeta: Record<VersionStatus, { label: string; color: string; bg: string; border: string; icon: typeof Package; }> = {
  draft: { label: '草稿', color: 'text-ghost-600', bg: 'bg-abyss-700/40', border: 'border-abyss-600/60', icon: FileWarning },
  'pending-review': { label: '待审核', color: 'text-amber-400', bg: 'bg-amber-900/30', border: 'border-amber-700/50', icon: Clock },
  published: { label: '已发布', color: 'text-moss-400', bg: 'bg-moss-800/40', border: 'border-moss-700/50', icon: CheckCircle2 },
  archived: { label: '已归档', color: 'text-ghost-900', bg: 'bg-abyss-800/40', border: 'border-abyss-700/50', icon: Archive },
};

export function HotfixBoard() {
  const { versions, promoteDraftToPending, publishVersion, updateVersionStatus } = useDiffStore();
  const { todos } = useReviewStore();
  const [filterStatus, setFilterStatus] = useState<VersionStatus | 'all'>('all');
  const [selectedVersion, setSelectedVersion] = useState<VersionSnapshot | null>(null);

  // 按章节分组
  const chaptersMap = new Map<string, VersionSnapshot[]>();
  versions.forEach((v) => {
    const list = chaptersMap.get(v.chapterId) ?? [];
    list.push(v);
    chaptersMap.set(v.chapterId, list);
  });

  const chapterIds = Array.from(chaptersMap.keys());

  // 计算版本风险概览（用节点数+标签粗略评估，后续可接入实际diff）
  const getVersionRisk = (v: VersionSnapshot) => {
    const hasHotfixTag = v.tags.some((t) => t.includes('热修') || t.includes('草稿'));
    const nodeCount = v.nodes.length;
    if (hasHotfixTag && nodeCount > 10) return { level: '高', color: 'text-blood-400' };
    if (hasHotfixTag) return { level: '中', color: 'text-amber-400' };
    return { level: '低', color: 'text-moss-400' };
  };

  // 统计版本关联的待办数
  const getRelatedTodoCount = (v: VersionSnapshot) => {
    if (!v.relatedTodoIds?.length) return 0;
    return v.relatedTodoIds.filter((tid) => todos.some((t) => t.id === tid)).length;
  };

  const filteredChapterIds = filterStatus === 'all'
    ? chapterIds
    : chapterIds.filter((cid) => chaptersMap.get(cid)?.some((v) => v.status === filterStatus));

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="section-title flex items-center gap-2 !mb-0">
          <Package className="w-4 h-4 text-blood-500" />
          热修发布看板
        </h2>
        <span className="text-[10px] text-ghost-900 ml-2">
          共 {versions.length} 个版本 · {chaptersMap.size} 个章节
        </span>
        <div className="ml-auto flex items-center gap-1 text-[10px]">
          {(['all', 'draft', 'pending-review', 'published'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={clsx(
                'px-2.5 py-1 rounded-sm border transition-colors',
                filterStatus === s
                  ? 'border-blood-700/60 bg-blood-900/30 text-blood-400'
                  : 'border-abyss-600/50 text-ghost-800 hover:border-abyss-500/60 hover:text-ghost-600'
              )}
            >
              {s === 'all' ? '全部' : statusMeta[s].label}
            </button>
          ))}
        </div>
      </div>

      {filteredChapterIds.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4 opacity-20">📜</div>
          <p className="text-ghost-700 font-serif tracking-wider text-sm">
            暂无{filterStatus !== 'all' ? statusMeta[filterStatus as VersionStatus].label : ''}版本
          </p>
        </div>
      ) : (
        filteredChapterIds.map((chapterId) => {
          const chapterVersions = chaptersMap.get(chapterId) ?? [];
          const displayVersions = filterStatus === 'all'
            ? chapterVersions
            : chapterVersions.filter((v) => v.status === filterStatus);
          if (displayVersions.length === 0) return null;

          return (
            <div key={chapterId} className="gothic-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-sm bg-blood-900/40 border border-blood-800/50 flex items-center justify-center">
                  <GitBranch className="w-3.5 h-3.5 text-blood-400" />
                </div>
                <div>
                  <h3 className="text-sm font-serif font-semibold text-ghost-500 tracking-wider">
                    章节 {chapterId.toUpperCase()}
                  </h3>
                  <p className="text-[10px] text-ghost-900">
                    {displayVersions.length} 个版本
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-3 text-[10px] text-ghost-900">
                  <span>草稿: {chapterVersions.filter((v) => v.status === 'draft').length}</span>
                  <span>待审核: {chapterVersions.filter((v) => v.status === 'pending-review').length}</span>
                  <span>已发布: {chapterVersions.filter((v) => v.status === 'published').length}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {displayVersions.map((v) => {
                  const meta = statusMeta[v.status];
                  const StatusIcon = meta.icon;
                  const risk = getVersionRisk(v);
                  const todoCount = getRelatedTodoCount(v);

                  return (
                    <div
                      key={v.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVersion(v);
                      }}
                      className={clsx(
                        'p-3 rounded-sm border transition-all hover:translate-y-[-1px] cursor-pointer group',
                        'bg-abyss-850/50 border-abyss-700/60 hover:border-blood-700/50 hover:bg-abyss-800/50'
                      )}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <div className={clsx('w-8 h-8 rounded-sm flex items-center justify-center shrink-0', meta.bg, meta.border, 'border')}>
                          <StatusIcon className="w-4 h-4" style={{ color: meta.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-medium text-ghost-500 truncate">{v.name}</h4>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={clsx('px-1.5 py-0.5 rounded-sm border text-[9px] font-semibold tracking-wider', meta.color, meta.bg, meta.border)}>
                              {meta.label}
                            </span>
                            <span className="text-[9px] font-mono text-ghost-900">{v.versionCode}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-[10px] text-ghost-900 leading-relaxed line-clamp-2 mb-2 min-h-[2em]">
                        {v.description || '（无描述）'}
                      </p>

                      <div className="flex items-center gap-2 text-[10px] text-ghost-900 mb-2 flex-wrap">
                        <span className="flex items-center gap-0.5">
                          <Package className="w-2.5 h-2.5" /> {v.nodes.length} 节点
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span className={risk.color}>风险 {risk.level}</span>
                        </span>
                        {todoCount > 0 && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-0.5 text-amber-400">
                              {todoCount} 项关联待办
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[9px] text-ghost-900 pt-2 border-t border-abyss-700/40">
                        <span>{v.createdBy}</span>
                        <span>·</span>
                        <span>{v.createdAt.slice(5)}</span>
                        {v.publishTime && (
                          <>
                            <span>·</span>
                            <span className="text-moss-400">发布 {v.publishTime.slice(5)}</span>
                          </>
                        )}
                      </div>

                      {/* 操作按钮 */}
                      <div className="mt-2.5 pt-2 border-t border-abyss-700/40 flex items-center gap-1.5">
                        {v.status === 'draft' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              promoteDraftToPending(v.id);
                            }}
                            className="flex-1 py-1 text-[10px] text-amber-400 rounded-sm hover:bg-amber-900/20 border border-transparent hover:border-amber-700/40 transition-colors flex items-center justify-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            提交审核
                          </button>
                        )}
                        {v.status === 'pending-review' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateVersionStatus(v.id, 'draft', '退回修改');
                              }}
                              className="flex-1 py-1 text-[10px] text-ghost-800 rounded-sm hover:bg-abyss-700/50 border border-transparent hover:border-abyss-600/60 transition-colors"
                            >
                              退回
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                publishVersion(v.id);
                              }}
                              className="flex-1 py-1 text-[10px] text-moss-400 rounded-sm hover:bg-moss-900/20 border border-transparent hover:border-moss-700/40 transition-colors flex items-center justify-center gap-1"
                            >
                              <Play className="w-3 h-3" />
                              通过并发布
                            </button>
                          </>
                        )}
                        {v.status === 'published' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateVersionStatus(v.id, 'archived', '归档');
                            }}
                            className="flex-1 py-1 text-[10px] text-ghost-800 rounded-sm hover:bg-abyss-700/40 border border-transparent hover:border-abyss-600/50 transition-colors flex items-center justify-center gap-1"
                          >
                            <Archive className="w-3 h-3" />
                            归档
                          </button>
                        )}
                        {v.status === 'archived' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateVersionStatus(v.id, 'draft', '恢复为草稿');
                            }}
                            className="flex-1 py-1 text-[10px] text-ghost-700 rounded-sm hover:bg-abyss-700/40 border border-transparent hover:border-abyss-600/50 transition-colors"
                          >
                            恢复草稿
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {selectedVersion && (
        <VersionReviewModal
          version={selectedVersion}
          onClose={() => setSelectedVersion(null)}
        />
      )}
    </div>
  );
}
