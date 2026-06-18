import { useEffect } from 'react';
import { VersionSelector } from '../components/diff/VersionSelector';
import { DiffViewer } from '../components/diff/DiffViewer';
import { SuspenseChecker } from '../components/diff/SuspenseChecker';
import { useDiffStore } from '../store/useDiffStore';

export default function DiffPage() {
  const computeDiff = useDiffStore((s) => s.computeDiff);

  useEffect(() => {
    computeDiff();
  }, [computeDiff]);

  return (
    <div className="h-full w-full flex flex-col min-h-0">
      <VersionSelector />
      <SuspenseChecker />
      <DiffViewer />
    </div>
  );
}
