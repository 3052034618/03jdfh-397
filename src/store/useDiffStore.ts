import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  VersionSnapshot,
  DiffReport,
  NodeDiff,
  EmotionProfile,
  DialogNode,
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

  selectOldVersion: (id: string | null) => void;
  selectNewVersion: (id: string | null) => void;
  setSelectedDiffIndex: (idx: number | null) => void;
  computeDiff: () => void;

  /** 从对白树管理页保存当前章节的节点快照为热修草稿版本 */
  saveHotfixDraftFromNodes: (
    name: string,
    description: string,
    chapterId: string,
    chapterNodes: DialogNode[]
  ) => string;

  /** 把指定版本中某节点的改动回滚到旧版对应节点 */
  rollbackNodeDiff: (nodeId: string) => void;
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

      selectOldVersion: (id) => {
        set({ oldVersionId: id, selectedDiffIndex: null });
        get().computeDiff();
      },
      selectNewVersion: (id) => {
        set({ newVersionId: id, selectedDiffIndex: null });
        get().computeDiff();
      },
      setSelectedDiffIndex: (idx) => set({ selectedDiffIndex: idx }),

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
        const newVersion: VersionSnapshot = {
          id: newId,
          name,
          createdAt: new Date().toLocaleString('zh-CN'),
          createdBy: '当前用户',
          chapterId,
          nodes: JSON.parse(JSON.stringify(chapterNodes)),
          tags: ['草稿', '热修'],
          description,
        };
        set((s) => ({ versions: [...s.versions, newVersion] }));
        return newId;
      },

      rollbackNodeDiff: (nodeId) => {
        const { diffReport, versions, selectNewVersion, newVersionId } = get();
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
        // 重新触发差异计算
        const freshVersions = get().versions;
        const oldV = freshVersions.find((v) => v.id === diffReport.oldVersion.id);
        const newV = freshVersions.find((v) => v.id === newVersionId);
        if (oldV && newV) {
          set({ diffReport: buildDiffReport(oldV, newV) });
        }
      },
    }),
    {
      name: 'diff-storage',
      partialize: (s) => ({
        versions: s.versions,
        oldVersionId: s.oldVersionId,
        newVersionId: s.newVersionId,
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
