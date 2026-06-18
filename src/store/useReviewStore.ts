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
  linkTodoToNode: (todoId: string, nodeId: string) => void;
  addTrace: (link: Omit<TraceLink, 'id' | 'timestamp'>) => void;
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
        const relatedFb = get().feedbacks.find((f) => f.id === feedbackIds[0]);
        if (relatedFb) {
          get().addTrace({ feedbackId: relatedFb.id, todoId: id, stage: 'todo' });
        }
        return newTodo;
      },

      updateTodoStatus: (id, status) =>
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
        })),

      linkTodoToNode: (todoId, nodeId) =>
        set((s) => ({
          todos: s.todos.map((t) =>
            t.id === todoId ? { ...t, relatedNodeId: nodeId } : t
          ),
        })),

      addTrace: (link) => {
        const newLink: TraceLink = {
          ...link,
          id: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toLocaleString('zh-CN'),
        };
        set((s) => ({ traces: [...s.traces, newLink] }));
      },
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
