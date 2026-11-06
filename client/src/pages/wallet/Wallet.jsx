import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  CreditCard,
  Download,
  FileCheck2,
  FileText,
  Plus,
  ShieldCheck,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react';
import api, { apiError } from '../../lib/api';
import { dateFmt, dateTimeFmt, daysUntil, formatStatus } from '../../lib/format';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  LoadingBlock,
  Modal,
  PageHeader,
  cx,
} from '../../components/ui';
import { useToast } from '../../components/Toast';

const typeConfig = {
  AADHAAR: { label: 'Aadhaar', icon: ShieldCheck, tone: 'bg-teal-50 text-teal-700', accent: 'from-teal-500/10' },
  DIGILOCKER: { label: 'DigiLocker', icon: FileCheck2, tone: 'bg-sky-50 text-sky-700', accent: 'from-sky-500/10' },
  PROPERTY: { label: 'Property', icon: Building2, tone: 'bg-navy-50 text-navy', accent: 'from-navy-500/10' },
  LICENCE: { label: 'Licence', icon: CreditCard, tone: 'bg-saffron-50 text-saffron-600', accent: 'from-saffron-500/10' },
  DOCUMENT: { label: 'Document', icon: FileText, tone: 'bg-slate-100 text-slate-600', accent: 'from-slate-500/10' },
};

const emptyForm = {
  type: 'DOCUMENT',
  title: '',
  issuer: '',
  credentialNumber: '',
  issuedAt: '',
  expiresAt: '',
};

