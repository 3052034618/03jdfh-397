import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-abyss-900 text-ghost-500">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none bg-gradient-radial-blood opacity-60" />
        <div className="relative flex-1 min-h-0">{children}</div>
      </main>
    </div>
  );
}
