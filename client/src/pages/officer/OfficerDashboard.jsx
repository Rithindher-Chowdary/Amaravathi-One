import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileSearch,
  MessageSquareWarning,
  RefreshCw,
  Users,
} from 'lucide-react';
import api, { apiError } from '../../lib/api';
import { dateFmt, formatStatus, timeAgo } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import { Alert, Badge, Card, LoadingBlock, PageHeader, StatCard } from '../../components/ui';

export default function OfficerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/officer/dashboard')
      .then(({ data: payload }) => setData(payload))
      .catch((err) => setError(apiError(err)));
  }, []);

  if (error) return <Alert type="danger">{error}</Alert>;
  if (!data) return <LoadingBlock label="Loading your work queue..." />;

  const { stats, recentApplications, recentActivity } = data;
  const firstName = user?.fullName?.split(' ')[0] || 'Officer';

  return (
    <div>
      <PageHeader
        eyebrow="Officer workbench"
        title={`Good to see you, ${firstName}`}
        description="Review assigned applications, verify documents and move files toward a clear decision."
        actions={
          <Link
            to="/officer/applications"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-navy px-4 text-sm font-semibold text-white transition hover:bg-navy-700"
          >
            <ClipboardList size={15} /> Open work queue
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Assigned to you" value={stats.assigned} icon={Users} tone="navy" hint="Total case load" />
        <StatCard label="Awaiting action" value={stats.pending} icon={Clock} tone="saffron" hint="Submitted, verified or under review" />
        <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} tone="emerald" hint="Cleared by you" />
        <StatCard label="Corrections requested" value={stats.corrections} icon={MessageSquareWarning} tone="rose" hint="Waiting on citizens" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-navy">Recent assignments</h2>
              <p className="text-xs text-slate-500">Latest applications routed to your desk</p>
            </div>
            <Link to="/officer/applications" className="text-xs font-semibold text-teal-700 hover:underline">
              View queue
            </Link>
          </div>
          {recentApplications.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <FileSearch size={26} className="mx-auto text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-navy">No applications assigned</p>
              <p className="text-xs text-slate-500">New assignments from administrators will appear here.</p>
            </div>
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
                        <Link
                          to={`/officer/applications/${application.id}`}
                          className="font-bold text-navy hover:text-teal-700"
                        >
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

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="text-sm font-bold text-navy">Your recent decisions</h2>
            <p className="text-xs text-slate-500">Every status change you recorded</p>
            <div className="mt-3 space-y-3">
              {recentActivity.map((entry) => (
                <div key={entry.id} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700">
                    <RefreshCw size={13} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-navy">
                      {entry.application?.referenceNo || 'Application'} · {formatStatus(entry.status)}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">{entry.remarks || 'No remarks recorded'}</p>
                    <p className="text-[10px] text-slate-400">{timeAgo(entry.createdAt)}</p>
                  </div>
                </div>
              ))}
              {!recentActivity.length && (
                <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-xs text-slate-400">
                  No decisions recorded yet.
                </p>
              )}
            </div>
          </Card>

          <Card className="border-teal-100 bg-teal-50/40 p-5">
            <h2 className="text-sm font-bold text-navy">Service standard</h2>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Aim to action every application within its published processing window. Request a correction only when a
              document is genuinely unclear, and always leave a useful remark for the citizen.
            </p>
            <Link to="/officer/applications" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline">
              Review pending files <ArrowRight size={13} />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
