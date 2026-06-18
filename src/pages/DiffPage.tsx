import { VersionSelector } from '../components/diff/VersionSelector';
import { DiffViewer } from '../components/diff/DiffViewer';
import { SuspenseChecker } from '../components/diff/SuspenseChecker';

export default function DiffPage() {
  return (
    <div className="h-full w-full flex flex-col min-h-0">
      <VersionSelector />
      <SuspenseChecker />
      <DiffViewer />
    </div>
  );
}
