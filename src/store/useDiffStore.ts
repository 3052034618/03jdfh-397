import { create } from 'zustand';
import type { VersionSnapshot, DiffReport, EmotionProfile } from '../types';
import { versions, diffReport } from '../data/versions';

interface DiffState {
  versions: VersionSnapshot[];
  oldVersionId: string | null;
  newVersionId: string | null;
  diffReport: DiffReport | null;
  selectedDiffIndex: number | null;

  selectOldVersion: (id: string | null) => void;
  selectNewVersion: (id: string | null) => void;
  setSelectedDiffIndex: (idx: number | null) => void;
  computeDiff: () => void;
  saveAsVersion: (name: string, desc: string, chapterId: string) => string;
}

export const useDiffStore = create<DiffState>((set, get) => ({
  versions,
  oldVersionId: 'ver-001',
  newVersionId: 'ver-002',
  diffReport,
  selectedDiffIndex: null,

  selectOldVersion: (id) => set({ oldVersionId: id }),
  selectNewVersion: (id) => set({ newVersionId: id }),
  setSelectedDiffIndex: (idx) => set({ selectedDiffIndex: idx }),
  computeDiff: () => {
    const state = get();
    if (!state.oldVersionId || !state.newVersionId) {
      set({ diffReport: null });
      return;
    }
    set({ diffReport });
  },
  saveAsVersion: (name, desc, chapterId) => {
    const newId = `ver-${Date.now()}`;
    const newVersion: VersionSnapshot = {
      id: newId,
      name,
      createdAt: new Date().toLocaleString('zh-CN'),
      createdBy: '当前用户',
      chapterId,
      nodes: Object.values(versions[0]?.nodes ?? []),
      tags: ['草稿'],
      description: desc,
    };
    set((s) => ({ versions: [...s.versions, newVersion] }));
    return newId;
  },
}));

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
