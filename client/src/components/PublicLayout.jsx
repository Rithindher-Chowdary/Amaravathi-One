import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Landmark, Menu, X } from 'lucide-react';
import { Button, cx } from './ui';
import { useAuth, homeFor } from '../context/AuthContext';

const links = [
  { href: '/#services', label: 'Services' },
  { href: '/#capabilities', label: 'Platform' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#help', label: 'Help' },
];

export default function PublicLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-navy text-teal-100">
              <Landmark size={18} />
            </span>
            <span className="leading-tight">
              <span className="block text-[15px] font-extrabold tracking-tight text-navy">Amaravati One</span>
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:block">
                Unified Citizen Services
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {links.map((link) => (
              <a key={link.href} href={link.href} className="text-sm font-medium text-slate-600 transition hover:text-navy">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <Link to={homeFor(user.role)}>
                <Button size="sm" variant="primary">Open dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button size="sm" variant="ghost">Sign in</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" variant="primary">Get started</Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div className={cx('border-t border-slate-100 bg-white md:hidden', open ? 'block' : 'hidden')}>
          <div className="space-y-1 px-4 py-3">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {link.label}
              </a>
            ))}
            <div className="flex gap-2 pt-2">
              {user ? (
                <Link to={homeFor(user.role)} className="flex-1">
                  <Button className="w-full" size="sm">Open dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" className="flex-1">
                    <Button className="w-full" size="sm" variant="outline">Sign in</Button>
                  </Link>
                  <Link to="/register" className="flex-1">
                    <Button className="w-full" size="sm">Get started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main key={location.pathname}>
        <Outlet />
      </main>

      <footer id="help" className="border-t border-slate-200 bg-navy-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal text-white">
                <Landmark size={18} />
              </span>
              <span className="text-[15px] font-extrabold">Amaravati One</span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/60">
              A unified citizen services super app and digital wallet for Amaravati, built for the APCRDA DI-01
              challenge.
            </p>
            <p className="mt-4 text-xs text-white/40">Prototype. Payments and external verifications are simulated.</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/40">Platform</p>
            <div className="mt-3 space-y-2 text-sm text-white/65">
              <a href="/#services" className="block hover:text-white">Service directory</a>
              <a href="/#capabilities" className="block hover:text-white">Digital wallet</a>
              <a href="/#how-it-works" className="block hover:text-white">How it works</a>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/40">Access</p>
            <div className="mt-3 space-y-2 text-sm text-white/65">
              <Link to="/login" className="block hover:text-white">Citizen login</Link>
              <Link to="/register" className="block hover:text-white">Create account</Link>
              <Link to="/forgot-password" className="block hover:text-white">Reset password</Link>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/40">Support</p>
            <div className="mt-3 space-y-2 text-sm text-white/65">
              <p>help@amaravati.one</p>
              <p>1800 000 0000</p>
              <p>Mon-Sat, 9:00-18:00</p>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p>© 2026 Amaravati One. A citizen experience prototype.</p>
            <p>Built with the PERN stack · APCRDA Problem DI-01</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