export default function Wallet() {
  const toast = useToast();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const load = async () => {
    const { data } = await api.get('/credentials');
    setCredentials(data.credentials);
    return data.credentials;
  };

  useEffect(() => {
    load()
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (filter === 'ALL' ? credentials : credentials.filter((credential) => credential.type === filter)),
    [credentials, filter]
  );

  const stats = useMemo(() => {
    const verified = credentials.filter((credential) => credential.effectiveStatus === 'VERIFIED').length;
    const pending = credentials.filter((credential) => credential.effectiveStatus === 'PENDING').length;
    const expiring = credentials.filter((credential) => {
      const days = daysUntil(credential.expiresAt);
      return days !== null && days >= 0 && days <= 30;
    }).length;
    return { total: credentials.length, verified, pending, expiring };
  }, [credentials]);

  const openDetail = async (credential) => {
    setDetailOpen(true);
    setDetail(credential);
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/credentials/${credential.id}`);
      setDetail(data.credential);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setDetailLoading(false);
    }
  };

  const addCredential = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/credentials', {
        ...form,
        issuedAt: form.issuedAt || undefined,
        expiresAt: form.expiresAt || undefined,
      });
      toast.success('Credential added to your wallet.');
      setAddOpen(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const verify = async (credential) => {
    setVerifying(true);
    try {
      const { data } = await api.post(`/credentials/${credential.id}/verify`);
      toast.info(data.message);
      await load();
      if (detail?.id === credential.id) {
        const refreshed = await api.get(`/credentials/${credential.id}`);
        setDetail(refreshed.data.credential);
      }
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setVerifying(false);
    }
  };

  const remove = async (credential) => {
    if (!window.confirm(`Remove ${credential.title} from your wallet?`)) return;
    try {
      await api.delete(`/credentials/${credential.id}`);
      toast.success('Credential removed.');
      setDetailOpen(false);
      setDetail(null);
      await load();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Digital credential wallet"
        title="Your digital wallet"
        description="Aadhaar, DigiLocker access, property records, licences and supporting documents in one verified place."
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus size={16} /> Add credential
          </Button>
        }
      />

      <Alert type="info" title="Simulated verification" className="mb-5">
        This prototype does not connect to UIDAI, DigiLocker or live government registries. Verification runs in a
        clearly labelled sandbox and is not a legal identity check.
      </Alert>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total credentials', value: stats.total, icon: WalletCards, tone: 'bg-navy-50 text-navy' },
          { label: 'Verified', value: stats.verified, icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-700' },
          { label: 'Pending', value: stats.pending, icon: FileCheck2, tone: 'bg-saffron-50 text-saffron-600' },
          { label: 'Expiring in 30 days', value: stats.expiring, icon: ShieldCheck, tone: 'bg-rose-50 text-rose-600' },
        ].map((item) => (
          <Card key={item.label} className="flex items-center gap-3 p-4">
            <span className={cx('grid h-10 w-10 place-items-center rounded-xl', item.tone)}>
              <item.icon size={18} />
            </span>
            <div>
              <p className="text-lg font-extrabold text-navy">{item.value}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {[{ key: 'ALL', label: 'All credentials' }, ...Object.entries(typeConfig).map(([key, config]) => ({ key, label: config.label }))].map(
          (item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={cx(
                'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                filter === item.key ? 'bg-navy text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:text-navy'
              )}
            >
              {item.label}
            </button>
          )
        )}
      </div>

      {error && <Alert type="danger" className="mb-4">{error}</Alert>}

      {loading ? (
        <LoadingBlock label="Opening your wallet..." />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={WalletCards}
            title="No credentials in this category"
            description="Add a credential to keep your identity, property and licence records together."
            action={<Button size="sm" variant="soft" onClick={() => setAddOpen(true)}><Plus size={14} /> Add credential</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((credential) => {
            const config = typeConfig[credential.type] || typeConfig.DOCUMENT;
            const Icon = config.icon;
            const days = daysUntil(credential.expiresAt);
            const expiringSoon = days !== null && days >= 0 && days <= 30;
            return (
              <Card key={credential.id} className="relative overflow-hidden p-5">
                <div className={cx('absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent', config.accent)} />
                <div className="relative flex items-start justify-between">
                  <span className={cx('grid h-11 w-11 place-items-center rounded-xl', config.tone)}>
                    <Icon size={20} />
                  </span>
                  <Badge status={credential.effectiveStatus} />
                </div>
                <p className="relative mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  {config.label}
                </p>
                <h3 className="relative mt-1 text-[15px] font-bold leading-snug text-navy">{credential.title}</h3>
                <p className="relative text-xs text-slate-500">{credential.issuer}</p>

                <div className="relative mt-3 space-y-1 text-xs text-slate-500">
                  <p className="font-mono text-[11px] tracking-wide text-slate-600">
                    {credential.credentialNumber || 'No number recorded'}
                  </p>
                  <p>
                    {credential.expiresAt
                      ? `Valid until ${dateFmt(credential.expiresAt)}`
                      : credential.issuedAt
                        ? `Issued ${dateFmt(credential.issuedAt)}`
                        : 'No validity dates'}
                  </p>
                  {expiringSoon && (
                    <p className="font-semibold text-saffron-600">
                      {days === 0 ? 'Expires today' : `Expires in ${days} day${days === 1 ? '' : 's'}`}
                    </p>
                  )}
                </div>

                <div className="relative mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openDetail(credential)}>
                    View details
                  </Button>
                  {credential.effectiveStatus !== 'VERIFIED' && (
                    <Button size="sm" variant="soft" loading={verifying} onClick={() => verify(credential)}>
                      Verify
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add a credential"
        description="Store a document or record in your wallet. Verification is simulated for the prototype."
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button form="add-credential" type="submit" loading={saving}>Add to wallet</Button>
          </>
        }
      >
        <form id="add-credential" onSubmit={addCredential} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Credential type">
              <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="input">
                {Object.entries(typeConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Title">
              <input
                required
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="e.g. Driving Licence"
                className="input"
              />
            </Field>
          </div>
          <Field label="Issuer">
            <input
              required
              value={form.issuer}
              onChange={(event) => setForm({ ...form, issuer: event.target.value })}
              placeholder="e.g. Transport Department, Andhra Pradesh"
              className="input"
            />
          </Field>
          <Field label="Credential / document number">
            <input
              value={form.credentialNumber}
              onChange={(event) => setForm({ ...form, credentialNumber: event.target.value })}
              placeholder="Optional reference number"
              className="input"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Issued on">
              <input
                type="date"
                value={form.issuedAt}
                onChange={(event) => setForm({ ...form, issuedAt: event.target.value })}
                className="input"
              />
            </Field>
            <Field label="Expires on">
              <input
                type="date"
                value={form.expiresAt}
                onChange={(event) => setForm({ ...form, expiresAt: event.target.value })}
                className="input"
              />
            </Field>
          </div>
        </form>
      </Modal>

      <Modal
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetail(null);
        }}
        title={detail?.title || 'Credential'}
        description={detail ? `${typeConfig[detail.type]?.label || detail.type} · ${detail.issuer}` : ''}
        footer={
          detail && (
            <>
              <Button variant="ghost" onClick={() => remove(detail)} className="mr-auto text-rose-600 hover:bg-rose-50">
                <Trash2 size={14} /> Remove
              </Button>
              <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
              {detail.effectiveStatus !== 'VERIFIED' && (
                <Button loading={verifying} onClick={() => verify(detail)}>
                  <ShieldCheck size={15} /> Verify credential
                </Button>
              )}
            </>
          )
        }
      >
        {detailLoading || !detail ? (
          <LoadingBlock label="Loading credential..." />
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between rounded-xl bg-slate-50 p-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Status</p>
                <div className="mt-1"><Badge status={detail.effectiveStatus} /></div>
                <p className="mt-2 text-xs text-slate-500">
                  {detail.verifiedAt ? `Verified ${dateFmt(detail.verifiedAt)}` : 'Awaiting verification'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Number</p>
                <p className="mt-1 font-mono text-xs text-slate-600">{detail.credentialNumber || '—'}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-100 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Issued</p>
                <p className="mt-1 text-sm font-semibold text-navy">{dateFmt(detail.issuedAt)}</p>
              </div>
              <div className="rounded-xl border border-slate-100 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Expires</p>
                <p className="mt-1 text-sm font-semibold text-navy">{dateFmt(detail.expiresAt)}</p>
              </div>
            </div>

            {detail.metadata && Object.keys(detail.metadata).length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Record details</p>
                <div className="mt-1.5 divide-y divide-slate-100 rounded-xl border border-slate-100">
                  {Object.entries(detail.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-3 px-3.5 py-2.5 text-xs">
                      <span className="text-slate-500">{key}</span>
                      <span className="text-right font-medium text-navy">
                        {Array.isArray(value) ? value.join(', ') : typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Verification history</p>
              {detail.verifications?.length ? (
                <div className="mt-2 space-y-2">
                  {detail.verifications.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-2.5 rounded-xl border border-slate-100 px-3.5 py-2.5">
                      <ShieldCheck size={15} className="mt-0.5 text-teal-600" />
                      <div>
                        <p className="text-xs font-semibold text-navy">
                          {formatStatus(entry.status)} · {entry.method}
                        </p>
                        <p className="text-[11px] text-slate-500">{entry.remarks}</p>
                        <p className="text-[10px] text-slate-400">{dateTimeFmt(entry.verifiedAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 rounded-xl bg-slate-50 px-3.5 py-3 text-xs text-slate-500">
                  No verification attempts yet. Use the verify button to run the simulated check.
                </p>
              )}
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-[11px] leading-5 text-amber-800">
              <X size={13} className="mt-0.5 shrink-0" />
              Simulated verification only. Do not treat this status as a legal or government-issued validation.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
