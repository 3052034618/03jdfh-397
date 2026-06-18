import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  PlayerFeedback,
  ReviewTodo,
  TraceLink,
  TodoPriority,
  TodoStatus,
} from '../types';
import { feedbacks as defaultFeedbacks } from '../data/feedbacks';
import { todos as defaultTodos, traces as defaultTraces } from '../data/todos';
import { useDiffStore } from './useDiffStore';

interface ReviewState {
  feedbacks: PlayerFeedback[];
  todos: ReviewTodo[];
  traces: TraceLink[];
  selectedFeedbackIds: string[];
  filterSource: string | null;
  filterSentiment: string | null;
  sortBy: 'heat' | 'mentionCount' | 'createdAt';

  toggleFeedbackSelection: (id: string) => void;
  clearFeedbackSelection: () => void;
  setFilterSource: (s: string | null) => void;
  setFilterSentiment: (s: string | null) => void;
  setSortBy: (s: 'heat' | 'mentionCount' | 'createdAt') => void;
  createTodoFromFeedback: (
    feedbackIds: string[],
    title: string,
    description: string,
    priority: TodoPriority,
    assignee: string,
    relatedNodeId?: string
  ) => ReviewTodo;
  updateTodoStatus: (id: string, status: TodoStatus) => void;
  resolveTodoWithVersion: (todoId: string, versionId: string) => void;
  linkTodoToNode: (todoId: string, nodeId: string) => void;
  addTrace: (link: Omit<TraceLink, 'id' | 'timestamp'>) => void;
  getTracesByFeedback: (feedbackId: string) => TraceLink[];
  getTracesByTodo: (todoId: string) => TraceLink[];
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      feedbacks: defaultFeedbacks,
      todos: defaultTodos,
      traces: defaultTraces,
      selectedFeedbackIds: [],
      filterSource: null,
      filterSentiment: null,
      sortBy: 'heat',

      toggleFeedbackSelection: (id) =>
        set((s) => ({
          selectedFeedbackIds: s.selectedFeedbackIds.includes(id)
            ? s.selectedFeedbackIds.filter((x) => x !== id)
            : [...s.selectedFeedbackIds, id],
        })),
      clearFeedbackSelection: () => set({ selectedFeedbackIds: [] }),
      setFilterSource: (s) => set({ filterSource: s }),
      setFilterSentiment: (s) => set({ filterSentiment: s }),
      setSortBy: (s) => set({ sortBy: s }),

      createTodoFromFeedback: (
        feedbackIds,
        title,
        description,
        priority,
        assignee,
        relatedNodeId
      ) => {
        const id = `todo-${Date.now()}`;
        const newTodo: ReviewTodo = {
          id,
          title,
          description,
          priority,
          status: 'pending',
          feedbackIds,
          relatedNodeId,
          assignee,
          createdAt: new Date().toLocaleString('zh-CN'),
        };
        set((s) => ({ todos: [newTodo, ...s.todos] }));
        // 给每条反馈都写 todo 阶段 trace
        feedbackIds.forEach((fid) => {
          get().addTrace({ feedbackId: fid, todoId: id, stage: 'todo' });
        });
        return newTodo;
      },

      updateTodoStatus: (id, status) => {
        const todo = get().todos.find((t) => t.id === id);
        set((s) => ({
          todos: s.todos.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status,
                  resolvedAt:
                    status === 'resolved'
                      ? new Date().toLocaleString('zh-CN')
                      : t.resolvedAt,
                }
              : t
          ),
        }));
        if (todo) {
          // 推进到处理中：给每条反馈写 edit 阶段 trace
          if (status === 'processing') {
            todo.feedbackIds.forEach((fid) => {
              get().addTrace({
                feedbackId: fid,
                todoId: todo.id,
                nodeId: todo.relatedNodeId,
                stage: 'edit',
              });
            });
          }
        }
      },

      resolveTodoWithVersion: (todoId, versionId) => {
        const todo = get().todos.find((t) => t.id === todoId);
        const version = useDiffStore.getState().getVersionById(versionId);
        const now = new Date().toLocaleString('zh-CN');

        set((s) => ({
          todos: s.todos.map((t) =>
            t.id === todoId
              ? {
                  ...t,
                  status: 'resolved',
                  resolvedAt: now,
                  resolvedVersion: version?.name ?? versionId,
                }
              : t
          ),
        }));

        // 关联版本到待办
        if (version) {
          useDiffStore.getState().linkTodoToVersion(versionId, todoId);
        }

        // 给每条反馈写 release 阶段 trace，带上版本名/号/时间
        if (todo) {
          todo.feedbackIds.forEach((fid) => {
            get().addTrace({
              feedbackId: fid,
              todoId,
              nodeId: todo.relatedNodeId,
              versionId,
              versionName: version?.name,
              versionCode: version?.versionCode,
              stage: 'release',
            });
          });
        }
      },

      linkTodoToNode: (todoId, nodeId) => {
        const todo = get().todos.find((t) => t.id === todoId);
        set((s) => ({
          todos: s.todos.map((t) =>
            t.id === todoId ? { ...t, relatedNodeId: nodeId } : t
          ),
        }));
        // 关联节点时，如果待办非待办状态，给每条反馈补 edit trace
        if (todo && todo.status !== 'pending') {
          todo.feedbackIds.forEach((fid) => {
            get().addTrace({
              feedbackId: fid,
              todoId,
              nodeId,
              stage: 'edit',
            });
          });
        }
      },

      addTrace: (link) => {
        const newLink: TraceLink = {
          ...link,
          id: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toLocaleString('zh-CN'),
        };
        set((s) => ({ traces: [...s.traces, newLink] }));
      },

      getTracesByFeedback: (feedbackId) =>
        get().traces.filter((t) => t.feedbackId === feedbackId),

      getTracesByTodo: (todoId) =>
        get().traces.filter((t) => t.todoId === todoId),
    }),
    {
      name: 'review-storage',
      partialize: (state) => ({
        todos: state.todos,
        traces: state.traces,
        feedbacks: state.feedbacks,
      }),
    }
  )
);
