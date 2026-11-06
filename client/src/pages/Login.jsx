import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import { Alert, Button, Field } from '../components/ui';
import { useToast } from '../components/Toast';
import { apiError } from '../lib/api';
import { homeFor, useAuth } from '../context/AuthContext';

const demos = [
  { label: 'Citizen', email: 'citizen@amaravati.one', password: 'Citizen@123', tone: 'bg-teal-50 text-teal-700' },
  { label: 'Officer', email: 'officer@amaravati.one', password: 'Officer@123', tone: 'bg-saffron-50 text-saffron-600' },
  { label: 'Admin', email: 'admin@amaravati.one', password: 'Admin@123', tone: 'bg-navy-50 text-navy' },
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate(homeFor(user.role), { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const signedIn = await login(form.email, form.password);
      toast.success(`Welcome back, ${signedIn.fullName.split(' ')[0]}.`);
      navigate(homeFor(signedIn.role), { replace: true });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Sign in to your account"
      subtitle="Use one citizen account to access services, credentials, payments and reminders."
      footer={
        <p className="text-center text-sm text-slate-500">
          New to Amaravati One?{' '}
          <Link to="/register" className="font-bold text-teal-700 hover:text-teal-600">
            Create a citizen account
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="danger">{error}</Alert>}

        <Field label="Email address">
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="you@example.com"
              className="input pl-10"
            />
          </div>
        </Field>

        <Field label="Password">
          <div className="relative">
            <Lock size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Enter your password"
              className="input px-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-3 rounded p-0.5 text-slate-400 hover:text-navy"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Session stays active for 7 days</span>
          <Link to="/forgot-password" className="text-xs font-bold text-teal-700 hover:text-teal-600">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Sign in <ArrowRight size={16} />
        </Button>
      </form>

      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-3.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Demo accounts</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {demos.map((demo) => (
            <button
              key={demo.label}
              type="button"
              onClick={() => setForm({ email: demo.email, password: demo.password })}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition hover:brightness-95 ${demo.tone}`}
            >
              {demo.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-4 text-slate-400">
          Click a role to fill the credentials, then sign in. Admin and officer accounts open their own portals.
        </p>
      </div>
    </AuthShell>
  );
}
