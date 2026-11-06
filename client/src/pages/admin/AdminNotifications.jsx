import { useEffect, useMemo, useState } from 'react';
import { Bell, Megaphone, Plus, Search, Send, Trash2 } from 'lucide-react';
import api, { apiError } from '../../lib/api';
import { timeAgo } from '../../lib/format';
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
  { value: 'GENERAL', label: 'General' },
  { value: 'DUE_DATE', label: 'Due date' },
  { value: 'STATUS_UPDATE', label: 'Status update' },
  { value: 'PAYMENT', label: 'Payment' },
];

const emptyForm = {
  broadcast: true,
  userId: '',
  type: 'GENERAL',
  title: '',
  message: '',
  link: '',
};

export default function AdminNotifications() {
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [type, setType] = useState('ALL');
  const [composeOpen, setComposeOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [working, setWorking] = useState('');

  const load = async () => {
    const [notificationResponse, citizenResponse] = await Promise.all([
      api.get('/notifications/manage/all'),
      api.get('/admin/citizens'),
    ]);
    setNotifications(notificationResponse.data.notifications);
    setCitizens(citizenResponse.data.citizens);
  };

  useEffect(() => {
    load()
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(
    () => ({
      total: notifications.length,
      unread: notifications.filter((notification) => !notification.isRead).length,
      citizens: new Set(notifications.map((notification) => notification.userId)).size,
    }),
    [notifications]
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return notifications.filter((notification) => {
      const matchesType = type === 'ALL' || notification.type === type;
      const matchesQuery =
        !term ||
        notification.title.toLowerCase().includes(term) ||
        notification.message.toLowerCase().includes(term) ||
        notification.user?.fullName?.toLowerCase().includes(term) ||
        notification.user?.email?.toLowerCase().includes(term);
      return matchesType && matchesQuery;
    });
  }, [notifications, query, type]);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.broadcast && !form.userId) {
      toast.error('Choose a recipient or enable broadcast.');
      return;
    }
    setSending(true);
    try {
      const { data } = await api.post('/notifications', {
        broadcast: form.broadcast,
        userId: form.broadcast ? undefined : form.userId,
        type: form.type,
        title: form.title,
        message: form.message,
        link: form.link || undefined,
      });
      toast.success(data.message || 'Notification sent.');
      setComposeOpen(false);
      setForm({ ...emptyForm, userId: citizens[0]?.id || '' });
      await load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSending(false);
    }
  };

  const remove = async (notification) => {
    if (!window.confirm(`Delete “${notification.title}” for ${notification.user?.fullName}?`)) return;
    setWorking(notification.id);
    try {
      await api.delete(`/notifications/${notification.id}`);
      setNotifications((current) => current.filter((item) => item.id !== notification.id));
      toast.success('Notification deleted.');
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setWorking('');
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Citizen engagement"
        title="Notifications"
        description="Send targeted messages or broadcast announcements to every registered citizen."
        actions={
          <Button
            onClick={() => {
              setForm({ ...emptyForm, userId: citizens[0]?.id || '' });
              setComposeOpen(true);
            }}
          >
            <Plus size={15} /> Compose
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><Bell size={17} /></span>
          <div>
            <p className="text-lg font-extrabold text-navy">{stats.total}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Notifications sent</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-saffron-50 text-saffron-600"><Megaphone size={17} /></span>
          <div>
            <p className="text-lg font-extrabold text-navy">{stats.unread}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Still unread</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-700"><Send size={17} /></span>
          <div>
            <p className="text-lg font-extrabold text-navy">{stats.citizens}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Citizens reached</p>
          </div>
        </Card>
      </div>

      <Card className="mb-4 p-4">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, message or citizen"
            className="input pl-10"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[{ value: 'ALL', label: 'All' }, ...types].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setType(item.value)}
              className={cx(
                'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                type === item.value ? 'bg-navy text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:text-navy'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Card>

      {error && <Alert type="danger" className="mb-4">{error}</Alert>}

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingBlock label="Loading notifications..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications found"
            description="Compose a message or adjust the filters to see earlier sends."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Message</th>
                  <th>Recipient</th>
                  <th>Type</th>
                  <th>Read</th>
                  <th>Sent</th>
                  <th className="text-right">Delete</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((notification) => (
                  <tr key={notification.id} className="transition hover:bg-slate-50/70">
                    <td className="max-w-[320px]">
                      <p className="text-sm font-bold text-navy">{notification.title}</p>
                      <p className="truncate text-[11px] text-slate-500">{notification.message}</p>
                    </td>
                    <td>
                      <p className="text-xs text-slate-700">{notification.user?.fullName}</p>
                      <p className="text-[10px] text-slate-400">{notification.user?.email}</p>
                    </td>
                    <td><Badge status={notification.type} /></td>
                    <td>
                      <Badge status={notification.isRead ? 'SUCCESS' : 'PENDING'}>
                        {notification.isRead ? 'Read' : 'Unread'}
                      </Badge>
                    </td>
                    <td className="text-xs text-slate-500">{timeAgo(notification.createdAt)}</td>
                    <td className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={working === notification.id}
                        onClick={() => remove(notification)}
                        className="text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        title="Compose notification"
        description="Broadcasts are delivered to every active citizen immediately."
        footer={
          <>
            <Button variant="ghost" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button form="notify-form" type="submit" loading={sending}>
              <Send size={15} /> Send notification
            </Button>
          </>
        }
      >
        <form id="notify-form" onSubmit={submit} className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setForm({ ...form, broadcast: true })}
              className={cx(
                'rounded-xl border px-3.5 py-3 text-left transition',
                form.broadcast ? 'border-teal-300 bg-teal-50' : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <p className="text-xs font-bold text-navy">Broadcast to all</p>
              <p className="text-[11px] text-slate-500">Every active citizen receives it</p>
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, broadcast: false })}
              className={cx(
                'rounded-xl border px-3.5 py-3 text-left transition',
                !form.broadcast ? 'border-teal-300 bg-teal-50' : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <p className="text-xs font-bold text-navy">Single citizen</p>
              <p className="text-[11px] text-slate-500">Target one registered account</p>
            </button>
          </div>

          {!form.broadcast && (
            <Field label="Recipient">
              <select
                value={form.userId}
                onChange={(event) => setForm({ ...form, userId: event.target.value })}
                className="input"
              >
                {citizens.map((citizen) => (
                  <option key={citizen.id} value={citizen.id}>
                    {citizen.fullName} · {citizen.email}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type">
              <select
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value })}
                className="input"
              >
                {types.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Link (optional)" hint="In-app path, for example /app/payments">
              <input
                value={form.link}
                onChange={(event) => setForm({ ...form, link: event.target.value })}
                placeholder="/app/applications"
                className="input"
              />
            </Field>
          </div>

          <Field label="Title">
            <input
              required
              maxLength={140}
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="e.g. Water tariff subsidy window opens"
              className="input"
            />
          </Field>

          <Field label="Message">
            <textarea
              required
              maxLength={1000}
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
              className="textarea"
              rows={4}
              placeholder="Write a clear, actionable message for citizens."
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
