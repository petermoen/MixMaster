import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Music, ListMusic, Disc3 } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/songs', icon: Music, label: 'Songs' },
  { to: '/setlists', icon: ListMusic, label: 'Setlists' },
];

export function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-bg-secondary border-r border-border flex flex-col fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-purple flex items-center justify-center">
          <Disc3 size={22} className="text-bg-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-text-primary tracking-tight">MixMaster</h1>
          <p className="text-xs text-text-muted">Trance Collection</p>
        </div>
      </div>

      <nav className="flex-1 px-3 mt-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg mb-1 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary border border-transparent'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mx-3 mb-4 rounded-lg bg-gradient-to-r from-accent/5 to-accent-purple/5 border border-border">
        <p className="text-xs text-text-muted">Built for the beat</p>
      </div>
    </aside>
  );
}
