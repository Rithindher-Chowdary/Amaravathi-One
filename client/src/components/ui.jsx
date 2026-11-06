import { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Inbox, Info, Loader2, X } from 'lucide-react';
import { formatStatus } from '../lib/format';

export const cx = (...values) => values.filter(Boolean).join(' ');

const buttonVariants = {
  primary: 'bg-navy text-white hover:bg-navy-700 focus-visible:ring-navy/30',
  teal: 'bg-teal text-white hover:bg-teal-600 focus-visible:ring-teal/30',
  saffron: 'bg-saffron text-navy-900 hover:bg-saffron-600 hover:text-white focus-visible:ring-saffron/40',
  outline: 'border border-slate-300 bg-white text-navy hover:border-slate-400 hover:bg-slate-50 focus-visible:ring-slate-300',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-navy focus-visible:ring-slate-200',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-300',
  soft: 'bg-teal-50 text-teal-700 hover:bg-teal-100 focus-visible:ring-teal/20',
};

const buttonSizes = {
  sm: 'h-9 gap-1.5 px-3 text-xs',
  md: 'h-11 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-6 text-sm',
  icon: 'h-10 w-10 justify-center',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  loading = false,
  disabled,
  children,
  ...props
}) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex items-center justify-center rounded-xl font-semibold transition focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60',
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

export function Card({ className, children, ...props }) {
  return (
    <div className={cx('rounded-2xl border border-slate-200/80 bg-white shadow-soft', className)} {...props}>
      {children}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">{eyebrow}</p>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const statTones = {
  navy: 'bg-navy-50 text-navy',
  teal: 'bg-teal-50 text-teal-700',
  saffron: 'bg-saffron-50 text-saffron-600',
  emerald: 'bg-emerald-50 text-emerald-700',
  rose: 'bg-rose-50 text-rose-700',
  sky: 'bg-sky-50 text-sky-700',
};

export function StatCard({ label, value, icon: Icon, tone = 'navy', hint, className }) {
  return (
    <Card className={cx('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-navy">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        {Icon && (
          <span className={cx('grid h-11 w-11 shrink-0 place-items-center rounded-xl', statTones[tone])}>
            <Icon size={20} />
          </span>
        )}
      </div>
    </Card>
  );
}

const badgeStyles = {
  SUBMITTED: 'bg-sky-50 text-sky-700 ring-sky-600/15',
  DOCUMENTS_VERIFIED: 'bg-cyan-50 text-cyan-700 ring-cyan-600/15',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  CORRECTION_REQUESTED: 'bg-orange-50 text-orange-700 ring-orange-600/15',
  APPROVED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  REJECTED: 'bg-rose-50 text-rose-700 ring-rose-600/15',
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  SUCCESS: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  FAILED: 'bg-rose-50 text-rose-700 ring-rose-600/15',
  REFUNDED: 'bg-slate-100 text-slate-600 ring-slate-500/15',
  VERIFIED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  EXPIRED: 'bg-rose-50 text-rose-700 ring-rose-600/15',
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  INACTIVE: 'bg-slate-100 text-slate-600 ring-slate-500/15',
  DUE_DATE: 'bg-saffron-50 text-saffron-600 ring-saffron-500/20',
  STATUS_UPDATE: 'bg-sky-50 text-sky-700 ring-sky-600/15',
  PAYMENT: 'bg-teal-50 text-teal-700 ring-teal-600/15',
  GENERAL: 'bg-slate-100 text-slate-600 ring-slate-500/15',
};

export function Badge({ status, children, className }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset',
        badgeStyles[status] || 'bg-slate-100 text-slate-600 ring-slate-500/15',
        className
      )}
    >
      {children || formatStatus(status)}
    </span>
  );
}

export function Field({ label, hint, error, children, className }) {
  return (
    <label className={cx('block', className)}>
      {label && <span className="label">{label}</span>}
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
  return (
    <div className={cx('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon size={22} />
      </span>
      <h3 className="mt-4 text-sm font-bold text-navy">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Alert({ type = 'info', title, children, className }) {
  const config = {
    info: { style: 'border-sky-200 bg-sky-50 text-sky-800', Icon: Info },
    success: { style: 'border-emerald-200 bg-emerald-50 text-emerald-800', Icon: CheckCircle2 },
    warning: { style: 'border-amber-200 bg-amber-50 text-amber-800', Icon: AlertTriangle },
    danger: { style: 'border-rose-200 bg-rose-50 text-rose-800', Icon: AlertTriangle },
  }[type] || { style: 'border-sky-200 bg-sky-50 text-sky-800', Icon: Info };

  return (
    <div className={cx('flex items-start gap-3 rounded-xl border p-3.5 text-sm', config.style, className)}>
      <config.Icon size={17} className="mt-0.5 shrink-0" />
      <div>
        {title && <p className="font-bold">{title}</p>}
        <div className={cx('leading-5', title && 'mt-0.5 opacity-90')}>{children}</div>
      </div>
    </div>
  );
}

export function Spinner({ size = 18, className }) {
  return <Loader2 size={size} className={cx('animate-spin text-teal', className)} />;
}

export function LoadingBlock({ label = 'Loading...', className }) {
  return (
    <div className={cx('flex items-center justify-center gap-2 py-12 text-sm text-slate-500', className)}>
      <Spinner />
      {label}
    </div>
  );
}

export function FullScreenLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-surface">
      <div className="flex flex-col items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-navy text-white">
          <Loader2 size={22} className="animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-500">Loading Amaravati One...</p>
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <button type="button" aria-label="Close dialog" className="absolute inset-0" onClick={onClose} />
      <div className={cx('relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-lift sm:rounded-2xl', sizes[size])}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-navy">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-navy">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function ProgressBar({ value = 0, className }) {
  return (
    <div className={cx('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)}>
      <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
