import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Mail, MapPin, Phone, Save, ShieldCheck, Smartphone, UserRound } from 'lucide-react';
import api, { apiError } from '../../lib/api';
import { dateFmt, initials, roleLabel } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  Modal,
  PageHeader,
  cx,
} from '../../components/ui';
import { useToast } from '../../components/Toast';

const genderOptions = ['', 'Female', 'Male', 'Non-binary', 'Prefer not to say'];

const buildForm = (user) => ({
  fullName: user?.fullName || '',
  phone: user?.phone || '',
  aadhaarNumber: user?.profile?.aadhaarNumber || '',
  dateOfBirth: user?.profile?.dateOfBirth ? user.profile.dateOfBirth.slice(0, 10) : '',
  gender: user?.profile?.gender || '',
  addressLine: user?.profile?.addressLine || '',
  city: user?.profile?.city || '',
  district: user?.profile?.district || '',
  state: user?.profile?.state || 'Andhra Pradesh',
  pincode: user?.profile?.pincode || '',
});

export default function Profile() {
  const { user, refresh, updateUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(() => buildForm(user));
  const [saving, setSaving] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [previewOtp, setPreviewOtp] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);

  useEffect(() => {
    setForm(buildForm(user));
  }, [user]);

  const completion = useMemo(() => {
    const fields = [form.fullName, form.phone, form.aadhaarNumber, form.dateOfBirth, form.addressLine, form.city, form.district, form.pincode];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [form]);

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch('/auth/profile', {
        fullName: form.fullName,
        phone: form.phone || null,
        profile: {
          aadhaarNumber: form.aadhaarNumber || null,
          dateOfBirth: form.dateOfBirth || null,
          gender: form.gender || null,
          addressLine: form.addressLine || null,
          city: form.city || null,
          district: form.district || null,
          state: form.state || null,
          pincode: form.pincode || null,
        },
      });
      updateUser(data.user);
      toast.success(data.message || 'Profile updated.');
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const requestOtp = async () => {
    setOtpBusy(true);
    try {
      const { data } = await api.post('/auth/verify-phone/request');
      setPreviewOtp(data.previewOtp);
      setOtpOpen(true);
      toast.info(data.message);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setOtpBusy(false);
    }
  };

  const confirmOtp = async (event) => {
    event.preventDefault();
    setOtpBusy(true);
    try {
      const { data } = await api.post('/auth/verify-phone/confirm', { otp });
      updateUser(data.user);
      setOtpOpen(false);
      setOtp('');
      toast.success(data.message);
      await refresh().catch(() => {});
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setOtpBusy(false);
    }
  };

  if (!user) return null;

  const profile = user.profile || {};

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Profile and preferences"
        description="Keep your identity and contact details current so applications and alerts reach you correctly."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card className="p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-navy">Personal details</h2>
              <p className="text-xs text-slate-500">These details are pre-filled into new applications.</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold text-navy">{completion}%</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Complete</p>
            </div>
          </div>

          <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${completion}%` }} />
          </div>

          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <input required value={form.fullName} onChange={set('fullName')} className="input" />
              </Field>
              <Field label="Date of birth">
                <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} className="input" />
              </Field>
              <Field label="Gender">
                <select value={form.gender} onChange={set('gender')} className="input">
                  {genderOptions.map((option) => (
                    <option key={option} value={option}>{option || 'Select gender'}</option>
                  ))}
                </select>
              </Field>
              <Field label="Aadhaar number (optional)" hint="Stored for pre-fill only in this prototype.">
                <input value={form.aadhaarNumber} onChange={set('aadhaarNumber')} placeholder="XXXX XXXX XXXX" className="input" />
              </Field>
            </div>

            <Field label="Address">
              <input value={form.addressLine} onChange={set('addressLine')} placeholder="House no, street, locality" className="input" />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="City / village">
                <input value={form.city} onChange={set('city')} className="input" />
              </Field>
              <Field label="District">
                <input value={form.district} onChange={set('district')} className="input" />
              </Field>
              <Field label="State">
                <input value={form.state} onChange={set('state')} className="input" />
              </Field>
              <Field label="PIN code">
                <input value={form.pincode} onChange={set('pincode')} className="input" />
              </Field>
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Button type="submit" loading={saving}>
                <Save size={15} /> Save changes
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-5">
          <Card className="p-5 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-navy text-xl font-extrabold text-white">
              {initials(user.fullName)}
            </span>
            <h3 className="mt-3 text-base font-bold text-navy">{user.fullName}</h3>
            <div className="mt-1 flex justify-center"><Badge status={user.role} /></div>
            <p className="mt-1 text-xs text-slate-500">{roleLabel(user.role)} since {dateFmt(user.createdAt)}</p>

            <div className="mt-4 space-y-2 text-left">
              <Row icon={Mail} label={user.email} />
              <Row icon={Phone} label={user.phone || 'No mobile number'} muted={!user.phone} />
              <Row
                icon={MapPin}
                label={profile.city ? `${profile.city}${profile.district ? `, ${profile.district}` : ''}` : 'Address not added'}
                muted={!profile.city}
              />
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-navy">Mobile verification</p>
                  <p className="text-[11px] text-slate-500">
                    {user.phoneVerified ? 'Verified via simulated OTP' : 'Not verified yet'}
                  </p>
                </div>
                {user.phoneVerified ? (
                  <BadgeCheck size={20} className="text-emerald-600" />
                ) : (
                  <Button size="sm" variant="outline" onClick={requestOtp} loading={otpBusy} disabled={!user.phone}>
                    Verify
                  </Button>
                )}
              </div>
              {!user.phone && (
                <p className="mt-2 rounded-lg bg-slate-50 px-2.5 py-2 text-[11px] text-slate-500">
                  Add a mobile number above and save before verifying.
                </p>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={18} className="mt-0.5 text-teal-700" />
              <div>
                <p className="text-xs font-bold text-navy">Aadhaar and identity checks</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  Identity, DigiLocker and UPI checks in this prototype are simulated. No data leaves this local
                  environment and none of it is authenticated by a government authority.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Account status</p>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-500">Active</span>
              <Badge status={user.isActive ? 'ACTIVE' : 'INACTIVE'} />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-500">Role</span>
              <span className="font-semibold text-navy">{roleLabel(user.role)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-500">Member since</span>
              <span className="font-semibold text-navy">{dateFmt(user.createdAt)}</span>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={otpOpen}
        onClose={() => setOtpOpen(false)}
        title="Verify your mobile number"
        description="Simulated OTP verification — no SMS is actually sent."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOtpOpen(false)}>Cancel</Button>
            <Button form="otp-form" type="submit" loading={otpBusy}>Verify number</Button>
          </>
        }
      >
        <form id="otp-form" onSubmit={confirmOtp} className="space-y-4">
          <div className="flex items-center gap-2.5 rounded-xl bg-teal-50 px-3.5 py-3 text-xs text-teal-800">
            <Smartphone size={16} />
            Code sent to {form.phone || user.phone}. Demo OTP: <span className="font-mono font-bold">{previewOtp || '123456'}</span>
          </div>
          <Field label="6-digit verification code">
            <input
              required
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className={cx('input text-center text-lg font-bold tracking-[0.4em]')}
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}

function Row({ icon: Icon, label, muted }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon size={14} className="shrink-0 text-slate-400" />
      <span className={cx('truncate', muted ? 'text-slate-400' : 'text-slate-600')}>{label}</span>
    </div>
  );
}
