import { FeedbackBoard } from '../components/review/FeedbackBoard';
import { TodoGenerator } from '../components/review/TodoGenerator';
import { TodoList } from '../components/review/TodoList';
import { TraceFlow } from '../components/review/TraceFlow';

export default function ReviewPage() {
  return (
    <div className="h-full w-full flex min-h-0">
      <FeedbackBoard />
      <div className="w-[420px] shrink-0 h-full flex flex-col min-h-0">
        <TodoGenerator />
        <TodoList />
        <TraceFlow />
      </div>
    </div>
  );
}
