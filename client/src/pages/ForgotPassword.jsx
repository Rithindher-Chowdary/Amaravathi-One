import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Copy, KeyRound, Mail } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import { Alert, Button, Field } from '../components/ui';
import { useToast } from '../components/Toast';
import api, { apiError } from '../lib/api';

export default function ForgotPassword() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const requestReset = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      if (data.previewResetToken) {
        setToken(data.previewResetToken);
        setStep(2);
        toast.info('Reset token generated. This prototype shows it on screen.');
      } else {
        setError('No account was found for that email address.');
      }
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setStep(3);
      toast.success('Password updated. You can sign in now.');
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(token);
      toast.info('Reset token copied.');
    } catch {
      toast.error('Could not copy the token.');
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We will generate a one-time reset token for your registered email address."
      footer={
        <p className="text-center text-sm text-slate-500">
          <Link to="/login" className="inline-flex items-center gap-1.5 font-bold text-teal-700 hover:text-teal-600">
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </p>
      }
    >
      {error && <Alert type="danger" className="mb-4">{error}</Alert>}

      {step === 1 && (
        <form onSubmit={requestReset} className="space-y-4">
          <Field label="Registered email address">
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="input pl-10"
              />
            </div>
          </Field>
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Send reset link <ArrowRight size={16} />
          </Button>
          <Alert type="info">
            Email delivery is simulated in this prototype. The generated token is shown on the next screen.
          </Alert>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={resetPassword} className="space-y-4">
          <Alert type="warning" title="Simulated email">
            In production this token would arrive by email. For the demo, copy the token below and set a new password.
          </Alert>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5">
            <code className="flex-1 break-all text-[11px] text-slate-600">{token}</code>
            <Button type="button" size="sm" variant="soft" onClick={copyToken}>
              <Copy size={13} /> Copy
            </Button>
          </div>

          <Field label="New password" hint="Minimum 8 characters">
            <div className="relative">
              <KeyRound size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter a new password"
                className="input pl-10"
              />
            </div>
          </Field>

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Update password <ArrowRight size={16} />
          </Button>
        </form>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <Alert type="success" title="Password updated">
            Your password has been changed successfully. Sign in with your new password.
          </Alert>
          <Link to="/login">
            <Button className="w-full" size="lg">
              Continue to sign in <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
