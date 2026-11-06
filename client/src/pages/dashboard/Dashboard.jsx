import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Plus,
  Wallet,
} from 'lucide-react';
import api, { apiError } from '../../lib/api';
import { dateFmt, dueLabel, formatStatus, inr, timeAgo, daysUntil } from '../../lib/format';
import { Alert, Badge, Card, EmptyState, LoadingBlock, PageHeader, StatCard } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard')
      .then(({ data: payload }) => setData(payload))
      .catch((err) => setError(apiError(err)));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.fullName?.split(' ').slice(-1)[0] || 'citizen';

  if (error) {
    return <Alert type="danger" title="Could not load dashboard">{error}</Alert>;
  }

  if (!data) return <LoadingBlock label="Loading your dashboard..." />;

  const { stats, recentApplications, upcomingDueDates, recentActivity, recentNotifications } = data;

  return (
    <div>
      <PageHeader
        eyebrow="Citizen dashboard"
        title={`${greeting}, ${firstName}`}
        description="Here is everything happening across your Amaravati One account today."
        actions={
          <>
            <Link to="/app/services">
              <span className="inline-flex h-11 items-center gap-2 rounded-xl bg-navy px-4 text-sm font-semibold text-white transition hover:bg-navy-700">
                <Plus size={16} /> New application
              </span>
            </Link>
            <Link to="/app/wallet">
              <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-navy transition hover:bg-slate-50">
                <Wallet size={16} /> Open wallet
              </span>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Applications" value={stats.totalApplications} icon={FileText} tone="navy" hint="All time" />
        <StatCard
          label="Pending"
          value={stats.pendingApplications}
          icon={Clock}
          tone="saffron"
          hint="Awaiting action or review"
        />
        <StatCard label="Approved" value={stats.approvedApplications} icon={CheckCircle2} tone="emerald" hint="Completed successfully" />
        <StatCard
          label="Payments pending"
          value={stats.pendingPayments}
          icon={CreditCard}
          tone="teal"
          hint={stats.pendingAmount ? `${inr(stats.pendingAmount)} outstanding` : 'Nothing outstanding'}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center justify-between p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Wallet credentials</p>
            <p className="mt-1 text-lg font-extrabold text-navy">
              {stats.credentialCount}{' '}
              <span className="text-xs font-medium text-slate-400">({stats.verifiedCredentialCount} verified)</span>
            </p>
          </div>
          <Link to="/app/wallet" className="text-teal-700 hover:text-teal-600">
            <ArrowRight size={18} />
          </Link>
        </Card>
        <Card className="flex items-center justify-between p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Unread notifications</p>
            <p className="mt-1 text-lg font-extrabold text-navy">{stats.unreadNotifications}</p>
          </div>
          <Link to="/app/notifications" className="text-teal-700 hover:text-teal-600">
            <ArrowRight size={18} />
          </Link>
        </Card>
        <Card className="flex items-center justify-between p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Fees paid</p>
            <p className="mt-1 text-lg font-extrabold text-navy">{inr(stats.paidAmount)}</p>
          </div>
          <Link to="/app/payments" className="text-teal-700 hover:text-teal-600">
            <ArrowRight size={18} />
          </Link>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.55fr_0.95fr]">
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-navy">Recent applications</h2>
                <p className="text-xs text-slate-400">Latest submissions and their current stage</p>
              </div>
              <Link to="/app/applications" className="text-xs font-bold text-teal-700 hover:text-teal-600">
                View all
              </Link>
            </div>
            {recentApplications.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No applications yet"
                description="Browse the service directory to submit your first application."
                action={
                  <Link to="/app/services" className="text-xs font-bold text-teal-700">
                    Explore services
                  </Link>
                }
              />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Service</th>
                      <th>Submitted</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentApplications.map((application) => (
                      <tr key={application.id} className="transition hover:bg-slate-50/70">
                        <td>
                          <Link to={`/app/applications/${application.id}`} className="font-bold text-navy hover:text-teal-700">
                            {application.referenceNo}
                          </Link>
                        </td>
                        <td>
                          <p className="font-medium text-navy">{application.service?.name}</p>
                          <p className="text-xs text-slate-400">{application.service?.category}</p>
                        </td>
                        <td className="text-slate-500">{dateFmt(application.submittedAt)}</td>
                        <td><Badge status={application.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-navy">Upcoming due dates</h2>
                <p className="text-xs text-slate-400">Taxes, fees, licence and document expiry</p>
              </div>
              <Link to="/app/notifications" className="text-xs font-bold text-teal-700 hover:text-teal-600">
                Reminders
              </Link>
            </div>
            {upcomingDueDates.length === 0 ? (
              <EmptyState icon={CalendarClock} title="No upcoming deadlines" description="You are all caught up." />
            ) : (
              <div className="divide-y divide-slate-100">
                {upcomingDueDates.map((due) => {
                  const days = daysUntil(due.dueDate);
                  const urgent = days !== null && days <= 3;
                  return (
                    <div key={due.id} className="flex items-start gap-3 px-5 py-3.5">
                      <span
                        className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                          urgent ? 'bg-rose-50 text-rose-600' : 'bg-saffron-50 text-saffron-600'
                        }`}
                      >
                        <CalendarClock size={17} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-navy">{due.title}</p>
                        <p className="text-xs text-slate-400">
                          {dueLabel(due.dueDate)}
                          {due.amount ? ` · ${inr(due.amount)}` : ''}
                        </p>
                      </div>
                      <span className={`text-[11px] font-bold ${urgent ? 'text-rose-600' : 'text-slate-400'}`}>
                        {dateFmt(due.dueDate)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-bold text-navy">Notifications</h2>
              <Link to="/app/notifications" className="text-xs font-bold text-teal-700 hover:text-teal-600">
                See all
              </Link>
            </div>
            {recentNotifications.length === 0 ? (
              <EmptyState icon={Bell} title="No notifications" />
            ) : (
              <div className="divide-y divide-slate-100">
                {recentNotifications.map((notification) => (
                  <Link
                    key={notification.id}
                    to="/app/notifications"
                    className="flex gap-3 px-5 py-3.5 transition hover:bg-slate-50/70"
                  >
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal" style={{ opacity: notification.isRead ? 0.25 : 1 }} />
                    <div>
                      <p className="text-sm font-semibold leading-5 text-navy">{notification.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500">{notification.message}</p>
                      <p className="mt-1 text-[10px] text-slate-400">{timeAgo(notification.createdAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-bold text-navy">Recent activity</h2>
              <p className="text-xs text-slate-400">Status changes on your applications</p>
            </div>
            {recentActivity.length === 0 ? (
              <EmptyState icon={Clock} title="No activity yet" />
            ) : (
              <div className="px-5 py-4">
                <div className="relative space-y-4 before:absolute before:bottom-1 before:left-[7px] before:top-1 before:w-px before:bg-slate-200">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="relative flex gap-3">
                      <span className="relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white bg-teal ring-1 ring-teal-200" />
                      <div>
                        <p className="text-xs font-bold text-navy">
                          {formatStatus(activity.status)} · {activity.application?.referenceNo}
                        </p>
                        <p className="text-[11px] text-slate-500">{activity.application?.service?.name}</p>
                        <p className="text-[10px] text-slate-400">{timeAgo(activity.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
