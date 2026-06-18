import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Chapter, DialogNode } from '../types';
import { chapters } from '../data/chapters';
import { nodes as defaultNodes } from '../data/nodes';

interface DialogState {
  chapters: Chapter[];
  nodes: Record<string, DialogNode>;
  currentChapterId: string | null;
  selectedNodeId: string | null;
  viewport: { x: number; y: number; zoom: number };
  searchKeyword: string;
  filterControversy: number | null;

  selectChapter: (id: string | null) => void;
  selectNode: (id: string | null) => void;
  updateNode: (id: string, patch: Partial<DialogNode>) => void;
  setViewport: (vp: { x: number; y: number; zoom: number }) => void;
  setSearchKeyword: (kw: string) => void;
  setFilterControversy: (v: number | null) => void;
  getChapterNodes: (chapterId: string) => DialogNode[];
}

export const useDialogStore = create<DialogState>()(
  persist(
    (set, get) => ({
      chapters,
      nodes: defaultNodes,
      currentChapterId: 'ch-004',
      selectedNodeId: 'n-002',
      viewport: { x: 0, y: 0, zoom: 0.85 },
      searchKeyword: '',
      filterControversy: null,

      selectChapter: (id) => set({ currentChapterId: id, selectedNodeId: null }),
      selectNode: (id) => set({ selectedNodeId: id }),
      updateNode: (id, patch) =>
        set((s) => ({
          nodes: { ...s.nodes, [id]: { ...s.nodes[id], ...patch } },
        })),
      setViewport: (vp) => set({ viewport: vp }),
      setSearchKeyword: (kw) => set({ searchKeyword: kw }),
      setFilterControversy: (v) => set({ filterControversy: v }),
      getChapterNodes: (chapterId) =>
        Object.values(get().nodes).filter((n) => n.chapterId === chapterId),
    }),
    {
      name: 'dialog-tree-storage',
      partialize: (state) => ({
        nodes: state.nodes,
      }),
    }
  )
);
