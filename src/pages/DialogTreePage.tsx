import { ChapterList } from '../components/dialogTree/ChapterList';
import { TreeCanvas } from '../components/dialogTree/TreeCanvas';
import { PropertyPanel } from '../components/dialogTree/PropertyPanel';

export default function DialogTreePage() {
  return (
    <div className="h-full w-full flex">
      <ChapterList />
      <TreeCanvas />
      <PropertyPanel />
    </div>
  );
}
