import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  CalendarClock,
  CreditCard,
  FileText,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { initials, roleLabel } from '../lib/format';
import { cx } from './ui';

const citizenNav = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/services', label: 'Services', icon: Landmark },
  { to: '/app/applications', label: 'Applications', icon: FileText },
  { to: '/app/wallet', label: 'Digital Wallet', icon: Wallet },
  { to: '/app/payments', label: 'Payments', icon: CreditCard },
  { to: '/app/notifications', label: 'Notifications', icon: Bell },
  { to: '/app/profile', label: 'Profile', icon: User },
];

const adminNav = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/citizens', label: 'Citizens', icon: Users },
  { to: '/admin/services', label: 'Services', icon: Landmark },
  { to: '/admin/applications', label: 'Applications', icon: FileText },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/due-dates', label: 'Due Dates', icon: CalendarClock },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/profile', label: 'Profile', icon: User },
];

const officerNav = [
  { to: '/officer', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/officer/applications', label: 'Assigned Applications', icon: FileText },
  { to: '/officer/notifications', label: 'Notifications', icon: Bell },
  { to: '/officer/profile', label: 'Profile', icon: User },
];

const navByRole = { CITIZEN: citizenNav, ADMIN: adminNav, OFFICER: officerNav };

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const nav = navByRole[user?.role] || citizenNav;
  const notificationPath =
    user?.role === 'ADMIN' ? '/admin/notifications' : user?.role === 'OFFICER' ? '/officer/notifications' : '/app/notifications';

  useEffect(() => {
    api
      .get('/notifications')
      .then(({ data }) => setUnread(data.unread))
      .catch(() => {});
  }, [user?.id]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link to="/" className="flex items-center gap-3 px-5 py-5" onClick={() => setMenuOpen(false)}>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal text-white shadow-sm">
          <Landmark size={20} />
        </span>
        <span>
          <span className="block text-[15px] font-extrabold leading-tight text-white">Amaravati One</span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.17em] text-teal-200">
            Citizen Platform
          </span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2 scrollbar-thin">
        <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
          {user?.role === 'ADMIN' ? 'Administration' : user?.role === 'OFFICER' ? 'Officer Workspace' : 'Citizen Workspace'}
        </p>
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
              cx(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/10'
                  : 'text-white/65 hover:bg-white/5 hover:text-white'
              )
            }
          >
            <item.icon size={18} />
            <span className="flex-1">{item.label}</span>
            {item.label === 'Notifications' && unread > 0 && (
              <span className="rounded-full bg-saffron px-1.5 py-0.5 text-[10px] font-extrabold text-navy-900">
                {unread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-saffron text-xs font-extrabold text-navy-900">
            {initials(user?.fullName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{user?.fullName}</p>
            <p className="truncate text-[11px] text-white/50">{roleLabel(user?.role)}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface lg:flex">
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-navy-900/60 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)} />
      )}

      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-50 w-[272px] bg-navy-900 transition-transform duration-200 lg:sticky lg:top-0 lg:z-10 lg:h-screen lg:translate-x-0',
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          type="button"
          onClick={() => setMenuOpen(false)}
          className="absolute right-3 top-4 rounded-lg p-2 text-white/60 hover:bg-white/10 lg:hidden"
        >
          <X size={18} />
        </button>
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Government of Andhra Pradesh
              </p>
              <p className="text-sm font-bold text-navy">Unified Citizen Services</p>
            </div>
            <span className="text-sm font-extrabold text-navy sm:hidden">Amaravati One</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={notificationPath}
              className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-navy"
            >
              <Bell size={19} />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-navy-50 text-[10px] font-extrabold text-navy">
                {initials(user?.fullName)}
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="max-w-[140px] truncate text-xs font-bold text-navy">{user?.fullName}</p>
                <p className="text-[10px] text-slate-500">{roleLabel(user?.role)}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
