import type { VersionSnapshot, NodeDiff, DiffReport } from '../types';
import { nodes } from './nodes';

const ch004Nodes = Object.values(nodes).filter(n => n.chapterId === 'ch-004');

const oldNodes = ch004Nodes.map(n => {
  if (n.id === 'n-002' && n.choices) {
    return {
      ...n,
      text: '我该怎么办？',
      emotion: { fear: 60, tension: 65, trust: -10, hope: 45 },
      choices: n.choices.map(c => {
        if (c.id === 'c-003') {
          return { ...c, label: '（转身离开）', reaction: '身后传来冷笑声。' };
        }
        return c;
      }),
    };
  }
  if (n.id === 'n-005' && n.choices) {
    return {
      ...n,
      visibleInfo: ['铁门', '红色光源'],
      emotion: { fear: 70, tension: 75, trust: -10, hope: 40 },
    };
  }
  if (n.id === 'n-007') {
    return {
      ...n,
      text: '（本章完）地下室的灯熄灭了。',
      emotion: { fear: 85, tension: 85, trust: -25, hope: 25 },
      visibleInfo: ['结尾'],
    };
  }
  return { ...n };
});

export const versions: VersionSnapshot[] = [
  {
    id: 'ver-001',
    name: 'v2.3.1 正式发布版',
    versionCode: '2.3.1',
    status: 'published',
    createdAt: '2026-06-10 12:00',
    createdBy: '主策-林夜',
    chapterId: 'ch-004',
    nodes: oldNodes,
    tags: ['正式版', '已发布'],
    description: '第四章正式发布版本，经过全量QA测试。',
    publishTime: '2026-06-10 18:00',
    relatedTodoIds: [],
  },
  {
    id: 'ver-002',
    name: 'v2.4.0 优化版',
    versionCode: '2.4.0-beta',
    status: 'pending-review',
    createdAt: '2026-06-15 10:30',
    createdBy: '叙事-墨白',
    chapterId: 'ch-004',
    nodes: ch004Nodes.map(n => ({ ...n })),
    tags: ['热修', '待审核'],
    description: '针对社区反馈优化选项文案和结局反转。',
    relatedTodoIds: [],
  },
  {
    id: 'ver-003',
    name: 'v2.3.1-mirror',
    versionCode: '2.3.1-mirror',
    status: 'archived',
    createdAt: '2026-06-12 16:00',
    createdBy: '主策-林夜',
    chapterId: 'ch-002',
    nodes: Object.values(nodes).filter(n => n.chapterId === 'ch-002'),
    tags: ['历史版本'],
    description: '第二章存档版本。',
  },
];

export const sampleDiffs: NodeDiff[] = [
  {
    nodeId: 'n-002',
    diffType: 'text',
    severity: 'medium',
    field: 'text',
    oldValue: '我该怎么办？',
    newValue: '我该怎么回答？',
    description: '抉择点标题修改，更聚焦于"回应"而非泛泛的"怎么办"。',
  },
  {
    nodeId: 'n-002',
    diffType: 'emotion',
    severity: 'medium',
    field: 'emotion',
    oldValue: { fear: 60, tension: 65, trust: -10, hope: 45 },
    newValue: { fear: 70, tension: 75, trust: -15, hope: 35 },
    description: '情绪强度整体上调，突出高压氛围。',
  },
  {
    nodeId: 'n-002',
    diffType: 'choice',
    severity: 'high',
    field: 'choices[2]',
    oldValue: { label: '（转身离开）', reaction: '身后传来冷笑声。' },
    newValue: { label: '（沉默不语，转身就走）', reaction: '脚步声在身后响起，不紧不慢。' },
    suspenseRisk: true,
    description: '逃跑选项文案扩展，反应从"冷笑"改为"脚步声"，悬疑感增强。',
  },
  {
    nodeId: 'n-005',
    diffType: 'visible_info',
    severity: 'medium',
    field: 'visibleInfo',
    oldValue: ['铁门', '红色光源'],
    newValue: ['铁门后有未知空间', '光源异常'],
    description: '可见信息描述更具体，给玩家更多暗示。',
  },
  {
    nodeId: 'n-005',
    diffType: 'emotion',
    severity: 'high',
    field: 'emotion',
    oldValue: { fear: 70, tension: 75, trust: -10, hope: 40 },
    newValue: { fear: 80, tension: 85, trust: -20, hope: 30 },
    suspenseRisk: true,
    description: '希望值大幅下降，可能让玩家提前感到绝望，建议确认是否影响后续章节情绪曲线。',
  },
  {
    nodeId: 'n-007',
    diffType: 'text',
    severity: 'critical',
    field: 'text',
    oldValue: '（本章完）地下室的灯熄灭了。',
    newValue: '（本章完）地下室的灯，从来就不是给人照明用的。——它是给"它们"指路的。',
    suspenseRisk: true,
    description: '结尾新增反转信息，可能泄露下一章"它们"的设定，强烈建议与主策确认是否提前暴露伏笔。',
  },
  {
    nodeId: 'n-007',
    diffType: 'emotion',
    severity: 'medium',
    field: 'emotion',
    oldValue: { fear: 85, tension: 85, trust: -25, hope: 25 },
    newValue: { fear: 92, tension: 90, trust: -30, hope: 20 },
    description: '终局情绪上调，余味更重。',
  },
  {
    nodeId: 'n-007',
    diffType: 'visible_info',
    severity: 'critical',
    field: 'visibleInfo',
    oldValue: ['结尾'],
    newValue: ['结尾反转', '灯的真实用途', '为下一章留伏笔'],
    suspenseRisk: true,
    description: '新增"下一章伏笔"可见信息标签，需确认对应下一章已准备好回收此伏笔。',
  },
];

export const diffReport: DiffReport = {
  chapterId: 'ch-004',
  oldVersion: versions[0],
  newVersion: versions[1],
  nodeDiffs: sampleDiffs,
  summary: {
    totalChanges: 8,
    highRiskCount: 4,
    emotionDelta: {
      fear: 11,
      tension: 9,
      trust: -7,
      hope: -13,
    },
    suspenseWarnings: [
      '结尾（n-007）新增"它们"设定，可能泄露后续章节伏笔，请主策确认。',
      '铁门场景（n-005）希望值下降10点，是否过早造成绝望感堆积？',
      '"灯的真实用途"可见信息与DLC-001第3节存在设定关联，需同步验证DLC内容。',
    ],
  },
};
