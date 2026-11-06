import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  Building2,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Droplets,
  FileCheck2,
  FileText,
  HardHat,
  IndianRupee,
  Landmark,
  ListChecks,
  Megaphone,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  WalletCards,
  Zap,
} from 'lucide-react';
import api from '../lib/api';
import { inr } from '../lib/format';
import { Badge, Button, Card } from '../components/ui';
import { useAuth, homeFor } from '../context/AuthContext';

const categoryIcons = {
  'Property Services': Building2,
  'Water Services': Droplets,
  'Electricity Services': Zap,
  'Building Permissions': HardHat,
  'Trade Licences': Store,
  'Municipal Services': Landmark,
  'Public Grievances': Megaphone,
};

const fallbackServices = [
  { id: '1', name: 'Property Tax Clearance', category: 'Property Services', description: 'Get a tax clearance certificate for your property.', fee: 500, processingDays: 7 },
  { id: '2', name: 'New Water Connection', category: 'Water Services', description: 'Apply for a domestic or commercial water connection.', fee: 1500, processingDays: 10 },
  { id: '3', name: 'Building Permission', category: 'Building Permissions', description: 'Seek approval for new construction or modification.', fee: 5000, processingDays: 21 },
  { id: '4', name: 'Trade Licence', category: 'Trade Licences', description: 'Register or renew a licence for your business.', fee: 2500, processingDays: 12 },
  { id: '5', name: 'Electricity Name Change', category: 'Electricity Services', description: 'Update the consumer name on your connection.', fee: 750, processingDays: 5 },
  { id: '6', name: 'Birth Certificate', category: 'Municipal Services', description: 'Apply for a birth certificate for a child.', fee: 100, processingDays: 7 },
];

const capabilities = [
  {
    icon: ShieldCheck,
    title: 'Unified citizen login',
    text: 'One secure identity and role-based account for every city service, with a single session across the platform.',
  },
  {
    icon: WalletCards,
    title: 'Verifiable credential wallet',
    text: 'Aadhaar status, DigiLocker access, property records, licences and documents with expiry tracking and verification history.',
  },
  {
    icon: Smartphone,
    title: 'UPI payments',
    text: 'Application fees, property dues and licence renewals paid through a simulated UPI flow with transaction IDs and receipts.',
  },
  {
    icon: BellRing,
    title: 'Proactive due-date nudges',
    text: 'Automated reminders for property tax, licence expiry, pending actions and payment deadlines before they are missed.',
  },
  {
    icon: ListChecks,
    title: 'End-to-end tracking',
    text: 'Every application moves through a transparent timeline from submission and document checks to officer review and approval.',
  },
];

const steps = [
  {
    title: 'Create one verified account',
    text: 'Register with your mobile number and build a citizen profile that follows you across every department.',
  },
  {
    title: 'Choose a city service',
    text: 'Browse clear eligibility, document requirements, fees and processing timelines before you apply.',
  },
  {
    title: 'Pay and track in real time',
    text: 'Complete the fee by UPI and follow each stage: submission, document verification, officer review and approval.',
  },
  {
    title: 'Receive the outcome',
    text: 'Get notified when your certificate is issued or when an officer needs a correction. Everything stays in your wallet.',
  },
];

