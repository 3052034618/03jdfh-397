import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Eye, Heart, Zap, RotateCcw, ChevronRight, User, CheckSquare, Square, ListTodo, Send, Save } from 'lucide-react';
import { clsx } from 'clsx';
import { useDiffStore } from '../../store/useDiffStore';
import { useReviewStore } from '../../store/useReviewStore';
import type { NodeDiff, DiffSeverity, EmotionProfile, DialogNode } from '../../types';

const severityStyle: Record<DiffSeverity, { label: string; color: string; bg: string; border: string; }> = {
  low: { label: '低', color: 'text-ghost-700', bg: 'bg-abyss-700/50', border: 'border-abyss-600/60' },
  medium: { label: '中', color: 'text-amber-400', bg: 'bg-amber-900/30', border: 'border-amber-700/50' },
  high: { label: '高', color: 'text-blood-400', bg: 'bg-blood-900/30', border: 'border-blood-700/60' },
  critical: { label: '严重', color: 'text-blood-300', bg: 'bg-blood-800/50', border: 'border-blood-500/70 animate-pulse-slow' },
};

function formatValue(v: any): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object') return JSON.stringify(v, null, 0);
  return String(v);
}

function EmotionBar({ label, oldV, newV, color, min = 0, max = 100 }: { label: string; oldV: number; newV: number; color: string; min?: number; max?: number; }) {
  const delta = newV - oldV;
  const Icon = delta === 0 ? Minus : delta > 0 ? TrendingUp : TrendingDown;
  const deltaColor = delta === 0 ? 'text-ghost-900' : delta > 0 ? 'text-blood-400' : 'text-moss-500';
  const oldPct = ((oldV - min) / (max - min)) * 100;
  const newPct = ((newV - min) / (max - min)) * 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium tracking-wider" style={{ color }}>{label}</span>
        <div className="flex items-center gap-1 text-[10px] font-mono">
          <span className="text-ghost-900">{oldV}</span>
          <span className="text-ghost-900">→</span>
          <span className="text-ghost-500">{newV}</span>
          {delta !== 0 && (
            <span className={clsx('flex items-center gap-0.5', deltaColor)}>
              <Icon className="w-2.5 h-2.5" />
              {delta > 0 ? '+' : ''}
              {delta}
            </span>
          )}
        </div>
      </div>
      <div className="relative h-2 bg-abyss-900/80 rounded-full overflow-hidden border border-abyss-700/60">
        <div
          className="absolute inset-y-0 left-0 opacity-50"
          style={{ width: `${oldPct}%`, background: `linear-gradient(90deg, ${color}40, ${color}70)` }}
        />
        <div
          className="absolute inset-y-0 left-0"
          style={{
            clipPath: `polygon(${Math.max(0, oldPct - 0.5)}% 0, ${newPct}% 0, ${newPct}% 100%, ${Math.max(0, oldPct - 0.5)}% 100%)`,
            background: delta >= 0
              ? 'linear-gradient(90deg, rgba(196, 30, 30, 0.4), rgba(196, 30, 30, 0.8))'
              : 'linear-gradient(90deg, rgba(94, 138, 74, 0.4), rgba(94, 138, 74, 0.8))',
          }}
        />
        <div className="absolute top-0 bottom-0 border-r border-dashed border-ghost-300/50" style={{ left: `${newPct}%` }} />
      </div>
    </div>
  );
}

