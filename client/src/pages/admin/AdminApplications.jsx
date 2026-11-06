import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, FileSearch, Search, UserCheck } from 'lucide-react';
import api, { apiError } from '../../lib/api';
import { dateFmt, formatStatus } from '../../lib/format';
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  LoadingBlock,
  PageHeader,
  cx,
} from '../../components/ui';

const statuses = [
  'ALL',
  'SUBMITTED',
  'DOCUMENTS_VERIFIED',
  'UNDER_REVIEW',
  'CORRECTION_REQUESTED',
  'APPROVED',
  'REJECTED',
];

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');

  useEffect(() => {
    api
      .get('/admin/applications')
      .then(({ data }) => setApplications(data.applications))
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const map = { ALL: applications.length };
    for (const application of applications) {
      map[application.status] = (map[application.status] || 0) + 1;
    }
    return map;
  }, [applications]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return applications.filter((application) => {
      const matchesStatus = status === 'ALL' || application.status === status;
      const matchesQuery =
        !term ||
        application.referenceNo.toLowerCase().includes(term) ||
        application.user?.fullName?.toLowerCase().includes(term) ||
        application.service?.name?.toLowerCase().includes(term);
      return matchesStatus && matchesQuery;
    });
  }, [applications, query, status]);

  return (
    <div>
      <PageHeader
        eyebrow="Application operations"
        title="All applications"
        description="Track every service request, its assigned officer and current workflow stage."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><ClipboardList size={17} /></span>
          <div>
            <p className="text-lg font-extrabold text-navy">{applications.length}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Total applications</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-saffron-50 text-saffron-600"><FileSearch size={17} /></span>
          <div>
            <p className="text-lg font-extrabold text-navy">{(counts.SUBMITTED || 0) + (counts.UNDER_REVIEW || 0) + (counts.DOCUMENTS_VERIFIED || 0)}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">In the pipeline</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-600"><UserCheck size={17} /></span>
          <div>
            <p className="text-lg font-extrabold text-navy">{applications.filter((application) => !application.assignedOfficer).length}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Awaiting officer assignment</p>
          </div>
        </Card>
      </div>

      <Card className="mb-4 p-4">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by reference, citizen or service"
            className="input pl-10"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {statuses.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={cx(
                'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                status === item ? 'bg-navy text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:text-navy'
              )}
            >
              {item === 'ALL' ? 'All' : formatStatus(item)} <span className="opacity-60">({counts[item] || 0})</span>
            </button>
          ))}
        </div>
      </Card>

      {error && <Alert type="danger" className="mb-4">{error}</Alert>}

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingBlock label="Loading applications..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No applications match"
            description="Try clearing the search or choosing a different workflow stage."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Citizen</th>
                  <th>Service</th>
                  <th>Officer</th>
                  <th>Docs</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((application) => (
                  <tr key={application.id} className="transition hover:bg-slate-50/70">
                    <td>
                      <Link to={`/admin/applications/${application.id}`} className="font-bold text-navy hover:text-teal-700">
                        {application.referenceNo}
                      </Link>
                    </td>
                    <td>
                      <p className="text-sm text-slate-700">{application.user?.fullName}</p>
                      <p className="text-[10px] text-slate-400">{application.user?.email}</p>
                    </td>
                    <td>
                      <p className="text-sm text-slate-700">{application.service?.name}</p>
                      <p className="text-[10px] text-slate-400">{application.service?.category}</p>
                    </td>
                    <td className="text-xs text-slate-600">{application.assignedOfficer?.fullName || 'Unassigned'}</td>
                    <td className="text-xs text-slate-600">{application._count?.documents || 0}</td>
                    <td className="text-xs text-slate-500">{dateFmt(application.submittedAt || application.createdAt)}</td>
                    <td><Badge status={application.status} /></td>
                    <td className="text-right">
                      <Link
                        to={`/admin/applications/${application.id}`}
                        className="inline-flex h-9 items-center rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-navy transition hover:bg-slate-50"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