function ServiceCard({ service }) {
  const Icon = categoryIcons[service.category] || FileText;
  return (
    <Link
      to="/login"
      className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lift"
    >
      <div className="flex items-start justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy-50 text-navy transition group-hover:bg-teal-50 group-hover:text-teal-700">
          <Icon size={20} />
        </span>
        <ArrowUpRight size={18} className="text-slate-300 transition group-hover:text-teal" />
      </div>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-teal-700">{service.category}</p>
      <h3 className="mt-1 text-[15px] font-bold leading-snug text-navy">{service.name}</h3>
      <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-6 text-slate-500">{service.description}</p>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
        <span className="font-bold text-navy">{Number(service.fee) === 0 ? 'No fee' : inr(service.fee)}</span>
        <span className="text-slate-400">{service.processingDays} working days</span>
      </div>
    </Link>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const [services, setServices] = useState(fallbackServices);

  useEffect(() => {
    api
      .get('/services')
      .then(({ data }) => setServices(data.services.slice(0, 6)))
      .catch(() => {});
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div className="hero-grid absolute inset-0 opacity-60" />
        <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-teal/20 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-saffron/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-teal-100">
              <Sparkles size={13} className="text-saffron" />
              APCRDA · Problem DI-01 · Citizen Experience
            </div>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              One city.
              <br />
              One login.
              <br />
              <span className="text-teal-200">Every service.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-white/65">
              Amaravati One brings city services, verified credentials, UPI payments and proactive reminders into a
              single citizen experience. Apply once, track everything, and never miss a deadline again.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to={user ? homeFor(user.role) : '/register'}>
                <Button size="lg" variant="saffron" className="shadow-lg shadow-saffron/20">
                  {user ? 'Open your dashboard' : 'Create citizen account'}
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <a href="#services">
                <Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:border-white/30 hover:bg-white/10">
                  Explore services
                </Button>
              </a>
            </div>

            <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">
              {[
                { value: '1', label: 'Unified login' },
                { value: '5', label: 'Core capabilities' },
                { value: '8+', label: 'City services' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                  <p className="text-[11px] font-medium text-white/45">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md animate-fade-up lg:max-w-none">
            <div className="absolute -inset-6 rounded-[2rem] bg-teal/10 blur-2xl" />
            <div className="relative rounded-3xl border border-white/15 bg-white p-5 text-navy shadow-lift">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-navy-50 text-xs font-extrabold text-navy">
                    RT
                  </span>
                  <div>
                    <p className="text-xs font-bold text-navy">A. Ravi Teja</p>
                    <p className="text-[10px] text-slate-400">Citizen · Vijayawada</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                  Verified
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2.5">
                {[
                  { label: 'Applications', value: '3' },
                  { label: 'Due this week', value: '1' },
                  { label: 'Credentials', value: '5' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-lg font-extrabold text-navy">{stat.value}</p>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-navy">Property Tax Clearance</span>
                  <Badge status="UNDER_REVIEW" />
                </div>
                <p className="mt-1 text-[10px] text-slate-400">AMA-2026-001 · Fee {inr(500)}</p>
                <div className="mt-3 flex items-center gap-1.5">
                  {['Submitted', 'Verified', 'Review', 'Approved'].map((stage, index) => (
                    <div key={stage} className="flex-1">
                      <div className={`h-1.5 rounded-full ${index < 3 ? 'bg-teal' : 'bg-slate-200'}`} />
                      <p className={`mt-1.5 text-[8px] font-semibold ${index < 3 ? 'text-teal-700' : 'text-slate-400'}`}>
                        {stage}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-xl bg-saffron-50 p-3">
                <CalendarClock size={16} className="text-saffron-600" />
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-saffron-600">Property tax due in 7 days</p>
                  <p className="text-[10px] text-slate-500">Pay {inr(4200)} before 12 December 2026</p>
                </div>
                <ArrowRight size={14} className="text-saffron-600" />
              </div>
            </div>

            <div className="absolute -bottom-8 -left-4 hidden w-52 rounded-2xl border border-white/15 bg-navy-800/95 p-3.5 text-white shadow-lift sm:block">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-teal-200">Digital wallet</p>
              <div className="mt-2 space-y-1.5">
                {['Aadhaar verified', 'Property record', 'Driving licence'].map((item) => (
                  <div key={item} className="flex items-center gap-1.5 text-[10px] text-white/70">
                    <CheckCircle2 size={11} className="text-teal-200" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute -right-3 -top-6 hidden rounded-2xl border border-white/15 bg-white p-3 text-navy shadow-lift sm:block">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal-50 text-teal-700">
                  <IndianRupee size={14} />
                </span>
                <div>
                  <p className="text-[9px] text-slate-400">UPI payment</p>
                  <p className="text-[11px] font-extrabold">Payment successful</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Built around five required capabilities
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
            {['Unified login', 'Credential wallet', 'UPI payments', 'Due-date nudges', 'Application tracking'].map(
              (item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-teal" /> {item}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      <section id="services" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Government services</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-navy">The city, in one directory</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Clear eligibility, required documents, fees and timelines for every service. Sign in to apply and track
              your application.
            </p>
          </div>
          <Link to="/login">
            <Button variant="outline">
              View all services <ArrowRight size={15} />
            </Button>
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      <section id="capabilities" className="border-y border-slate-200 bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">The platform</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-navy">
              Five capabilities. One connected experience.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Every requirement in DI-01 is implemented as a working module, from the citizen wallet to the officer
              workflow.
            </p>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((capability, index) => (
              <Card key={capability.title} className="group p-6 transition hover:-translate-y-0.5 hover:shadow-lift">
                <div className="flex items-start justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-navy-50 text-navy transition group-hover:bg-teal-50 group-hover:text-teal-700">
                    <capability.icon size={22} />
                  </span>
                  <span className="text-xs font-extrabold text-slate-200">0{index + 1}</span>
                </div>
                <h3 className="mt-4 text-base font-bold text-navy">{capability.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{capability.text}</p>
              </Card>
            ))}

            <Card className="flex flex-col justify-between bg-navy-900 p-6 text-white">
              <div>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-teal-200">
                  <FileCheck2 size={22} />
                </span>
                <h3 className="mt-4 text-base font-bold">Built for every role</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">
                  Citizens apply, officers verify and decide, and administrators manage services, payments and reports
                  from dedicated portals.
                </p>
              </div>
              <Link to="/login" className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-teal-200">
                Explore the portals <ArrowRight size={14} />
              </Link>
            </Card>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">How it works</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-navy">From application to approval</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              A transparent workflow connects the citizen, the service department and the officer handling the case.
              Every action is recorded in the application timeline.
            </p>
            <div className="mt-6 rounded-2xl border border-teal-100 bg-teal-50 p-5">
              <p className="text-sm font-bold text-teal-800">Proactive by design</p>
              <p className="mt-1.5 text-sm leading-6 text-teal-800/70">
                Reminder jobs watch property tax instalments, licence validity, payment deadlines and pending citizen
                actions, then send notifications before dates slip.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy text-sm font-extrabold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-navy">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: CreditCard,
                title: 'Citizens',
                text: 'Apply, pay, track, store credentials and receive reminders in one place.',
              },
              {
                icon: ShieldCheck,
                title: 'Officers',
                text: 'Review assigned applications, verify documents, request corrections and decide.',
              },
              {
                icon: Landmark,
                title: 'Administrators',
                text: 'Manage services and citizens, monitor payments, broadcast notices and export reports.',
              },
            ].map((role) => (
              <Card key={role.title} className="p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700">
                  <role.icon size={20} />
                </span>
                <h3 className="mt-4 text-base font-bold text-navy">{role.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">{role.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-navy-900 px-6 py-12 text-white sm:px-10 lg:px-14">
          <div className="hero-grid absolute inset-0 opacity-50" />
          <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full bg-teal/20 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-200">Start with one login</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Your city account is ready when you are.</h2>
              <p className="mt-2 text-sm leading-6 text-white/55">
                Create a citizen account to apply for services, build your credential wallet and pay fees securely.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to={user ? homeFor(user.role) : '/register'}>
                <Button size="lg" variant="saffron">
                  {user ? 'Go to dashboard' : 'Create account'} <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
