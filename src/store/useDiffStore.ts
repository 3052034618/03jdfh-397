import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  VersionSnapshot,
  DiffReport,
  NodeDiff,
  EmotionProfile,
  DialogNode,
  VersionStatus,
  RollbackPlan,
  VersionAuditLog,
  AuditAction,
} from '../types';
import { versions as mockVersions } from '../data/versions';

function deepCompare(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function computeNodeDiffs(
  oldNodes: DialogNode[],
  newNodes: DialogNode[]
): NodeDiff[] {
  const diffs: NodeDiff[] = [];
  const oldMap = new Map(oldNodes.map((n) => [n.id, n]));
  const newMap = new Map(newNodes.map((n) => [n.id, n]));
  const allIds = new Set([...oldMap.keys(), ...newMap.keys()]);

  const hasSuspenseKeywords = (text: string): boolean => {
    const keywords = ['它们', '真相', '伏笔', '秘密', '反转', '原来'];
    return keywords.some((k) => text.includes(k));
  };

  allIds.forEach((id) => {
    const oldN = oldMap.get(id);
    const newN = newMap.get(id);

    if (!oldN && newN) {
      diffs.push({
        nodeId: id,
        diffType: 'text',
        severity: 'medium',
        field: '__added__',
        oldValue: null,
        newValue: newN.text,
        description: `新增节点「${newN.speaker}」`,
      });
      return;
    }
    if (oldN && !newN) {
      diffs.push({
        nodeId: id,
        diffType: 'text',
        severity: 'high',
        field: '__removed__',
        oldValue: oldN.text,
        newValue: null,
        suspenseRisk: true,
        description: `删除节点「${oldN.speaker}」，可能丢失叙事伏笔`,
      });
      return;
    }
    if (!oldN || !newN) return;

    if (oldN.text !== newN.text) {
      const isCritical =
        oldN.text.length > 0 &&
        newN.text.length > oldN.text.length + 20 &&
        hasSuspenseKeywords(newN.text);
      diffs.push({
        nodeId: id,
        diffType: 'text',
        severity: isCritical ? 'critical' : 'medium',
        field: 'text',
        oldValue: oldN.text,
        newValue: newN.text,
        suspenseRisk: isCritical,
        description: `对白文本变更${isCritical ? '（含悬念/伏笔关键词）' : ''}`,
      });
    }

    if (!deepCompare(oldN.emotion, newN.emotion)) {
      const hopeDelta = newN.emotion.hope - oldN.emotion.hope;
      const fearDelta = newN.emotion.fear - oldN.emotion.fear;
      const isHigh = Math.abs(hopeDelta) >= 10 || Math.abs(fearDelta) >= 10;
      diffs.push({
        nodeId: id,
        diffType: 'emotion',
        severity: isHigh ? 'high' : 'medium',
        field: 'emotion',
        oldValue: oldN.emotion,
        newValue: newN.emotion,
        suspenseRisk: hopeDelta <= -10,
        description: `情绪变化（恐惧${fearDelta >= 0 ? '+' : ''}${fearDelta}，希望${hopeDelta >= 0 ? '+' : ''}${hopeDelta}）${hopeDelta <= -10 ? '，希望值大幅下降需关注' : ''}`,
      });
    }

    if (!deepCompare(oldN.visibleInfo, newN.visibleInfo)) {
      const suspense = newN.visibleInfo.some((v) => hasSuspenseKeywords(v));
      diffs.push({
        nodeId: id,
        diffType: 'visible_info',
        severity: suspense ? 'critical' : 'medium',
        field: 'visibleInfo',
        oldValue: oldN.visibleInfo,
        newValue: newN.visibleInfo,
        suspenseRisk: suspense,
        description: `玩家可见信息变更${suspense ? '（含伏笔/悬念相关内容）' : ''}`,
      });
    }

    if (oldN.choices || newN.choices) {
      const oc = oldN.choices ?? [];
      const nc = newN.choices ?? [];
      if (!deepCompare(oc, nc)) {
        diffs.push({
          nodeId: id,
          diffType: 'choice',
          severity: 'high',
          field: 'choices',
          oldValue: oc.map((c) => ({ label: c.label, reaction: c.reaction, weight: c.weight, nextNodeId: c.nextNodeId })),
          newValue: nc.map((c) => ({ label: c.label, reaction: c.reaction, weight: c.weight, nextNodeId: c.nextNodeId })),
          suspenseRisk: oc.length !== nc.length,
          description: `选项配置变更（旧${oc.length}项→新${nc.length}项）`,
        });
      }
    }

    if (oldN.conditions !== newN.conditions && (oldN.conditions || newN.conditions)) {
      diffs.push({
        nodeId: id,
        diffType: 'condition',
        severity: 'medium',
        field: 'conditions',
        oldValue: oldN.conditions ?? '',
        newValue: newN.conditions ?? '',
        description: '触发条件变更',
      });
    }
  });

  return diffs;
}

function buildDiffReport(
  oldV: VersionSnapshot,
  newV: VersionSnapshot
): DiffReport {
  const nodeDiffs = computeNodeDiffs(oldV.nodes, newV.nodes);

  const avgOld = (key: keyof EmotionProfile) =>
    oldV.nodes.length
      ? Math.round(oldV.nodes.reduce((s, n) => s + (n.emotion[key] ?? 0), 0) / oldV.nodes.length)
      : 0;
  const avgNew = (key: keyof EmotionProfile) =>
    newV.nodes.length
      ? Math.round(newV.nodes.reduce((s, n) => s + (n.emotion[key] ?? 0), 0) / newV.nodes.length)
      : 0;

  const emotionDelta: EmotionProfile = {
    fear: avgNew('fear') - avgOld('fear'),
    tension: avgNew('tension') - avgOld('tension'),
    trust: avgNew('trust') - avgOld('trust'),
    hope: avgNew('hope') - avgOld('hope'),
  };

  const highRiskCount = nodeDiffs.filter(
    (d) => d.severity === 'high' || d.severity === 'critical'
  ).length;

  const suspenseWarnings = nodeDiffs
    .filter((d) => d.suspenseRisk)
    .map((d) => `节点 ${d.nodeId}：${d.description}`);

  return {
    chapterId: oldV.chapterId,
    oldVersion: oldV,
    newVersion: newV,
    nodeDiffs,
    summary: {
      totalChanges: nodeDiffs.length,
      highRiskCount,
      emotionDelta,
      suspenseWarnings,
    },
  };
}

export type VersionCompareStatus =
  | 'ok'
  | 'same-version'
  | 'missing-old'
  | 'missing-new'
  | 'missing-both';

interface DiffState {
  versions: VersionSnapshot[];
  oldVersionId: string | null;
  newVersionId: string | null;
  diffReport: DiffReport | null;
  selectedDiffIndex: number | null;
  compareStatus: VersionCompareStatus;
  rollbackDiffKeys: string[];
  rollbackPlans: RollbackPlan[];

  selectOldVersion: (id: string | null) => void;
  selectNewVersion: (id: string | null) => void;
  setSelectedDiffIndex: (idx: number | null) => void;
  computeDiff: () => void;
  getVersionById: (id: string) => VersionSnapshot | undefined;

  /** 从对白树管理页保存当前章节的节点快照为热修草稿版本 */
  saveHotfixDraftFromNodes: (
    name: string,
    description: string,
    chapterId: string,
    chapterNodes: DialogNode[]
  ) => string;

  /** 把指定版本中某节点的改动回滚到旧版对应节点 */
  rollbackNodeDiff: (nodeId: string) => void;

  // ========== 回滚计划 ==========
  toggleRollbackItem: (nodeId: string, field: string) => void;
  clearRollbackPlan: () => void;
  selectAllRollback: (severityFilter?: ('high' | 'critical')[]) => void;
  executeRollbackPlan: () => string[];
  saveRollbackPlan: (name: string, note?: string) => string;
  isInRollbackPlan: (nodeId: string, field: string) => boolean;

  // ========== 版本状态流转 ==========
  updateVersionStatus: (versionId: string, status: VersionStatus, note?: string) => void;
  promoteDraftToPending: (versionId: string) => void;
  publishVersion: (versionId: string) => void;

  // ========== 关联待办 ==========
  linkTodoToVersion: (versionId: string, todoId: string) => void;

  // ========== 操作日志 ==========
  addAuditLog: (versionId: string, action: AuditAction, note?: string, relatedTodoId?: string) => void;

  // ========== 按字段回滚 ==========
  rollbackByFields: (nodeId: string, fields: string[]) => void;
  executeRollbackPlanByField: () => { nodeIds: string[]; fields: string[] };

  // ========== 版本审查 ==========
  getVersionReviewDiff: (versionId: string, baselineId?: string) => DiffReport | null;
  setBaselineForVersion: (versionId: string, baselineId: string) => void;
  getFieldRollbackPreview: () => Array<{ nodeId: string; field: string; oldValue: any; newValue: any }>;
}

export const useDiffStore = create<DiffState>()(
  persist(
    (set, get) => ({
      versions: mockVersions,
      oldVersionId: 'ver-001',
      newVersionId: 'ver-002',
      diffReport: null,
      selectedDiffIndex: null,
      compareStatus: 'ok',
      rollbackDiffKeys: [],
      rollbackPlans: [],

      selectOldVersion: (id) => {
        set({ oldVersionId: id, selectedDiffIndex: null, rollbackDiffKeys: [] });
        get().computeDiff();
      },
      selectNewVersion: (id) => {
        set({ newVersionId: id, selectedDiffIndex: null, rollbackDiffKeys: [] });
        get().computeDiff();
      },
      setSelectedDiffIndex: (idx) => set({ selectedDiffIndex: idx }),

      getVersionById: (id) => get().versions.find((v) => v.id === id),

      computeDiff: () => {
        const { oldVersionId, newVersionId, versions } = get();
        if (!oldVersionId && !newVersionId) {
          set({ diffReport: null, compareStatus: 'missing-both' });
          return;
        }
        if (!oldVersionId) {
          set({ diffReport: null, compareStatus: 'missing-old' });
          return;
        }
        if (!newVersionId) {
          set({ diffReport: null, compareStatus: 'missing-new' });
          return;
        }
        const oldV = versions.find((v) => v.id === oldVersionId);
        const newV = versions.find((v) => v.id === newVersionId);
        if (!oldV || !newV) {
          set({ diffReport: null, compareStatus: oldV ? 'missing-new' : 'missing-old' });
          return;
        }
        if (oldV.id === newV.id) {
          set({ diffReport: null, compareStatus: 'same-version' });
          return;
        }
        const report = buildDiffReport(oldV, newV);
        set({ diffReport: report, compareStatus: 'ok' });
      },

      saveHotfixDraftFromNodes: (name, description, chapterId, chapterNodes) => {
        const newId = `ver-${Date.now()}`;
        const stamp = new Date();
        const verCode = `draft-${stamp.getFullYear()}${String(stamp.getMonth() + 1).padStart(2, '0')}${String(stamp.getDate()).padStart(2, '0')}-${String(stamp.getHours()).padStart(2, '0')}${String(stamp.getMinutes()).padStart(2, '0')}`;
        // 自动找该章节最新已发布版本作为基线
        const chapterPublished = get()
          .versions.filter((v) => v.chapterId === chapterId && v.status === 'published')
          .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
        const baseline = chapterPublished[0];
        const newVersion: VersionSnapshot = {
          id: newId,
          name,
          versionCode: verCode,
          status: 'draft',
          createdAt: stamp.toLocaleString('zh-CN'),
          createdBy: '当前用户',
          chapterId,
          baselineVersionId: baseline?.id,
          nodes: JSON.parse(JSON.stringify(chapterNodes)),
          tags: ['草稿', '热修'],
          description,
          relatedTodoIds: [],
          auditLogs: [],
        };
        set((s) => ({ versions: [...s.versions, newVersion] }));
        // 记录创建草稿操作日志
        get().addAuditLog(newId, 'create_draft', description);
        return newId;
      },

      rollbackNodeDiff: (nodeId) => {
        const { diffReport, versions, newVersionId } = get();
        if (!diffReport || !newVersionId) return;
        const oldNode = diffReport.oldVersion.nodes.find((n) => n.id === nodeId);
        if (!oldNode) return;
        set((s) => ({
          versions: s.versions.map((v) =>
            v.id === newVersionId
              ? {
                  ...v,
                  nodes: v.nodes.map((n) =>
                    n.id === nodeId ? JSON.parse(JSON.stringify(oldNode)) : n
                  ),
                }
              : v
          ),
        }));
        const freshVersions = get().versions;
        const oldV = freshVersions.find((v) => v.id === diffReport.oldVersion.id);
        const newV = freshVersions.find((v) => v.id === newVersionId);
        if (oldV && newV) {
          set({ diffReport: buildDiffReport(oldV, newV) });
        }
      },

      // ========== 回滚计划 ==========
      isInRollbackPlan: (nodeId, field) =>
        get().rollbackDiffKeys.includes(`${nodeId}|${field}`),

      toggleRollbackItem: (nodeId, field) => {
        const key = `${nodeId}|${field}`;
        set((s) => ({
          rollbackDiffKeys: s.rollbackDiffKeys.includes(key)
            ? s.rollbackDiffKeys.filter((k) => k !== key)
            : [...s.rollbackDiffKeys, key],
        }));
      },

      clearRollbackPlan: () => set({ rollbackDiffKeys: [] }),

      selectAllRollback: (severityFilter) => {
        const { diffReport } = get();
        if (!diffReport) return;
        let target = diffReport.nodeDiffs;
        if (severityFilter && severityFilter.length > 0) {
          target = target.filter((d) => severityFilter.includes(d.severity as any));
        }
        set({ rollbackDiffKeys: target.map((d) => `${d.nodeId}|${d.field}`) });
      },

      executeRollbackPlan: () => {
        const { diffReport, versions, newVersionId, rollbackDiffKeys } = get();
        if (!diffReport || !newVersionId || rollbackDiffKeys.length === 0) return [];
        const nodeIds = new Set(rollbackDiffKeys.map((k) => k.split('|')[0]));
        const oldNodes = diffReport.oldVersion.nodes;
        const oldMap = new Map(oldNodes.map((n) => [n.id, n]));

        set((s) => ({
          versions: s.versions.map((v) =>
            v.id === newVersionId
              ? {
                  ...v,
                  nodes: v.nodes.map((n) =>
                    nodeIds.has(n.id) && oldMap.has(n.id)
                      ? JSON.parse(JSON.stringify(oldMap.get(n.id)))
                      : n
                  ),
                }
              : v
          ),
          rollbackDiffKeys: [],
        }));

        const freshVersions = get().versions;
        const oldV = freshVersions.find((v) => v.id === diffReport.oldVersion.id);
        const newV = freshVersions.find((v) => v.id === newVersionId);
        if (oldV && newV) {
          set({ diffReport: buildDiffReport(oldV, newV) });
        }
        return Array.from(nodeIds);
      },

      saveRollbackPlan: (name, note) => {
        const { oldVersionId, newVersionId, diffReport, rollbackDiffKeys } = get();
        const id = `rbp-${Date.now()}`;
        const plan: RollbackPlan = {
          id,
          name,
          oldVersionId: oldVersionId ?? '',
          newVersionId: newVersionId ?? '',
          chapterId: diffReport?.chapterId ?? '',
          diffKeys: [...rollbackDiffKeys],
          createdAt: new Date().toLocaleString('zh-CN'),
          note,
        };
        set((s) => ({ rollbackPlans: [plan, ...s.rollbackPlans] }));
        return id;
      },

      // ========== 版本状态流转 ==========
      updateVersionStatus: (versionId, status, note) => {
        const version = get().getVersionById(versionId);
        set((s) => ({
          versions: s.versions.map((v) =>
            v.id === versionId
              ? {
                  ...v,
                  status,
                  reviewNote: note ?? v.reviewNote,
                  publishTime:
                    status === 'published'
                      ? new Date().toLocaleString('zh-CN')
                      : v.publishTime,
                }
              : v
          ),
        }));
        // 根据状态变化记录不同审计日志
        if (status === 'pending-review') {
          get().addAuditLog(versionId, 'submit_review', note);
        } else if (status === 'published') {
          get().addAuditLog(versionId, 'approve_publish', note);
        } else if (status === 'draft' && version?.status === 'pending-review') {
          get().addAuditLog(versionId, 'reject_review', note);
        } else if (status === 'archived') {
          get().addAuditLog(versionId, 'archive', note);
        } else if (status === 'draft' && version?.status === 'archived') {
          get().addAuditLog(versionId, 'unarchive', note);
        }
      },

      promoteDraftToPending: (versionId) => {
        get().updateVersionStatus(versionId, 'pending-review', '提交审核');
      },

      publishVersion: (versionId) => {
        get().updateVersionStatus(versionId, 'published', '审核通过，已发布');
      },

      // ========== 关联待办 ==========
      linkTodoToVersion: (versionId, todoId) =>
        set((s) => ({
          versions: s.versions.map((v) =>
            v.id === versionId
              ? {
                  ...v,
                  relatedTodoIds: Array.from(
                    new Set([...(v.relatedTodoIds ?? []), todoId])
                  ),
                }
              : v
          ),
        })),

      // ========== 操作日志 ==========
      addAuditLog: (versionId, action, note, relatedTodoId) => {
        const log: VersionAuditLog = {
          id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          versionId,
          action,
          operator: '当前用户',
          timestamp: new Date().toLocaleString('zh-CN'),
          note,
          relatedTodoId,
        };
        set((s) => ({
          versions: s.versions.map((v) =>
            v.id === versionId
              ? {
                  ...v,
                  auditLogs: [...(v.auditLogs ?? []), log],
                }
              : v
          ),
        }));
      },

      // ========== 按字段回滚 ==========
      rollbackByFields: (nodeId, fields) => {
        const { diffReport, versions, newVersionId } = get();
        if (!diffReport || !newVersionId) return;
        const oldNode = diffReport.oldVersion.nodes.find((n) => n.id === nodeId);
        if (!oldNode) return;

        set((s) => ({
          versions: s.versions.map((v) =>
            v.id === newVersionId
              ? {
                  ...v,
                  nodes: v.nodes.map((n) => {
                    if (n.id !== nodeId) return n;
                    const patch: any = {};
                    fields.forEach((field) => {
                      if (field === 'emotion') {
                        patch.emotion = JSON.parse(JSON.stringify(oldNode.emotion));
                      } else if (field === 'choices') {
                        patch.choices = JSON.parse(JSON.stringify(oldNode.choices ?? []));
                      } else if (field === 'visibleInfo') {
                        patch.visibleInfo = [...oldNode.visibleInfo];
                      } else if (field in oldNode) {
                        (patch as any)[field] = (oldNode as any)[field];
                      }
                    });
                    return { ...n, ...patch };
                  }),
                }
              : v
          ),
        }));

        const freshVersions = get().versions;
        const oldV = freshVersions.find((v) => v.id === diffReport.oldVersion.id);
        const newV = freshVersions.find((v) => v.id === newVersionId);
        if (oldV && newV) {
          set({ diffReport: buildDiffReport(oldV, newV) });
        }
      },

      executeRollbackPlanByField: () => {
        const { diffReport, rollbackDiffKeys, newVersionId } = get();
        if (!diffReport || !newVersionId || rollbackDiffKeys.length === 0) {
          return { nodeIds: [], fields: [] };
        }

        const fieldMap = new Map<string, string[]>();
        rollbackDiffKeys.forEach((key) => {
          const [nodeId, field] = key.split('|');
          const existing = fieldMap.get(nodeId) ?? [];
          if (!existing.includes(field)) {
            existing.push(field);
            fieldMap.set(nodeId, existing);
          }
        });

        const oldNodes = diffReport.oldVersion.nodes;
        const oldMap = new Map(oldNodes.map((n) => [n.id, n]));

        set((s) => ({
          versions: s.versions.map((v) =>
            v.id === newVersionId
              ? {
                  ...v,
                  nodes: v.nodes.map((n) => {
                    const fields = fieldMap.get(n.id);
                    if (!fields || !oldMap.has(n.id)) return n;
                    const oldNode = oldMap.get(n.id)!;
                    const patch: any = {};
                    fields.forEach((field) => {
                      if (field === '__added__') return;
                      if (field === '__removed__') return;
                      if (field === 'emotion') {
                        patch.emotion = JSON.parse(JSON.stringify(oldNode.emotion));
                      } else if (field === 'choices') {
                        patch.choices = JSON.parse(JSON.stringify(oldNode.choices ?? []));
                      } else if (field === 'visibleInfo') {
                        patch.visibleInfo = [...oldNode.visibleInfo];
                      } else if (field in oldNode) {
                        (patch as any)[field] = (oldNode as any)[field];
                      }
                    });
                    return { ...n, ...patch };
                  }),
                }
              : v
          ),
          rollbackDiffKeys: [],
        }));

        get().addAuditLog(
          newVersionId,
          'rollback_executed',
          `回滚 ${rollbackDiffKeys.length} 项变更`
        );

        const freshVersions = get().versions;
        const oldV = freshVersions.find((v) => v.id === diffReport.oldVersion.id);
        const newV = freshVersions.find((v) => v.id === newVersionId);
        if (oldV && newV) {
          set({ diffReport: buildDiffReport(oldV, newV) });
        }

        return {
          nodeIds: Array.from(fieldMap.keys()),
          fields: rollbackDiffKeys,
        };
      },

      // ========== 版本审查 ==========
      getVersionReviewDiff: (versionId, baselineId) => {
        const version = get().getVersionById(versionId);
        if (!version) return null;
        const bid = baselineId ?? version.baselineVersionId;
        if (!bid) return null;
        const baseline = get().getVersionById(bid);
        if (!baseline) return null;
        return buildDiffReport(baseline, version);
      },

      setBaselineForVersion: (versionId, baselineId) =>
        set((s) => ({
          versions: s.versions.map((v) =>
            v.id === versionId ? { ...v, baselineVersionId: baselineId } : v
          ),
        })),

      getFieldRollbackPreview: () => {
        const { diffReport, rollbackDiffKeys } = get();
        if (!diffReport) return [];
        return rollbackDiffKeys
          .map((key) => {
            const [nodeId, field] = key.split('|');
            const diff = diffReport.nodeDiffs.find(
              (d) => d.nodeId === nodeId && d.field === field
            );
            if (!diff) return null;
            return {
              nodeId,
              field,
              oldValue: diff.oldValue,
              newValue: diff.newValue,
            };
          })
          .filter(Boolean) as any;
      },
    }),
    {
      name: 'diff-storage',
      partialize: (s) => ({
        versions: s.versions,
        oldVersionId: s.oldVersionId,
        newVersionId: s.newVersionId,
        rollbackDiffKeys: s.rollbackDiffKeys,
        rollbackPlans: s.rollbackPlans,
      }),
    }
  )
);

export function calcEmotionDelta(
  a: EmotionProfile,
  b: EmotionProfile
): EmotionProfile {
  return {
    fear: b.fear - a.fear,
    tension: b.tension - a.tension,
    trust: b.trust - a.trust,
    hope: b.hope - a.hope,
  };
}
