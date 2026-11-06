import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Clock,
  Landmark,
  Megaphone,
  Users,
  UserCog,
} from 'lucide-react';
import api, { apiError } from '../../lib/api';
import { dateFmt, formatStatus, inr, timeAgo } from '../../lib/format';
import { Alert, Badge, Card, LoadingBlock, PageHeader, StatCard } from '../../components/ui';

const statusTone = {
  SUBMITTED: 'bg-sky-500',
  DOCUMENTS_VERIFIED: 'bg-cyan-500',
  UNDER_REVIEW: 'bg-amber-500',
  CORRECTION_REQUESTED: 'bg-orange-500',
  APPROVED: 'bg-emerald-500',
  REJECTED: 'bg-rose-500',
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then(({ data: payload }) => setData(payload))
      .catch((err) => setError(apiError(err)));
  }, []);

  if (error) return <Alert type="danger">{error}</Alert>;
  if (!data) return <LoadingBlock label="Loading administrator overview..." />;

  const { stats, statusGroups, recentApplications, recentActivity } = data;
  const totalForBars = statusGroups.reduce((sum, row) => sum + row.count, 0) || 1;

  return (
    <div>
      <PageHeader
        eyebrow="Administrator console"
        title="State of Amaravati One"
        description="Live view of citizens, service delivery, payments and officer workload across the APCRDA pilot."
        actions={
          <>
            <Link
              to="/admin/reports"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-navy transition hover:bg-slate-50"
            >
              <BarChart3 size={15} /> Reports
            </Link>
            <Link
              to="/admin/applications"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-navy px-4 text-sm font-semibold text-white transition hover:bg-navy-700"
            >
              All applications <ArrowRight size={15} />
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Registered citizens" value={stats.citizenCount} icon={Users} tone="teal" hint="Active citizen accounts" />
        <StatCard label="Service officers" value={stats.officerCount} icon={UserCog} tone="navy" hint="Handling assigned applications" />
        <StatCard label="Total applications" value={stats.totalApplications} icon={ClipboardList} tone="sky" hint={`${stats.pendingApplications} in the pipeline`} />
        <StatCard label="Approved" value={stats.approvedApplications} icon={CheckCircle2} tone="emerald" hint="Successfully delivered services" />
        <StatCard label="Payments received" value={inr(stats.paymentsReceived)} icon={CircleDollarSign} tone="teal" hint={`${stats.successfulPayments} successful transactions`} />
        <StatCard label="Outstanding fees" value={inr(stats.outstandingAmount)} icon={Clock} tone="saffron" hint={`${stats.pendingPayments} payments pending`} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-navy">Application pipeline</h2>
              <p className="text-xs text-slate-500">Distribution across every workflow stage</p>
            </div>
            <Badge status="GENERAL" className="normal-case">{stats.totalApplications} total</Badge>
          </div>
          <div className="space-y-3">
            {statusGroups.map((row) => (
              <div key={row.status}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">{formatStatus(row.status)}</span>
                  <span className="font-bold text-navy">{row.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${statusTone[row.status] || 'bg-navy'}`}
                    style={{ width: `${Math.max(4, (row.count / totalForBars) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {!statusGroups.length && <p className="text-xs text-slate-400">No applications yet.</p>}
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <SmallStat label="Unassigned" value={stats.unassigned} />
            <SmallStat label="Approved" value={stats.approvedApplications} />
            <SmallStat label="Rejected" value={stats.rejectedApplications} />
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-navy">Quick actions</h2>
              <p className="text-xs text-slate-500">Jump into common admin tasks</p>
            </div>
          </div>
          <div className="grid gap-2">
            <QuickAction to="/admin/citizens" icon={Users} title="Citizen directory" hint="Search, verify and manage accounts" />
            <QuickAction to="/admin/services" icon={Landmark} title="Service catalogue" hint="Publish fees and document checklists" />
            <QuickAction to="/admin/due-dates" icon={CalendarClock} title="Due-date reminders" hint="Create obligations and run nudges" />
            <QuickAction to="/admin/notifications" icon={Megaphone} title="Broadcast notice" hint="Message every citizen instantly" />
            <QuickAction to="/admin/reports" icon={BarChart3} title="Performance reports" hint="Revenue, demand and utilisation" />
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-navy">Latest applications</h2>
              <p className="text-xs text-slate-500">Newest submissions across all services</p>
            </div>
            <Link to="/admin/applications" className="text-xs font-semibold text-teal-700 hover:underline">
              View all
            </Link>
          </div>
          {recentApplications.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">No applications yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Citizen</th>
                    <th>Service</th>
                    <th>Submitted</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApplications.map((application) => (
                    <tr key={application.id}>
                      <td>
                        <Link to={`/admin/applications/${application.id}`} className="font-bold text-navy hover:text-teal-700">
                          {application.referenceNo}
                        </Link>
                      </td>
                      <td className="text-slate-600">{application.user?.fullName}</td>
                      <td className="text-slate-600">{application.service?.name}</td>
                      <td className="text-slate-500">{dateFmt(application.submittedAt || application.createdAt)}</td>
                      <td><Badge status={application.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-navy">Recent activity</h2>
              <p className="text-xs text-slate-500">Administrative and workflow events</p>
            </div>
          </div>
          <div className="space-y-3">
            {recentActivity.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                  <ClipboardList size={14} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-navy">
                    {formatStatus(entry.action)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {entry.user?.fullName || 'System'} · {entry.entity}
                  </p>
                  <p className="text-[10px] text-slate-400">{timeAgo(entry.createdAt)}</p>
                </div>
                <ArrowUpRight size={13} className="ml-auto mt-1 shrink-0 text-slate-300" />
              </div>
            ))}
            {!recentActivity.length && <p className="text-xs text-slate-400">No activity recorded yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function SmallStat({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-base font-extrabold text-navy">{value}</p>
    </div>
  );
}

function QuickAction({ to, icon: Icon, title, hint }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border border-slate-100 px-3.5 py-2.5 transition hover:border-teal-200 hover:bg-teal-50/40"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700">
        <Icon size={16} />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-bold text-navy">{title}</span>
        <span className="block truncate text-[11px] text-slate-500">{hint}</span>
      </span>
      <ArrowRight size={14} className="ml-auto shrink-0 text-slate-300" />
    </Link>
  );
}
