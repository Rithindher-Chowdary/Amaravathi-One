import { Link } from 'react-router-dom';
import { BellRing, FileText, Landmark, ShieldCheck, Wallet } from 'lucide-react';

const highlights = [
  { icon: ShieldCheck, title: 'One verified identity', text: 'A single citizen account for every city service.' },
  { icon: Wallet, title: 'A wallet you control', text: 'Aadhaar, DigiLocker, property and licence records in one place.' },
  { icon: BellRing, title: 'Never miss a deadline', text: 'Proactive nudges for taxes, fees and document expiry.' },
  { icon: FileText, title: 'Track every stage', text: 'End-to-end visibility from submission to certificate.' },
];

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.04fr_0.96fr]">
      <div className="relative hidden overflow-hidden bg-navy-900 px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="hero-grid absolute inset-0 opacity-70" />
        <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-teal/20 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-saffron/10 blur-3xl" />

        <div className="relative">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal text-white">
              <Landmark size={22} />
            </span>
            <span>
              <span className="block text-base font-extrabold tracking-tight">Amaravati One</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-200">
                Unified Citizen Services
              </span>
            </span>
          </Link>
        </div>

        <div className="relative max-w-lg">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-200">APCRDA · DI-01</p>
          <h2 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight">
            One city.
            <br />
            One login.
            <br />
            <span className="text-teal-200">Every service.</span>
          </h2>
          <p className="mt-4 text-sm leading-6 text-white/60">
            A unified citizen experience for Amaravati: government services, verified credentials, UPI payments and
            proactive reminders.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {highlights.map((item) => (
              <div key={item.title} className="rounded-xl border border-white/10 bg-white/5 p-3.5">
                <item.icon size={18} className="text-teal-200" />
                <p className="mt-2 text-sm font-bold">{item.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-white/50">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-between text-xs text-white/35">
          <span>© 2026 Amaravati One</span>
          <span>Prototype environment</span>
        </div>
      </div>

      <div className="flex min-h-screen flex-col justify-center bg-surface px-4 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy text-teal-100">
              <Landmark size={20} />
            </span>
            <span>
              <span className="block text-[15px] font-extrabold text-navy">Amaravati One</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Unified Citizen Services
              </span>
            </span>
          </Link>

          <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>}

          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6">{footer}</div>}

          <p className="mt-10 text-center text-xs leading-5 text-slate-400">
            Prototype only. External credential verification and UPI payments are simulated.
          </p>
        </div>
      </div>
    </div>
  );
}
