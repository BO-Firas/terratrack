import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Users, Building2, Map, Calendar, Bell, LogOut, Shield } from 'lucide-react';
import Logo from './Logo';
 
const navItems = [
  { to: '/map', label: 'Carte live', icon: MapPin },
  { to: '/agents', label: 'Agents', icon: Users },
  { to: '/clients', label: 'Clients', icon: Building2 },
  { to: '/zones', label: 'Zones', icon: Map },
  { to: '/visits', label: 'Visites', icon: Calendar },
  { to: '/alerts', label: 'Alertes', icon: Bell },
];
 
export default function Layout() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();
 
  function handleLogout() {
    logout();
    navigate('/login');
  }
 
  return (
    <div
      className="flex bg-[var(--bg-base)]"
      style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}
    >
      {/* Sidebar */}
      <aside
        className="w-64 flex-shrink-0 flex flex-col"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        {/* Logo + titre */}
        <div
          className="h-16 flex items-center gap-3 px-5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="text-[var(--accent-primary)]">
            <Logo size={26} />
          </div>
          <div>
            <div className="font-bold text-[15px] tracking-tight">TerraTrack</div>
            <div className="text-[10px] text-[var(--text-tertiary)] tracking-widest uppercase">
              Field Operations
            </div>
          </div>
        </div>
 
        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <div className="text-[10px] font-semibold text-[var(--text-tertiary)] tracking-widest uppercase px-3 mb-2">
            Operations
          </div>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[var(--accent-primary-bg)] text-[var(--accent-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                }`
              }
            >
              <Icon size={17} strokeWidth={2} />
              <span>{label}</span>
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[var(--accent-primary-bg)] text-[var(--accent-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                }`
              }
            >
              <Shield size={17} strokeWidth={2} />
              <span>Utilisateurs</span>
            </NavLink>
          )}
        </nav>
 
        {/* Profil utilisateur */}
        <div
          className="p-3"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-3 p-2 rounded-lg">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-sm flex-shrink-0"
              style={{
                background:
                  'linear-gradient(135deg, var(--accent-primary), #34d399)',
                color: '#ffffff',
              }}
            >
              {user?.fullName?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                {user?.fullName}
              </div>
              <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
                {user?.role}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 mt-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition"
          >
            <LogOut size={15} />
            Deconnexion
          </button>
        </div>
      </aside>
 
      {/* Contenu principal */}
      <main className="flex-1 overflow-hidden" style={{ minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
}