import { ChevronDown, Calendar, User, Tag, GitCompare, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useDiffStore, type VersionCompareStatus } from '../../store/useDiffStore';
import type { VersionSnapshot } from '../../types';

const statusConfig: Record<VersionCompareStatus, { label: string; icon: typeof AlertOctagon; tone: string; } | null> = {
  ok: null,
  'same-version': {
    label: '旧版与新版相同，请选择不同版本进行对比',
    icon: AlertOctagon,
    tone: 'bg-amber-900/40 border-amber-700/50 text-amber-400',
  },
  'missing-old': {
    label: '请先选择旧版本（基线）',
    icon: AlertOctagon,
    tone: 'bg-blood-900/40 border-blood-700/60 text-blood-300',
  },
  'missing-new': {
    label: '请先选择新版本（待审）',
    icon: AlertOctagon,
    tone: 'bg-blood-900/40 border-blood-700/60 text-blood-300',
  },
  'missing-both': {
    label: '请选择旧版本和新版本后再进行对比',
    icon: AlertOctagon,
    tone: 'bg-blood-900/40 border-blood-700/60 text-blood-300',
  },
};

export function VersionSelector() {
  const {
    versions,
    oldVersionId,
    newVersionId,
    compareStatus,
    selectOldVersion,
    selectNewVersion,
    computeDiff,
  } = useDiffStore();

  const oldV = versions.find((v) => v.id === oldVersionId);
  const newV = versions.find((v) => v.id === newVersionId);
  const status = statusConfig[compareStatus];

  return (
    <div className="border-b border-abyss-700/60 bg-abyss-850/60 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-blood-400" />
          <h2 className="font-serif font-semibold text-ghost-500 tracking-wider">
            热修版本对比
          </h2>
        </div>
        <span className="ml-auto text-[10px] text-ghost-900 tracking-widest uppercase">
          {versions.length} 个历史版本
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
        <VersionDropdown
          label="旧版本（基线）"
          versions={versions}
          value={oldVersionId}
          onChange={selectOldVersion}
          version={oldV}
          accent="danger"
        />
        <div className="flex flex-col items-center pb-1">
          <div className={clsx(
            'w-10 h-10 rounded-full border flex items-center justify-center transition-all',
            compareStatus === 'ok'
              ? 'bg-moss-800/40 border-moss-700/60'
              : 'bg-blood-800/40 border-blood-700/50'
          )}>
            {compareStatus === 'ok' ? (
              <CheckCircle2 className="w-5 h-5 text-moss-400" />
            ) : (
              <span className="text-blood-400 text-sm font-bold">→</span>
            )}
          </div>
        </div>
        <VersionDropdown
          label="新版本（待审）"
          versions={versions}
          value={newVersionId}
          onChange={selectNewVersion}
          version={newV}
          accent="safe"
        />
      </div>

      {status && (
        <div className={clsx('mt-3 flex items-center gap-2 px-3 py-2 rounded-sm border text-[11px]', status.tone)}>
          <status.icon className="w-4 h-4 shrink-0 animate-pulse-slow" />
          <span className="flex-1">{status.label}</span>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-4">
          {oldV && (
            <div className="flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-blood-600" />
              <span className="text-ghost-900">旧版节点数:</span>
              <span className="text-blood-400 font-mono font-semibold">{oldV.nodes.length}</span>
            </div>
          )}
          {newV && (
            <div className="flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-moss-600" />
              <span className="text-ghost-900">新版节点数:</span>
              <span className="text-moss-400 font-mono font-semibold">{newV.nodes.length}</span>
            </div>
          )}
          {oldV && newV && (
            <div className="flex items-center gap-1.5">
              <span className="text-ghost-900">章节ID:</span>
              <span className="text-ghost-700 font-mono">{oldV.chapterId}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => computeDiff()}
          disabled={compareStatus !== 'ok'}
          className="gothic-btn-primary !py-1.5 !px-4 !text-xs disabled:opacity-40 disabled:cursor-not-allowed"
        >
          生成差异报告
        </button>
      </div>
    </div>
  );
}

interface DropdownProps {
  label: string;
  versions: VersionSnapshot[];
  value: string | null;
  onChange: (id: string | null) => void;
  version: VersionSnapshot | undefined;
  accent: 'danger' | 'safe';
}

function VersionDropdown({ label, versions, value, onChange, version, accent }: DropdownProps) {
  return (
    <div className="relative">
      <label className="gothic-label mb-1.5">{label}</label>
      <div className="relative group">
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          className={clsx(
            'gothic-input !py-2 pr-8 appearance-none cursor-pointer text-xs',
            accent === 'danger'
              ? 'border-blood-700/40 focus:border-blood-600/60'
              : 'border-moss-700/40 focus:border-moss-600/60'
          )}
        >
          <option value="" className="bg-abyss-900">选择版本…</option>
          {versions.map((v) => (
            <option key={v.id} value={v.id} className="bg-abyss-900">
              {v.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ghost-900 pointer-events-none mt-1.5" />
      </div>
      {version && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-ghost-900 leading-relaxed">
          <span className="flex items-center gap-1">
            <User className="w-2.5 h-2.5" /> {version.createdBy}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" /> {version.createdAt}
          </span>
          <span className="text-ghost-900 font-mono">({version.id})</span>
          <div className="flex gap-1 mt-1 w-full">
            {version.tags.map((t) => (
              <span
                key={t}
                className={clsx(
                  'px-1.5 py-0.5 rounded-sm border',
                  accent === 'danger'
                    ? 'bg-blood-900/40 border-blood-800/60 text-blood-300'
                    : 'bg-moss-800/40 border-moss-700/60 text-moss-500'
                )}
              >
                #{t}
              </span>
            ))}
          </div>
          {version.description && (
            <p className="w-full mt-1 text-[9px] text-ghost-900 leading-relaxed italic">
              {version.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
