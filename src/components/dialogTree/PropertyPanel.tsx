import { useState } from 'react';
import { ChevronDown, ChevronRight, Save, AlertTriangle, User, Type, Sliders, Tag, Link2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useDialogStore } from '../../store/useDialogStore';
import type { DialogChoice, EmotionProfile } from '../../types';

interface CollapsibleProps {
  title: string;
  icon: typeof Type;
  defaultOpen?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}

function Collapsible({ title, icon: Icon, defaultOpen = true, danger, children }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-abyss-700/50 last:border-b-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          'w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors',
          open ? 'bg-abyss-800/40' : 'hover:bg-abyss-800/30',
          danger ? 'text-blood-400' : 'text-ghost-500'
        )}
      >
        {open ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span className="tracking-wider flex-1 text-left">{title}</span>
      </button>
      {open && <div className="p-3 pt-1 space-y-3">{children}</div>}
    </div>
  );
}

interface EmotionSliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  color: string;
}

function EmotionSlider({ label, value, min = 0, max = 100, onChange, color }: EmotionSliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-ghost-700 tracking-wider">{label}</span>
        <span className="text-[10px] font-mono font-semibold" style={{ color }}>
          {value > 0 ? '+' : ''}
          {value}
        </span>
      </div>
      <div className="relative h-2 bg-abyss-900/80 rounded-full overflow-hidden border border-abyss-700/70">
        <div
          className="absolute inset-y-0 left-0 transition-all duration-200"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}55, ${color})`,
            boxShadow: `0 0 8px ${color}80`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}

export function PropertyPanel() {
  const { selectedNodeId, nodes, updateNode } = useDialogStore();
  const node = selectedNodeId ? nodes[selectedNodeId] : null;

  if (!node) {
    return (
      <div className="w-80 shrink-0 h-full bg-abyss-900/60 border-l border-abyss-700/60 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-4xl opacity-20 mb-3">🕯️</div>
          <p className="text-xs text-ghost-900 font-serif leading-relaxed">
            点击画布中的任意节点
            <br />
            在此处查看和编辑属性
          </p>
        </div>
      </div>
    );
  }

  const patch = (p: Partial<typeof node>) => updateNode(node.id, p);
  const highControversy = (node.controversy ?? 0) >= 70;

  return (
    <div className="w-80 shrink-0 h-full bg-abyss-900/70 border-l border-abyss-700/60 flex flex-col">
      <div className="p-4 border-b border-abyss-700/50 bg-abyss-850/60 relative overflow-hidden">
        {highControversy && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-sm bg-blood-900/60 border border-blood-700/60 text-[9px] text-blood-300 animate-pulse-slow">
            <AlertTriangle className="w-3 h-3" />
            高争议 {node.controversy}
          </div>
        )}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-[10px] text-ghost-900 bg-abyss-700/40 px-1.5 py-0.5 rounded-sm">
            {node.id}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-sm bg-void-800/60 border border-void-700/50 text-ghost-700 uppercase tracking-wider">
            {node.type}
          </span>
        </div>
        <h3 className="font-serif font-semibold text-ghost-500 tracking-wide line-clamp-2 text-sm">
          {node.speaker} · {node.text.slice(0, 30)}
          {node.text.length > 30 ? '…' : ''}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <Collapsible title="角色与对白" icon={Type}>
          <div>
            <label className="gothic-label">
              <User className="inline w-3 h-3 mr-1 -mt-0.5" />
              说话角色
            </label>
            <input
              value={node.speaker}
              onChange={(e) => patch({ speaker: e.target.value })}
              className="gothic-input !py-1.5"
            />
          </div>
          <div>
            <label className="gothic-label">对白文本</label>
            <textarea
              value={node.text}
              onChange={(e) => patch({ text: e.target.value })}
              rows={5}
              className="gothic-input !py-2 resize-none leading-relaxed"
            />
          </div>
        </Collapsible>

        <Collapsible title="情绪数值" icon={Sliders}>
          <EmotionSlider
            label="恐惧强度 Fear"
            value={node.emotion.fear}
            color="#c41e1e"
            onChange={(v) => patch({ emotion: { ...node.emotion, fear: v } })}
          />
          <EmotionSlider
            label="紧张度 Tension"
            value={node.emotion.tension}
            color="#c9a227"
            onChange={(v) => patch({ emotion: { ...node.emotion, tension: v } })}
          />
          <EmotionSlider
            label="信任值 Trust"
            value={node.emotion.trust}
            min={-50}
            max={50}
            color="#3a7ca5"
            onChange={(v) => patch({ emotion: { ...node.emotion, trust: v } })}
          />
          <EmotionSlider
            label="希望值 Hope"
            value={node.emotion.hope}
            color="#5e8a4a"
            onChange={(v) => patch({ emotion: { ...node.emotion, hope: v } })}
          />
        </Collapsible>

        <Collapsible title="玩家可见信息" icon={Tag}>
          <div className="space-y-1.5">
            {node.visibleInfo.map((info, idx) => (
              <div key={idx} className="flex gap-1.5">
                <input
                  value={info}
                  onChange={(e) => {
                    const arr = [...node.visibleInfo];
                    arr[idx] = e.target.value;
                    patch({ visibleInfo: arr });
                  }}
                  className="gothic-input !py-1 !text-xs flex-1"
                />
                <button
                  onClick={() =>
                    patch({ visibleInfo: node.visibleInfo.filter((_, i) => i !== idx) })
                  }
                  className="px-2 text-blood-500 hover:bg-blood-900/40 rounded-sm text-xs border border-transparent hover:border-blood-700/50"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={() => patch({ visibleInfo: [...node.visibleInfo, ''] })}
              className="w-full py-1 text-[11px] text-ghost-700 border border-dashed border-abyss-600/70 rounded-sm hover:border-blood-700/50 hover:text-blood-400 transition-colors"
            >
              ＋ 添加信息点
            </button>
          </div>
        </Collapsible>

        {node.type === 'choice' && node.choices && (
          <Collapsible title="选项配置" icon={Link2} danger>
            <div className="space-y-3">
              {node.choices.map((choice, idx) => (
                <ChoiceEditor
                  key={choice.id}
                  index={idx + 1}
                  choice={choice}
                  onChange={(c) => {
                    const arr = [...(node.choices ?? [])];
                    arr[idx] = c;
                    patch({ choices: arr });
                  }}
                  onDelete={() =>
                    patch({ choices: node.choices?.filter((_, i) => i !== idx) })
                  }
                />
              ))}
              <button
                onClick={() => {
                  const newChoice: DialogChoice = {
                    id: `c-new-${Date.now()}`,
                    label: '新选项',
                    nextNodeId: '',
                    weight: 1,
                  };
                  patch({ choices: [...(node.choices ?? []), newChoice] });
                }}
                className="w-full py-1.5 text-[11px] text-amber-400 border border-dashed border-amber-700/50 rounded-sm hover:bg-amber-900/20 hover:border-amber-500/60 transition-colors"
              >
                ＋ 新增选项
              </button>
            </div>
          </Collapsible>
        )}

        {(node.type === 'condition' || node.conditions) && (
          <Collapsible title="触发条件" icon={AlertTriangle} danger>
            <textarea
              value={node.conditions ?? ''}
              onChange={(e) => patch({ conditions: e.target.value })}
              rows={3}
              className="gothic-input !py-2 font-mono text-[11px] resize-none"
              placeholder="例：inventory.includes('rusty_key') && trust_level >= 30"
            />
            <p className="text-[9px] text-ghost-900 leading-relaxed">
              * 表达式需符合 JavaScript 语法，可访问 inventory / flags / emotion 等上下文
            </p>
          </Collapsible>
        )}

        <Collapsible title="标签与争议度" icon={Tag} defaultOpen={false}>
          <div>
            <label className="gothic-label">标签（逗号分隔）</label>
            <input
              value={node.tags.join(', ')}
              onChange={(e) =>
                patch({ tags: e.target.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean) })
              }
              className="gothic-input !py-1.5 !text-xs"
            />
          </div>
          <div className="flex flex-wrap gap-1 pt-1">
            {node.tags.map((t, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 text-[9px] bg-abyss-700/50 border border-abyss-600/60 text-ghost-700 rounded-sm"
              >
                #{t}
              </span>
            ))}
          </div>
          <div>
            <label className="gothic-label">社区争议度（0-100）</label>
            <input
              type="number"
              min={0}
              max={100}
              value={node.controversy ?? 0}
              onChange={(e) => patch({ controversy: Number(e.target.value) })}
              className="gothic-input !py-1.5 !text-xs"
            />
          </div>
        </Collapsible>
      </div>

      <div className="p-3 border-t border-abyss-700/50 bg-abyss-850/50 flex gap-2">
        <button className="gothic-btn-amber flex-1 flex items-center justify-center gap-1.5 !py-1.5 !text-xs">
          <Save className="w-3 h-3" />
          保存修改
        </button>
        <button className="gothic-btn !py-1.5 !text-xs">草稿</button>
      </div>
    </div>
  );
}

interface ChoiceEditorProps {
  index: number;
  choice: DialogChoice;
  onChange: (c: DialogChoice) => void;
  onDelete?: () => void;
}

function ChoiceEditor({ index, choice, onChange, onDelete }: ChoiceEditorProps) {
  return (
    <div className="gothic-card p-2.5 space-y-2 border-l-2 border-l-amber-600/60">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-serif font-semibold text-amber-400 tracking-wider">
          选项 {index}
        </span>
        {onDelete && (
          <button
            onClick={onDelete}
            className="text-[10px] text-blood-500 hover:bg-blood-900/40 px-1.5 py-0.5 rounded-sm"
          >
            删除
          </button>
        )}
      </div>
      <div>
        <label className="text-[9px] text-ghost-900 block mb-0.5">选项文案</label>
        <input
          value={choice.label}
          onChange={(e) => onChange({ ...choice, label: e.target.value })}
          className="gothic-input !py-1 !text-xs"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] text-ghost-900 block mb-0.5">跳转节点ID</label>
          <input
            value={choice.nextNodeId}
            onChange={(e) => onChange({ ...choice, nextNodeId: e.target.value })}
            className="gothic-input !py-1 !text-xs font-mono"
          />
        </div>
        <div>
          <label className="text-[9px] text-ghost-900 block mb-0.5">隐藏权重</label>
          <input
            type="number"
            step={0.1}
            min={0}
            max={1}
            value={choice.weight ?? 1}
            onChange={(e) => onChange({ ...choice, weight: Number(e.target.value) })}
            className="gothic-input !py-1 !text-xs"
          />
        </div>
      </div>
      <div>
        <label className="text-[9px] text-ghost-900 block mb-0.5">即时反应文本（可选）</label>
        <input
          value={choice.reaction ?? ''}
          onChange={(e) => onChange({ ...choice, reaction: e.target.value })}
          className="gothic-input !py-1 !text-xs"
          placeholder="玩家选择后立即显示的反应…"
        />
      </div>
    </div>
  );
}

export type { EmotionProfile };
