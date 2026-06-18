import { ChevronDown, Calendar, User, Tag, GitCompare } from 'lucide-react';
import { clsx } from 'clsx';
import { useDiffStore } from '../../store/useDiffStore';
import type { VersionSnapshot } from '../../types';

export function VersionSelector() {
  const {
    versions,
    oldVersionId,
    newVersionId,
    selectOldVersion,
    selectNewVersion,
  } = useDiffStore();

  const oldV = versions.find((v) => v.id === oldVersionId);
  const newV = versions.find((v) => v.id === newVersionId);

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
          <div className="w-10 h-10 rounded-full bg-blood-800/40 border border-blood-700/50 flex items-center justify-center">
            <span className="text-blood-400 text-sm font-bold">→</span>
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
      <div className="mt-4 flex items-center justify-between text-[10px] text-ghost-900">
        <div className="flex items-center gap-4">
          {oldV && (
          <div className="flex items-center gap-1.5">
          <Tag className="w-3 h-3" />
          节点数: <span className="text-ghost-700 font-mono">{oldV.nodes.length}</span>
          </div>
          )}
          {newV && (
            <div className="flex items-center gap-1.5">
              <Tag className="w-3 h-3" />
              节点数: <span className="text-ghost-700 font-mono">{newV.nodes.length}</span>
            </div>
          )}
        </div>
        <button className="gothic-btn-primary !py-1.5 !px-4 !text-xs">生成差异报告</button>
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
          <option value="" disabled className="bg-abyss-900">选择版本…</option>
          {versions.map((v) => (
            <option key={v.id} className="bg-abyss-900">{v.name}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ghost-900 pointer-events-none mt-1.5" />
      </div>
      {version && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-ghost-900 leading-relaxed">
          <span className="flex items-center gap-1"><User className="w-2.5 h-2.5" /> {version.createdBy}</span>
          <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5" /> {version.createdAt}</span>
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
        </div>
      )}
    </div>
  );
}
