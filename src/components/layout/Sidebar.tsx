import { NavLink } from 'react-router-dom';
import { GitBranch, Columns3, MessageSquareText, Skull } from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { to: '/', label: '对白树管理', icon: GitBranch, key: 'tree' },
  { to: '/diff', label: '热修对比', icon: Columns3, key: 'diff' },
  { to: '/review', label: '社区复盘', icon: MessageSquareText, key: 'review' },
];

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 h-full bg-abyss-950/80 border-r border-abyss-700/70 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-gradient-to-b from-blood-900/20 via-transparent to-transparent" />
      
      <div className="relative p-5 border-b border-abyss-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[2px] bg-gradient-to-br from-blood-800 to-abyss-900 border border-blood-700/60 flex items-center justify-center shadow-glow-red animate-flicker">
            <Skull className="w-5 h-5 text-blood-400" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-ghost-300 tracking-wider text-base">
              对白树·后台
            </h1>
            <p className="text-[10px] text-ghost-900 tracking-widest uppercase">
              Narrative Ops Console
            </p>
          </div>
        </div>
      </div>

      <nav className="relative flex-1 p-3 space-y-1 scrollbar-thin overflow-y-auto">
        <p className="text-[10px] font-medium text-ghost-900 tracking-[0.2em] uppercase px-3 mb-2 pt-2">
          工作模块
        </p>
        {navItems.map(({ to, label, icon: Icon, key }) => (
          <NavLink
            key={key}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'group flex items-center gap-3 px-3 py-2.5 rounded-[2px] text-sm transition-all duration-200 relative',
                isActive
                  ? 'bg-blood-800/25 text-ghost-300 border border-blood-700/40 shadow-inner-abyss'
                  : 'text-ghost-700 hover:text-ghost-500 hover:bg-abyss-800/60 border border-transparent'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blood-500 rounded-r shadow-glow-red animate-pulse-slow" />
                )}
                <Icon
                  className={clsx(
                    'w-4 h-4 transition-transform duration-200',
                    isActive ? 'text-blood-400 scale-110' : 'group-hover:scale-110'
                  )}
                />
                <span className="tracking-wide">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="relative p-4 border-t border-abyss-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-void-800 border border-void-700 flex items-center justify-center text-xs font-serif font-semibold text-amber-400">
            墨
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-ghost-500 truncate">叙事-墨白</p>
            <p className="text-[10px] text-ghost-900 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-moss-700" />
              在线
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
