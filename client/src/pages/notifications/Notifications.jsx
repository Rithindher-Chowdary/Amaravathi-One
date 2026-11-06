import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellRing, CheckCheck, Clock, CreditCard, Megaphone, RefreshCw } from 'lucide-react';
import api, { apiError } from '../../lib/api';
import { timeAgo } from '../../lib/format';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  LoadingBlock,
  PageHeader,
  cx,
} from '../../components/ui';
import { useToast } from '../../components/Toast';

const typeConfig = {
  DUE_DATE: { icon: Clock, tone: 'bg-saffron-50 text-saffron-600', label: 'Due date' },
  STATUS_UPDATE: { icon: BellRing, tone: 'bg-teal-50 text-teal-700', label: 'Status update' },
  PAYMENT: { icon: CreditCard, tone: 'bg-emerald-50 text-emerald-700', label: 'Payment' },
  GENERAL: { icon: Megaphone, tone: 'bg-sky-50 text-sky-700', label: 'Announcement' },
};

export default function Notifications() {
  const toast = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [working, setWorking] = useState(false);

  const load = async () => {
    const { data } = await api.get('/notifications');
    setNotifications(data.notifications);
    setUnread(data.unread);
  };

  useEffect(() => {
    load()
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (filter === 'UNREAD' ? notifications.filter((item) => !item.isRead) : notifications),
    [notifications, filter]
  );

  const markAll = async () => {
    setWorking(true);
    try {
      await api.post('/notifications/read-all');
      await load();
      toast.success('All notifications marked as read.');
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setWorking(false);
    }
  };

  const openNotification = async (notification) => {
    if (!notification.isRead) {
      try {
        await api.patch(`/notifications/${notification.id}/read`);
        setNotifications((current) =>
          current.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item))
        );
        setUnread((count) => Math.max(0, count - 1));
      } catch (err) {
        toast.error(apiError(err));
      }
    }
    if (notification.link) navigate(notification.link);
  };

  const generateReminders = async () => {
    setWorking(true);
    try {
      const { data } = await api.post('/due-dates/remind-me');
      toast.info(data.message);
      await load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setWorking(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Alert centre"
        title="Notifications"
        description="Status changes, payment receipts, announcements and due-date reminders in one feed."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={generateReminders} loading={working}>
              <RefreshCw size={15} /> Check due dates
            </Button>
            <Button onClick={markAll} disabled={!unread || working}>
              <CheckCheck size={15} /> Mark all read
            </Button>
          </div>
        }
      />

      {error && <Alert type="danger" className="mb-4">{error}</Alert>}

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {[
          { key: 'ALL', label: `All (${notifications.length})` },
          { key: 'UNREAD', label: `Unread (${unread})` },
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
        <span className="ml-auto text-[11px] font-medium text-slate-400">Showing the last 100 notifications</span>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingBlock label="Loading your alerts..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={filter === 'UNREAD' ? 'You are all caught up' : 'No notifications yet'}
            description={
              filter === 'UNREAD'
                ? 'Every notification has been read. New updates will appear here instantly.'
                : 'Submit an application, make a payment or let a due date approach to receive alerts.'
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((notification) => {
              const config = typeConfig[notification.type] || typeConfig.GENERAL;
              const Icon = config.icon;
              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => openNotification(notification)}
                    className={cx(
                      'flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-slate-50/80 sm:px-5',
                      !notification.isRead && 'bg-teal-50/30'
                    )}
                  >
                    <span className={cx('mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl', config.tone)}>
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-navy">{notification.title}</span>
                        {!notification.isRead && <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />}
                        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          {config.label}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-slate-500">{notification.message}</span>
                      <span className="mt-1 flex items-center gap-2 text-[10px] font-medium text-slate-400">
                        {timeAgo(notification.createdAt)}
                        {notification.link && <span className="text-teal-700">· Open →</span>}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
