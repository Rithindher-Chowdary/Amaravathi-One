import { useEffect, useMemo, useState } from 'react';
import {
  BellRing,
  CalendarClock,
  CheckCircle2,
  Clock,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import api, { apiError } from '../../lib/api';
import { dateFmt, daysUntil, dueLabel, inr } from '../../lib/format';
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

const types = [
  { value: 'PROPERTY_TAX', label: 'Property tax' },
  { value: 'LICENCE_EXPIRY', label: 'Licence expiry' },
  { value: 'APPLICATION_ACTION', label: 'Application action' },
  { value: 'PAYMENT_DEADLINE', label: 'Payment deadline' },
  { value: 'DOCUMENT_EXPIRY', label: 'Document expiry' },
];

const typeLabel = (value) => types.find((entry) => entry.value === value)?.label || value;

const emptyForm = {
  userId: '',
  type: 'PROPERTY_TAX',
  title: '',
  description: '',
  dueDate: '',
  amount: '',
  referenceId: '',
};

export default function AdminDueDates() {
  const toast = useToast();
  const [dueDates, setDueDates] = useState([]);
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [working, setWorking] = useState('');
  const [reminders, setReminders] = useState(false);

  const load = async () => {
    const [dueResponse, citizenResponse] = await Promise.all([
      api.get('/due-dates/manage/all'),
      api.get('/admin/citizens'),
    ]);
    setDueDates(dueResponse.data.dueDates);
    setCitizens(citizenResponse.data.citizens);
  };

  useEffect(() => {
    load()
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const open = dueDates.filter((due) => !due.isCompleted);
    const overdue = open.filter((due) => daysUntil(due.dueDate) < 0);
    const soon = open.filter((due) => {
      const days = daysUntil(due.dueDate);
      return days >= 0 && days <= 7;
    });
    return {
      total: dueDates.length,
      open: open.length,
      overdue: overdue.length,
      soon: soon.length,
      completed: dueDates.filter((due) => due.isCompleted).length,
      outstanding: open.reduce((sum, due) => sum + Number(due.amount || 0), 0),
    };
  }, [dueDates]);

  const filtered = useMemo(() => {
    return dueDates.filter((due) => {
      if (filter === 'COMPLETED') return due.isCompleted;
      if (filter === 'OVERDUE') return !due.isCompleted && daysUntil(due.dueDate) < 0;
      if (filter === 'SOON') {
        const days = daysUntil(due.dueDate);
        return !due.isCompleted && days >= 0 && days <= 7;
      }
      if (filter === 'OPEN') return !due.isCompleted;
      return true;
    });
  }, [dueDates, filter]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, userId: citizens[0]?.id || '' });
    setFormOpen(true);
  };

  const openEdit = (due) => {
    setEditing(due);
    setForm({
      userId: due.userId,
      type: due.type,
      title: due.title,
      description: due.description || '',
      dueDate: due.dueDate ? due.dueDate.slice(0, 10) : '',
      amount: due.amount ?? '',
      referenceId: due.referenceId || '',
    });
    setFormOpen(true);
  };

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    if (!editing && !form.userId) {
      toast.error('Choose a citizen for this reminder.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/due-dates/${editing.id}`, {
          type: form.type,
          title: form.title,
          description: form.description || null,
          dueDate: form.dueDate,
          amount: form.amount === '' ? null : Number(form.amount),
        });
        toast.success('Reminder updated.');
      } else {
        await api.post('/due-dates', {
          userId: form.userId,
          type: form.type,
          title: form.title,
          description: form.description || undefined,
          dueDate: form.dueDate,
          amount: form.amount === '' ? null : Number(form.amount),
          referenceId: form.referenceId || undefined,
        });
        toast.success('Due-date reminder created.');
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const complete = async (due) => {
    setWorking(due.id);
    try {
      await api.patch(`/due-dates/${due.id}/complete`);
      setDueDates((current) => current.map((item) => (item.id === due.id ? { ...item, isCompleted: true } : item)));
      toast.success('Reminder marked complete.');
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setWorking('');
    }
  };

  const remove = async (due) => {
    if (!window.confirm(`Delete the reminder “${due.title}”?`)) return;
    setWorking(due.id);
    try {
      await api.delete(`/due-dates/${due.id}`);
      setDueDates((current) => current.filter((item) => item.id !== due.id));
      toast.success('Reminder deleted.');
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setWorking('');
    }
  };

  const runReminders = async () => {
    setReminders(true);
    try {
      const { data } = await api.post('/due-dates/run-reminders?days=7');
      toast.info(data.message);
      await load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setReminders(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Proactive nudges"
        title="Due dates and reminders"
        description="Create statutory and service obligations, then nudge citizens before deadlines slip."
        actions={
          <>
            <Button variant="outline" onClick={runReminders} loading={reminders}>
              <RefreshCw size={15} /> Run 7-day reminders
            </Button>
            <Button onClick={openCreate} disabled={!citizens.length}>
              <Plus size={15} /> New reminder
            </Button>
          </>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Total reminders', value: stats.total, icon: CalendarClock },
          { label: 'Open', value: stats.open, icon: BellRing },
          { label: 'Overdue', value: stats.overdue, icon: Clock },
          { label: 'Due in 7 days', value: stats.soon, icon: BellRing },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2 },
        ].map((item) => (
          <Card key={item.label} className="flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
              <item.icon size={17} />
            </span>
            <div>
              <p className="text-lg font-extrabold text-navy">{item.value}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mb-4 flex flex-wrap items-center gap-2 p-4">
        {[
          { key: 'ALL', label: 'All' },
          { key: 'OPEN', label: 'Open' },
          { key: 'OVERDUE', label: 'Overdue' },
          { key: 'SOON', label: 'Due soon' },
          { key: 'COMPLETED', label: 'Completed' },
        ].map((item) => (
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
        ))}
        <p className="ml-auto text-xs font-semibold text-slate-500">
          Outstanding: <span className="text-navy">{inr(stats.outstanding)}</span>
        </p>
      </Card>

      {error && <Alert type="danger" className="mb-4">{error}</Alert>}
      {!citizens.length && !loading && (
        <Alert type="warning" title="No citizens available" className="mb-4">
          Reminders must target a registered citizen. Add a citizen account before creating new obligations.
        </Alert>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingBlock label="Loading reminders..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No reminders in this view"
            description="Create an obligation or switch filters to see existing due dates."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Reminder</th>
                  <th>Citizen</th>
                  <th>Type</th>
                  <th>Due</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((due) => {
                  const days = daysUntil(due.dueDate);
                  const overdue = !due.isCompleted && days < 0;
                  return (
                    <tr key={due.id} className="transition hover:bg-slate-50/70">
                      <td>
                        <p className="text-sm font-bold text-navy">{due.title}</p>
                        <p className="text-[10px] text-slate-400">{due.referenceId || 'No reference'}</p>
                      </td>
                      <td>
                        <p className="text-xs text-slate-700">{due.user?.fullName}</p>
                        <p className="text-[10px] text-slate-400">{due.user?.email}</p>
                      </td>
                      <td className="text-xs text-slate-600">{typeLabel(due.type)}</td>
                      <td>
                        <p className="text-xs text-slate-600">{dateFmt(due.dueDate)}</p>
                        <p className={cx('text-[10px] font-semibold', overdue ? 'text-rose-600' : 'text-slate-400')}>
                          {due.isCompleted ? 'Completed' : dueLabel(due.dueDate)}
                        </p>
                      </td>
                      <td className="text-xs font-semibold text-navy">{due.amount ? inr(due.amount) : '—'}</td>
                      <td><Badge status={due.isCompleted ? 'SUCCESS' : overdue ? 'FAILED' : 'PENDING'} /></td>
                      <td className="whitespace-nowrap text-right">
                        {!due.isCompleted && (
                          <Button size="sm" variant="ghost" loading={working === due.id} onClick={() => complete(due)}>
                            <CheckCircle2 size={13} /> Complete
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => openEdit(due)}>
                          <Pencil size={13} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={working === due.id}
                          onClick={() => remove(due)}
                          className="text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit reminder' : 'Create a due-date reminder'}
        description="Citizens receive an in-app notification and the reminder appears on their dashboard."
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button form="due-form" type="submit" loading={saving}>{editing ? 'Save reminder' : 'Create reminder'}</Button>
          </>
        }
      >
        <form id="due-form" onSubmit={submit} className="space-y-4">
          <Field label="Citizen">
            <select value={form.userId} onChange={set('userId')} disabled={Boolean(editing)} className="input">
              {citizens.map((citizen) => (
                <option key={citizen.id} value={citizen.id}>
                  {citizen.fullName} · {citizen.email}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Reminder type">
              <select value={form.type} onChange={set('type')} className="input">
                {types.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Due date">
              <input required type="date" value={form.dueDate} onChange={set('dueDate')} className="input" />
            </Field>
          </div>
          <Field label="Title">
            <input required value={form.title} onChange={set('title')} placeholder="e.g. Q3 property tax payment" className="input" />
          </Field>
          <Field label="Description" hint="Optional context shown in the notification">
            <textarea value={form.description} onChange={set('description')} className="textarea" rows={2} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount (INR)" hint="Leave blank if no payment is due">
              <input type="number" min="0" step="1" value={form.amount} onChange={set('amount')} className="input" />
            </Field>
            <Field label="Reference ID">
              <input value={form.referenceId} onChange={set('referenceId')} placeholder="e.g. AMA-2026-002" className="input" />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
