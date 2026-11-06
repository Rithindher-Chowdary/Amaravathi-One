import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import { Alert, Button, Field } from '../components/ui';
import { useToast } from '../components/Toast';
import { apiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const benefits = [
  'Apply for city services from one account',
  'Store Aadhaar, property and licence credentials',
  'Pay fees by UPI and download receipts',
  'Get reminders before every due date',
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
      });
      toast.success('Citizen account created. Welcome to Amaravati One.');
      navigate('/app/dashboard', { replace: true });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your citizen account"
      subtitle="One secure identity for all Amaravati city services, credentials and payments."
      footer={
        <p className="text-center text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-teal-700 hover:text-teal-600">
            Sign in instead
          </Link>
        </p>
      }
    >
      <div className="mb-5 grid gap-2 rounded-xl bg-teal-50 p-3.5">
        {benefits.map((benefit) => (
          <div key={benefit} className="flex items-start gap-2 text-xs font-medium text-teal-800">
            <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
            {benefit}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="danger">{error}</Alert>}

        <Field label="Full name">
          <div className="relative">
            <User size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
            <input
              required
              minLength={3}
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              placeholder="As printed on your Aadhaar"
              className="input pl-10"
            />
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email address">
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="you@example.com"
                className="input pl-10"
              />
            </div>
          </Field>
          <Field label="Mobile number">
            <div className="relative">
              <Phone size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                placeholder="10-digit number"
                className="input pl-10"
              />
            </div>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" hint="Minimum 8 characters">
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="Create password"
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
          <Field label="Confirm password">
            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={form.confirm}
                onChange={(event) => setForm({ ...form, confirm: event.target.value })}
                placeholder="Repeat password"
                className="input pl-10"
              />
            </div>
          </Field>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Create account <ArrowRight size={16} />
        </Button>

        <p className="text-center text-[11px] leading-4 text-slate-400">
          By creating an account you agree to the prototype terms of use. Mobile verification is simulated.
        </p>
      </form>
    </AuthShell>
  );
}