export function DiffViewer() {
  const {
    diffReport,
    compareStatus,
    selectedDiffIndex,
    setSelectedDiffIndex,
    rollbackNodeDiff,
    rollbackDiffKeys,
    toggleRollbackItem,
    clearRollbackPlan,
    selectAllRollback,
    executeRollbackPlanByField,
    saveRollbackPlan,
    isInRollbackPlan,
    getFieldRollbackPreview,
  } = useDiffStore();
  const { createTodoFromFeedback } = useReviewStore();
  const [showPlanPanel, setShowPlanPanel] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planNote, setPlanNote] = useState('');
  const [showTodoModal, setShowTodoModal] = useState(false);

  if (!diffReport) {
    const hint =
      compareStatus === 'same-version'
        ? '⚠ 旧版与新版为同一个版本，请更换其中一个后再查看差异'
        : compareStatus === 'missing-old' || compareStatus === 'missing-new' || compareStatus === 'missing-both'
        ? '请在上方选择两个不同版本以生成差异报告'
        : '请选择两个版本以生成差异报告…';

    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="text-5xl mb-4 opacity-20 animate-float">🩸</div>
          <p className="text-ghost-700 font-serif tracking-wider text-sm leading-relaxed whitespace-pre-line">
            {hint}
          </p>
        </div>
      </div>
    );
  }

  const { nodeDiffs, summary, oldVersion, newVersion } = diffReport;
  const selectedDiff = selectedDiffIndex != null ? nodeDiffs[selectedDiffIndex] : null;
  const selectedOldNode = selectedDiff ? oldVersion.nodes.find((n) => n.id === selectedDiff.nodeId) : undefined;
  const selectedNewNode = selectedDiff ? newVersion.nodes.find((n) => n.id === selectedDiff.nodeId) : undefined;

  return (
    <div className="flex-1 min-h-0 flex flex-col relative">
      <div className="border-b border-abyss-700/60 p-4">
        <div className="grid grid-cols-3 gap-6">
          <DiffColumn
            title="玩家可见信息差异"
            icon={Eye}
            accent="#c9a227"
            diffs={nodeDiffs.filter((d) => d.diffType === 'visible_info' || d.diffType === 'text')}
          />
          <DiffColumn
            title="角色态度与情绪"
            icon={Heart}
            accent="#c41e1e"
            diffs={nodeDiffs.filter((d) => d.diffType === 'emotion' || d.diffType === 'choice')}
            headerExtra={
              <div className="mt-3 space-y-2 border-t border-abyss-700/50 pt-3">
                <p className="text-[10px] text-ghost-900 tracking-widest uppercase mb-2">全章节情绪曲线变化</p>
                <EmotionBar label="恐惧 Fear" oldV={avgEmotion(oldVersion.nodes, 'fear')} newV={avgEmotion(newVersion.nodes, 'fear')} color="#c41e1e" />
                <EmotionBar label="紧张 Tension" oldV={avgEmotion(oldVersion.nodes, 'tension')} newV={avgEmotion(newVersion.nodes, 'tension')} color="#c9a227" />
                <EmotionBar label="信任 Trust" oldV={avgEmotion(oldVersion.nodes, 'trust')} newV={avgEmotion(newVersion.nodes, 'trust')} min={-50} max={50} color="#3a7ca5" />
                <EmotionBar label="希望 Hope" oldV={avgEmotion(oldVersion.nodes, 'hope')} newV={avgEmotion(newVersion.nodes, 'hope')} color="#5e8a4a" />
              </div>
            }
          />
          <DiffColumn
            title="恐惧强度 / 剧情强度"
            icon={Zap}
            accent="#6b0000"
            diffs={nodeDiffs.filter((d) => d.severity === 'high' || d.severity === 'critical')}
            headerExtra={
              <div className="mt-3 border-t border-abyss-700/50 pt-3">
                <FearCurve oldNodes={oldVersion.nodes} newNodes={newVersion.nodes} />
              </div>
            }
          />
        </div>

        <div className="mt-4 flex items-center gap-4 text-[10px] border-t border-abyss-700/40 pt-3">
          <div className="flex items-center gap-1.5">
            <span className="text-ghost-900">变更总数：</span>
            <span className="font-serif text-lg text-ghost-500">{summary.totalChanges}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-ghost-900">高风险项：</span>
            <span className="font-serif text-lg text-blood-400">{summary.highRiskCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-ghost-900">对比版本：</span>
            <span className="text-ghost-700 font-mono">{oldVersion.name}</span>
            <ChevronRight className="w-3 h-3 text-blood-500" />
            <span className="text-moss-400 font-mono">{newVersion.name}</span>
          </div>
          <div className="ml-auto flex gap-2">
            <button className="gothic-btn !py-1 !px-3 !text-xs">导出报告</button>
            <button className="gothic-btn-amber !py-1 !px-3 !text-xs">存为草稿</button>
            <button className="gothic-btn-primary !py-1 !px-4 !text-xs">✓ 审核通过并发布</button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 border-r border-abyss-700/60">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="section-title flex items-center gap-2 !mb-0 !border-b-0 !pb-0">
              <span>所有变更列表</span>
              <span className="text-[10px] text-ghost-900 font-sans font-normal normal-case tracking-normal ml-1">
                （{nodeDiffs.length} 项）
              </span>
            </h3>
            <div className="flex items-center gap-1 text-[9px]">
              <button
                onClick={() => selectAllRollback(['high', 'critical'])}
                className="px-2 py-1 rounded-sm border border-blood-700/50 text-blood-400 hover:bg-blood-900/30 transition-colors"
              >
                全选高风险
              </button>
              <button
                onClick={clearRollbackPlan}
                className="px-2 py-1 rounded-sm border border-abyss-600/60 text-ghost-900 hover:bg-abyss-700/40 transition-colors"
              >
                清空
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {nodeDiffs.map((diff, idx) => (
              <DiffRow
                key={diff.nodeId + diff.field}
                diff={diff}
                index={idx}
                isSelected={selectedDiffIndex === idx}
                isChecked={isInRollbackPlan(diff.nodeId, diff.field)}
                onClick={() => setSelectedDiffIndex(idx)}
                onCheck={() => toggleRollbackItem(diff.nodeId, diff.field)}
              />
            ))}
          </div>
        </div>

        <div className="w-[420px] shrink-0 h-full flex flex-col bg-abyss-850/40">
          <div className="p-3 border-b border-abyss-700/50">
            <h3 className="section-title !mb-0 flex items-center gap-2 !border-b-0 !pb-0">
              <Zap className="w-3.5 h-3.5 text-blood-400" />
              节点改动详情
            </h3>
          </div>

          {selectedDiff ? (
            <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3">
              <div className="gothic-card p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-[10px] text-ghost-900 tracking-widest uppercase mb-0.5">目标节点</p>
                    <p className="font-mono text-sm text-ghost-500">{selectedDiff.nodeId}</p>
                    <p className="text-[10px] text-ghost-900 mt-0.5">
                      字段：<span className="text-ghost-700">{selectedDiff.field}</span>
                    </p>
                  </div>
                  <span className={clsx(
                    'px-2 py-0.5 text-[9px] font-bold tracking-wider rounded-sm border',
                    severityStyle[selectedDiff.severity].color,
                    severityStyle[selectedDiff.severity].bg,
                    severityStyle[selectedDiff.severity].border
                  )}>
                    {severityStyle[selectedDiff.severity].label}风险
                  </span>
                </div>
                <p className="text-[11px] text-ghost-500 leading-relaxed">{selectedDiff.description}</p>
                {selectedDiff.suspenseRisk && (
                  <div className="mt-2 px-2 py-1.5 rounded-sm bg-blood-900/40 border border-blood-700/50 text-[10px] text-blood-300 flex items-center gap-1.5 animate-pulse-slow">
                    <span>⚠</span> 悬念风险：可能破坏后续剧情铺垫
                  </div>
                )}
              </div>

              {selectedOldNode && selectedNewNode && (
                <>
                  <NodeMetaCompare oldNode={selectedOldNode} newNode={selectedNewNode} />

                  <SectionBlock title="对白文本" field="text">
                    <CompareBox oldValue={selectedOldNode.text} newValue={selectedNewNode.text} />
                  </SectionBlock>

                  <SectionBlock title="玩家可见信息" field="visibleInfo">
                    <CompareList oldValue={selectedOldNode.visibleInfo} newValue={selectedNewNode.visibleInfo} />
                  </SectionBlock>

                  {(selectedOldNode.choices?.length || selectedNewNode.choices?.length) ? (
                    <SectionBlock title="选项配置" field="choices">
                      <ChoiceCompare oldChoices={selectedOldNode.choices ?? []} newChoices={selectedNewNode.choices ?? []} />
                    </SectionBlock>
                  ) : null}

                  {(selectedOldNode.conditions || selectedNewNode.conditions) ? (
                    <SectionBlock title="触发条件" field="conditions">
                      <CompareBox oldValue={selectedOldNode.conditions ?? ''} newValue={selectedNewNode.conditions ?? ''} mono />
                    </SectionBlock>
                  ) : null}

                  <SectionBlock title="情绪数值" field="emotion">
                    <div className="space-y-2.5">
                      <EmotionBar label="恐惧 Fear" oldV={selectedOldNode.emotion.fear} newV={selectedNewNode.emotion.fear} color="#c41e1e" />
                      <EmotionBar label="紧张 Tension" oldV={selectedOldNode.emotion.tension} newV={selectedNewNode.emotion.tension} color="#c9a227" />
                      <EmotionBar label="信任 Trust" oldV={selectedOldNode.emotion.trust} newV={selectedNewNode.emotion.trust} min={-50} max={50} color="#3a7ca5" />
                      <EmotionBar label="希望 Hope" oldV={selectedOldNode.emotion.hope} newV={selectedNewNode.emotion.hope} color="#5e8a4a" />
                    </div>
                  </SectionBlock>
                </>
              )}

              {(!selectedOldNode || !selectedNewNode) && (
                <div className="gothic-card p-3 text-[11px] text-ghost-700 text-center">
                  {!selectedOldNode ? '该节点为新增节点，旧版中不存在' : '该节点在新版中已被删除'}
                </div>
              )}

              {selectedOldNode && (
                <button
                  onClick={() => rollbackNodeDiff(selectedDiff.nodeId)}
                  className="w-full gothic-btn !py-2 flex items-center justify-center gap-2 text-blood-400 !border-blood-700/50 hover:!bg-blood-900/40"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  将此节点回滚至旧版
                </button>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="text-4xl opacity-20 mb-3">🕯️</div>
                <p className="text-[11px] text-ghost-900 font-serif tracking-wider leading-relaxed">
                  点击左侧任意一条变更
                  <br />查看该节点的完整改动详情
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 底部回滚计划栏 */}
      {rollbackDiffKeys.length > 0 && (
        <div className="border-t border-abyss-700/60 bg-abyss-900/90 backdrop-blur-sm p-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-amber-800/40 border border-amber-700/60 flex items-center justify-center">
              <ListTodo className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-xs text-ghost-500 font-medium">
                回滚计划 · 已选 {rollbackDiffKeys.length} 项
              </div>
              <div className="text-[10px] text-ghost-900">
                {new Set(rollbackDiffKeys.map((k) => k.split('|')[0])).size} 个节点
              </div>
            </div>
          </div>

          <div className="flex-1" />

          <button
            onClick={() => setShowPlanPanel(!showPlanPanel)}
            className="gothic-btn !py-1.5 !px-3 !text-xs"
          >
            查看清单
          </button>
          <button
            onClick={() => {
              const stamp = new Date().toLocaleString('zh-CN').slice(0, 16);
              const name = `回滚计划 ${stamp}`;
              saveRollbackPlan(name, `从差异报告生成，${rollbackDiffKeys.length} 项变更`);
              setShowPlanPanel(false);
            }}
            className="gothic-btn-amber !py-1.5 !px-3 !text-xs flex items-center gap-1.5"
          >
            保存计划
          </button>
          <button
            onClick={() => setShowTodoModal(true)}
            className="gothic-btn-primary !py-1.5 !px-3 !text-xs flex items-center gap-1.5"
          >
            <Send className="w-3 h-3" />
            生成复盘待办
          </button>
          <button
            onClick={() => {
              const preview = getFieldRollbackPreview();
              const msg = `确认回滚 ${preview.length} 项字段级变更？\n\n涉及 ${new Set(preview.map((p: any) => p.nodeId)).size} 个节点，${new Set(preview.map((p: any) => p.field)).size} 种字段类型。`;
              if (confirm(msg)) {
                executeRollbackPlanByField();
              }
            }}
            className="!py-1.5 !px-3 !text-xs flex items-center gap-1.5 bg-blood-900/50 border border-blood-700/60 text-blood-400 hover:bg-blood-900/70 rounded-sm transition-colors font-semibold tracking-wider"
          >
            <RotateCcw className="w-3 h-3" />
            执行回滚
          </button>
        </div>
      )}

      {/* 回滚计划清单抽屉 */}
      {showPlanPanel && rollbackDiffKeys.length > 0 && diffReport && (
        <div className="absolute bottom-16 left-4 right-4 max-h-[70vh] z-10 gothic-card p-4 overflow-y-auto scrollbar-thin">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-xs font-serif font-semibold text-ghost-500 tracking-wider">回滚清单预览</h3>
            <span className="text-[10px] text-ghost-900 font-mono">
              {getFieldRollbackPreview().length} 项变更 · {new Set(getFieldRollbackPreview().map((p: any) => p.nodeId)).size} 节点
            </span>
            <div className="ml-auto flex items-center gap-1 text-[9px]">
              <span className="text-blood-500">红色</span>
              <span className="text-ghost-900">= 旧值（将恢复）</span>
              <span className="text-moss-400 ml-2">绿色</span>
              <span className="text-ghost-900">= 现值（将回滚）</span>
            </div>
            <button
              onClick={() => setShowPlanPanel(false)}
              className="ml-2 text-ghost-900 hover:text-blood-400 text-xs"
            >
              关闭 ✕
            </button>
          </div>
          <div className="space-y-3">
            {(() => {
              const items = getFieldRollbackPreview();
              // 按字段类型分组
              const byField: Record<string, any[]> = {};
              items.forEach((it: any) => {
                const key = it.field;
                if (!byField[key]) byField[key] = [];
                byField[key].push(it);
              });
              const fieldLabels: Record<string, string> = {
                text: '对白文本',
                emotion: '情绪配置',
                choices: '选项',
                visibleInfo: '可见信息',
                conditions: '触发条件',
              };
              return Object.entries(byField).map(([field, fieldItems]) => (
                <div key={field} className="gothic-card p-2.5">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-[11px] font-semibold text-ghost-500 tracking-wider">
                      {fieldLabels[field] ?? field}
                    </h4>
                    <span className="text-[9px] text-ghost-900 font-mono">{fieldItems.length} 处</span>
                  </div>
                  <div className="space-y-1.5">
                    {fieldItems.map((item: any) => {
                      const diff = diffReport.nodeDiffs.find(
                        (d) => d.nodeId === item.nodeId && d.field === item.field
                      );
                      const sev = diff ? severityStyle[diff.severity] : severityStyle.medium;
                      return (
                        <div key={item.nodeId + item.field} className="bg-abyss-800/40 rounded-sm p-2 border border-abyss-700/50">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={clsx('px-1.5 py-0.5 text-[8.5px] font-bold tracking-wider rounded-sm border', sev.color, sev.bg, sev.border)}>
                              {sev.label}
                            </span>
                            <span className="text-[9px] font-mono text-ghost-700">{item.nodeId}</span>
                            {diff?.suspenseRisk && (
                              <span className="text-[8.5px] text-blood-400">⚠ 悬念风险</span>
                            )}
                            {diff && (
                              <span className="text-[9px] text-ghost-900 ml-auto">{diff.description}</span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-1.5 rounded-sm bg-blood-900/15 border border-blood-800/30">
                              <p className="text-[8px] text-blood-500 tracking-wider mb-0.5 uppercase">← 将恢复为</p>
                              <p className="text-[10px] text-ghost-900/80 leading-relaxed break-words font-medium">
                                {Array.isArray(item.oldValue)
                                  ? item.oldValue.join(', ') || '(空)'
                                  : typeof item.oldValue === 'object'
                                  ? JSON.stringify(item.oldValue, null, 1)
                                  : String(item.oldValue)}
                              </p>
                            </div>
                            <div className="p-1.5 rounded-sm bg-moss-800/20 border border-moss-700/40">
                              <p className="text-[8px] text-moss-500 tracking-wider mb-0.5 uppercase">当前值 →</p>
                              <p className="text-[10px] text-ghost-500 leading-relaxed break-words">
                                {Array.isArray(item.newValue)
                                  ? item.newValue.join(', ') || '(空)'
                                  : typeof item.newValue === 'object'
                                  ? JSON.stringify(item.newValue, null, 1)
                                  : String(item.newValue)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* 生成复盘待办弹窗 */}
      {showTodoModal && diffReport && (
        <div className="absolute inset-0 bg-abyss-950/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="gothic-card p-5 w-full max-w-md">
            <h3 className="text-sm font-serif font-semibold text-ghost-500 tracking-wider mb-3">
              生成复盘待办
            </h3>
            <p className="text-[11px] text-ghost-900 mb-3">
              将选中的 {rollbackDiffKeys.length} 项变更整理为一条复盘待办，推送到社区复盘页。
            </p>
            <div className="space-y-2 mb-4">
              <div>
                <label className="gothic-label">待办标题</label>
                <input
                  value={planName || `热修回滚 · ${diffReport.oldVersion.name} → ${diffReport.newVersion.name}`}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="gothic-input !py-1.5 !text-xs w-full"
                />
              </div>
              <div>
                <label className="gothic-label">备注说明</label>
                <textarea
                  value={planNote}
                  onChange={(e) => setPlanNote(e.target.value)}
                  rows={3}
                  className="gothic-input !py-1.5 !text-xs w-full resize-none"
                  placeholder="选填：回滚原因、风险说明等"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTodoModal(false)}
                className="gothic-btn flex-1 !py-1.5 !text-xs"
              >
                取消
              </button>
              <button
                onClick={() => {
                  const nodeIds = new Set(rollbackDiffKeys.map((k) => k.split('|')[0]));
                  createTodoFromFeedback(
                    [],
                    planName || `热修回滚 · ${diffReport.oldVersion.name} → ${diffReport.newVersion.name}`,
                    planNote || `回滚 ${rollbackDiffKeys.length} 项变更，涉及 ${nodeIds.size} 个节点`,
                    'high',
                    '当前用户',
                    Array.from(nodeIds)[0]
                  );
                  setShowTodoModal(false);
                }}
                className="gothic-btn-primary flex-1 !py-1.5 !text-xs"
              >
                确认生成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function avgEmotion(nodes: DialogNode[], key: keyof EmotionProfile) {
  if (!nodes.length) return 0;
  return Math.round(nodes.reduce((s, n) => s + (n.emotion?.[key] ?? 0), 0) / nodes.length);
}

function FearCurve({ oldNodes, newNodes }: { oldNodes: DialogNode[]; newNodes: DialogNode[] }) {
  const w = 260;
  const h = 60;
  const dataToPath = (arr: number[]) => {
    if (!arr.length) return '';
    const step = w / (arr.length - 1 || 1);
    return arr
      .map((v, i) => {
        const x = i * step;
        const y = h - (v / 100) * h;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };
  const oldArr = oldNodes.map((n) => n.emotion?.fear ?? 50);
  const newArr = newNodes.map((n) => n.emotion?.fear ?? 50);

  return (
    <div>
      <p className="text-[9px] text-ghost-900 mb-1 tracking-wider uppercase">恐惧曲线对比</p>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
        <defs>
          <linearGradient id="fear-old" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#6b0000" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6b0000" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="fear-new" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#c41e1e" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#c41e1e" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map((v) => (
          <line
            key={v}
            x1={0}
            x2={w}
            y1={h - (v / 100) * h}
            y2={h - (v / 100) * h}
            stroke="#25253a"
            strokeDasharray="2 3"
            strokeWidth={0.5}
          />
        ))}
        <path d={`${dataToPath(oldArr)} L ${w} ${h} L 0 ${h} Z`} fill="url(#fear-old)" />
        <path d={`${dataToPath(newArr)} L ${w} ${h} L 0 ${h} Z`} fill="url(#fear-new)" />
        <path d={dataToPath(oldArr)} fill="none" stroke="#6b0000" strokeWidth={1.2} strokeDasharray="3 3" />
        <path d={dataToPath(newArr)} fill="none" stroke="#c41e1e" strokeWidth={1.8} />
      </svg>
      <div className="flex gap-3 mt-1 text-[9px]">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 border-t-2 border-dashed border-blood-800 inline-block" /><span className="text-ghost-900">旧版</span></span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blood-500 inline-block" /><span className="text-ghost-700">新版</span></span>
      </div>
    </div>
  );
}

interface ColProps {
  title: string;
  icon: typeof Eye;
  accent: string;
  diffs: NodeDiff[];
  headerExtra?: React.ReactNode;
}

function DiffColumn({ title, icon: Icon, accent, diffs, headerExtra }: ColProps) {
  return (
    <div className="gothic-card p-3 min-h-[160px]">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color: accent }} />
        <span className="text-xs font-semibold tracking-wider" style={{ color: accent }}>{title}</span>
        <span className="ml-auto text-[10px] text-ghost-900 font-mono">{diffs.length} 项</span>
      </div>
      <div className="space-y-1.5">
        {diffs.slice(0, 3).map((d) => {
          const sev = severityStyle[d.severity];
          return (
            <div key={d.nodeId + d.field} className={clsx('p-2 rounded-sm border text-[10px]', sev.bg, sev.border)}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className={clsx('px-1 rounded-sm font-semibold tracking-wider border text-[9px]', sev.color, sev.bg, sev.border)}>
                  {sev.label}
                </span>
                <span className="font-mono text-ghost-900">{d.nodeId}</span>
                {d.suspenseRisk && <span className="ml-auto text-blood-400 animate-pulse-slow">⚠</span>}
              </div>
              <div className="space-y-0.5 leading-relaxed">
                <div className="line-through text-ghost-900/80">
                  <span className="text-blood-700 mr-1">−</span>{formatValue(d.oldValue).slice(0, 60)}
                </div>
                <div className="text-ghost-500">
                  <span className="text-moss-500 mr-1">+</span>{formatValue(d.newValue).slice(0, 60)}
                </div>
              </div>
            </div>
          );
        })}
        {diffs.length === 0 && <div className="text-center py-4 text-[10px] text-ghost-900">无相关变更</div>}
      </div>
      {headerExtra}
    </div>
  );
}

interface RowProps {
  diff: NodeDiff;
  index: number;
  isSelected: boolean;
  isChecked: boolean;
  onClick: () => void;
  onCheck: () => void;
}

function DiffRow({ diff, isSelected, isChecked, onClick, onCheck }: RowProps) {
  const sev = severityStyle[diff.severity];
  return (
    <div
      className={clsx(
        'gothic-card p-3 cursor-pointer transition-all duration-200',
        isSelected && 'border-blood-600/70 shadow-glow-red ring-1 ring-blood-700/40',
        isChecked && 'ring-2 ring-amber-500/60'
      )}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCheck();
          }}
          className="shrink-0 mt-0.5 text-ghost-700 hover:text-amber-400 transition-colors"
        >
          {isChecked ? (
            <CheckSquare className="w-4 h-4 text-amber-400" />
          ) : (
            <Square className="w-4 h-4" />
          )}
        </button>
        <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
          <span className={clsx('px-2 py-0.5 text-[9px] font-bold tracking-wider rounded-sm border', sev.color, sev.bg, sev.border)}>
            {sev.label}风险
          </span>
          <span className="font-mono text-[9px] text-ghost-900">{diff.nodeId}</span>
        </div>
        <div className="flex-1 min-w-0" onClick={onClick}>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-medium text-ghost-500">{diff.description}</span>
            <span className="text-[9px] text-ghost-900 font-mono">字段: {diff.field}</span>
            {diff.suspenseRisk && (
              <span className="ml-auto px-1.5 py-0.5 rounded-sm bg-blood-900/50 border border-blood-700/60 text-blood-300 text-[9px] font-semibold animate-pulse-slow flex items-center gap-1">
                <span>⚠</span> 悬念风险
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-sm bg-blood-900/15 border border-blood-800/30">
              <p className="text-[9px] text-blood-500 tracking-wider mb-1 uppercase">旧版 (删除)</p>
              <p className="text-xs line-through text-ghost-900/80 leading-relaxed break-words">
                {formatValue(diff.oldValue)}
              </p>
            </div>
            <div className="p-2 rounded-sm bg-moss-800/20 border border-moss-700/40">
              <p className="text-[9px] text-moss-500 tracking-wider mb-1 uppercase">新版 (新增)</p>
              <p className="text-xs text-ghost-500 leading-relaxed break-words">{formatValue(diff.newValue)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionBlock({ title, field, children }: { title: string; field: string; children: React.ReactNode; }) {
  return (
    <div className="gothic-card p-3">
      <p className="text-[10px] text-ghost-900 tracking-widest uppercase mb-2 flex items-center gap-1.5">
        <span className="w-1 h-1 rounded-full bg-blood-600 inline-block" />
        {title}
        <span className="font-mono text-ghost-900/60 normal-case tracking-normal">({field})</span>
      </p>
      {children}
    </div>
  );
}

function NodeMetaCompare({ oldNode, newNode }: { oldNode: DialogNode; newNode: DialogNode }) {
  return (
    <div className="gothic-card p-3">
      <p className="text-[10px] text-ghost-900 tracking-widest uppercase mb-2">节点元信息</p>
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div>
          <p className="text-blood-600 mb-0.5">旧版 · 说话者</p>
          <p className="text-ghost-700 flex items-center gap-1"><User className="w-2.5 h-2.5" /> {oldNode.speaker}</p>
          <p className="text-ghost-900 mt-1">类型: <span className="text-ghost-700">{oldNode.type}</span></p>
        </div>
        <div>
          <p className="text-moss-500 mb-0.5">新版 · 说话者</p>
          <p className="text-ghost-500 flex items-center gap-1"><User className="w-2.5 h-2.5" /> {newNode.speaker}</p>
          <p className="text-ghost-900 mt-1">类型: <span className="text-ghost-500">{newNode.type}</span></p>
        </div>
      </div>
    </div>
  );
}

function CompareBox({ oldValue, newValue, mono }: { oldValue: string; newValue: string; mono?: boolean }) {
  const diff = oldValue !== newValue;
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className={clsx('p-2 rounded-sm text-[11px] leading-relaxed break-words', diff ? 'bg-blood-900/15 border border-blood-800/30' : 'bg-abyss-900/40 border border-abyss-700/40')}>
        <p className={clsx('text-[9px] mb-1 uppercase tracking-wider', diff ? 'text-blood-500' : 'text-ghost-900')}>旧版</p>
        <p className={clsx(diff ? 'line-through text-ghost-900/80' : 'text-ghost-700', mono && 'font-mono text-[10px]')}>
          {oldValue || '—'}
        </p>
      </div>
      <div className={clsx('p-2 rounded-sm text-[11px] leading-relaxed break-words', diff ? 'bg-moss-800/20 border border-moss-700/40' : 'bg-abyss-900/40 border border-abyss-700/40')}>
        <p className={clsx('text-[9px] mb-1 uppercase tracking-wider', diff ? 'text-moss-500' : 'text-ghost-900')}>新版</p>
        <p className={clsx(diff ? 'text-ghost-500' : 'text-ghost-700', mono && 'font-mono text-[10px]')}>
          {newValue || '—'}
        </p>
      </div>
    </div>
  );
}

function CompareList({ oldValue, newValue }: { oldValue: string[]; newValue: string[] }) {
  const all = Array.from(new Set([...oldValue, ...newValue]));
  return (
    <div className="space-y-1">
      {all.length === 0 && <p className="text-[10px] text-ghost-900">（无可见信息）</p>}
      {all.map((item, i) => {
        const inOld = oldValue.includes(item);
        const inNew = newValue.includes(item);
        const added = !inOld && inNew;
        const removed = inOld && !inNew;
        return (
          <div
            key={i}
            className={clsx(
              'px-2 py-1.5 rounded-sm text-[11px] flex items-center gap-1.5',
              added && 'bg-moss-800/30 border border-moss-700/40 text-moss-400',
              removed && 'bg-blood-900/25 border border-blood-800/40 text-blood-400 line-through',
              !added && !removed && 'bg-abyss-900/40 border border-abyss-700/40 text-ghost-700'
            )}
          >
            {added ? <span className="text-moss-400 font-bold">+</span> : removed ? <span className="text-blood-500 font-bold">−</span> : <span className="text-ghost-900">·</span>}
            {item}
          </div>
        );
      })}
    </div>
  );
}

function ChoiceCompare({ oldChoices, newChoices }: { oldChoices: any[]; newChoices: any[] }) {
  const max = Math.max(oldChoices.length, newChoices.length, 1);
  return (
    <div className="space-y-2">
      {Array.from({ length: max }).map((_, i) => {
        const oc = oldChoices[i];
        const nc = newChoices[i];
        return (
          <div key={i} className="border border-abyss-700/50 rounded-sm overflow-hidden">
            <div className="px-2 py-1 bg-abyss-700/30 text-[9px] text-ghost-700 tracking-widest uppercase border-b border-abyss-700/40">
              选项 {i + 1}
            </div>
            <div className="grid grid-cols-2 gap-0">
              <div className="p-2 text-[10px] border-r border-abyss-700/40 bg-blood-900/10">
                <p className="text-[9px] text-blood-500 mb-0.5 uppercase tracking-wider">旧版</p>
                {oc ? (
                  <>
                    <p className="text-ghost-700 leading-snug">{oc.label}</p>
                    {oc.reaction && <p className="text-ghost-900 mt-1 text-[9px] italic">反应: {oc.reaction}</p>}
                    <p className="text-ghost-900 mt-0.5 text-[9px] font-mono">权重: {oc.weight ?? 1}</p>
                  </>
                ) : (
                  <p className="text-blood-500 text-[10px]">（此项为新版新增）</p>
                )}
              </div>
              <div className="p-2 text-[10px] bg-moss-800/15">
                <p className="text-[9px] text-moss-500 mb-0.5 uppercase tracking-wider">新版</p>
                {nc ? (
                  <>
                    <p className="text-ghost-500 leading-snug">{nc.label}</p>
                    {nc.reaction && <p className="text-ghost-700 mt-1 text-[9px] italic">反应: {nc.reaction}</p>}
                    <p className="text-ghost-900 mt-0.5 text-[9px] font-mono">权重: {nc.weight ?? 1}</p>
                  </>
                ) : (
                  <p className="text-blood-400 text-[10px]">（此项在新版中被删除）</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
