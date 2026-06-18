export type NodeType = 'dialog' | 'choice' | 'ending' | 'condition';

export type ChapterType = 'main' | 'side' | 'event' | 'dlc';

export interface EmotionProfile {
  fear: number;
  tension: number;
  trust: number;
  hope: number;
}

export interface DialogChoice {
  id: string;
  label: string;
  nextNodeId: string;
  weight?: number;
  reaction?: string;
}

export interface DialogNode {
  id: string;
  type: NodeType;
  chapterId: string;
  speaker: string;
  text: string;
  position: { x: number; y: number };
  emotion: EmotionProfile;
  visibleInfo: string[];
  conditions?: string;
  choices?: DialogChoice[];
  nextNodeId?: string;
  controversy?: number;
  tags: string[];
}

export interface Chapter {
  id: string;
  title: string;
  type: ChapterType;
  order: number;
  nodeCount: number;
  controversy: number;
  lastUpdated: string;
  version: string;
}

export type FeedbackSource = 'steam' | 'taptap' | 'weibo' | 'discord' | 'official_forum';

export type Sentiment = 'negative' | 'neutral' | 'positive';

export interface PlayerFeedback {
  id: string;
  content: string;
  source: FeedbackSource;
  author: string;
  createdAt: string;
  mentionCount: number;
  heat: number;
  keywords: string[];
  relatedNodeId?: string;
  sentiment: Sentiment;
}

export type TodoPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TodoStatus = 'pending' | 'processing' | 'resolved' | 'rejected';

export interface ReviewTodo {
  id: string;
  title: string;
  description: string;
  priority: TodoPriority;
  status: TodoStatus;
  feedbackIds: string[];
  relatedNodeId?: string;
  assignee: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedVersion?: string;
}

export type TraceStage = 'feedback' | 'todo' | 'edit' | 'release';

export type VersionStatus = 'draft' | 'pending-review' | 'published' | 'archived';

export interface TraceLink {
  id: string;
  feedbackId: string;
  todoId?: string;
  nodeId?: string;
  versionId?: string;
  versionName?: string;
  versionCode?: string;
  stage: TraceStage;
  timestamp: string;
}

export interface VersionSnapshot {
  id: string;
  name: string;
  versionCode: string;
  status: VersionStatus;
  createdAt: string;
  createdBy: string;
  chapterId: string;
  nodes: DialogNode[];
  tags: string[];
  description: string;
  publishTime?: string;
  reviewNote?: string;
  relatedTodoIds?: string[];
}

export type DiffType = 'text' | 'emotion' | 'choice' | 'condition' | 'visible_info';
export type DiffSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface NodeDiff {
  nodeId: string;
  diffType: DiffType;
  severity: DiffSeverity;
  field: string;
  oldValue: any;
  newValue: any;
  suspenseRisk?: boolean;
  description: string;
}

export interface DiffReport {
  chapterId: string;
  oldVersion: VersionSnapshot;
  newVersion: VersionSnapshot;
  nodeDiffs: NodeDiff[];
  summary: {
    totalChanges: number;
    highRiskCount: number;
    emotionDelta: EmotionProfile;
    suspenseWarnings: string[];
  };
}

export interface RollbackPlan {
  id: string;
  name: string;
  oldVersionId: string;
  newVersionId: string;
  chapterId: string;
  diffKeys: string[];
  createdAt: string;
  note?: string;
}
