import { useEffect, useState } from 'react';
import { VersionSelector } from '../components/diff/VersionSelector';
import { DiffViewer } from '../components/diff/DiffViewer';
import { SuspenseChecker } from '../components/diff/SuspenseChecker';
import { HotfixBoard } from '../components/diff/HotfixBoard';
import { useDiffStore } from '../store/useDiffStore';
import { GitCompare, Package } from 'lucide-react';
import { clsx } from 'clsx';

type DiffTab = 'compare' | 'board';

export default function DiffPage() {
  const computeDiff = useDiffStore((s) => s.computeDiff);
  const [activeTab, setActiveTab] = useState<DiffTab>('compare');

  useEffect(() => {
    computeDiff();
  }, [computeDiff]);

  return (
    <div className="h-full w-full flex flex-col min-h-0">
      {/* Tab 导航 */}
      <div className="flex items-center gap-1 px-4 pt-3 border-b border-abyss-700/60">
        <button
          onClick={() => setActiveTab('compare')}
          className={clsx(
            'px-4 py-2 text-xs font-medium tracking-wider rounded-t-sm border border-b-0 transition-colors flex items-center gap-1.5 -mb-px',
            activeTab === 'compare'
              ? 'bg-abyss-800/80 border-abyss-700/60 text-ghost-500'
              : 'border-transparent text-ghost-900 hover:text-ghost-700 hover:bg-abyss-800/30'
          )}
        >
          <GitCompare className="w-3.5 h-3.5" />
          差异对比
        </button>
        <button
          onClick={() => setActiveTab('board')}
          className={clsx(
            'px-4 py-2 text-xs font-medium tracking-wider rounded-t-sm border border-b-0 transition-colors flex items-center gap-1.5 -mb-px',
            activeTab === 'board'
              ? 'bg-abyss-800/80 border-abyss-700/60 text-ghost-500'
              : 'border-transparent text-ghost-900 hover:text-ghost-700 hover:bg-abyss-800/30'
          )}
        >
          <Package className="w-3.5 h-3.5" />
          发布看板
        </button>
      </div>

      {activeTab === 'compare' ? (
        <>
          <VersionSelector />
          <SuspenseChecker />
          <DiffViewer />
        </>
      ) : (
        <HotfixBoard />
      )}
    </div>
  );
}
