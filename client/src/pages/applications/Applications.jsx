import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, FileText, Plus, Search } from 'lucide-react';
import api, { apiError } from '../../lib/api';
import { dateFmt, inr } from '../../lib/format';
import { Alert, Badge, Card, EmptyState, LoadingBlock, PageHeader, cx } from '../../components/ui';

const filters = [
  { key: 'ALL', label: 'All' },
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'UNDER_REVIEW', label: 'Under review' },
  { key: 'CORRECTION_REQUESTED', label: 'Correction' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
];

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');

  useEffect(() => {
    api
      .get('/applications')
      .then(({ data }) => setApplications(data.applications))
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      applications.filter((application) => {
        const matchesStatus = filter === 'ALL' || application.status === filter;
        const matchesQuery =
          !query ||
          application.referenceNo.toLowerCase().includes(query.toLowerCase()) ||
          application.service?.name?.toLowerCase().includes(query.toLowerCase());
        return matchesStatus && matchesQuery;
      }),
    [applications, filter, query]
  );

  const counts = useMemo(
    () => ({
      total: applications.length,
      pending: applications.filter((app) =>
        ['SUBMITTED', 'DOCUMENTS_VERIFIED', 'UNDER_REVIEW', 'CORRECTION_REQUESTED'].includes(app.status)
      ).length,
      approved: applications.filter((app) => app.status === 'APPROVED').length,
    }),
    [applications]
  );

  return (
    <div>
      <PageHeader
        eyebrow="Application management"
        title="Your applications"
        description="Every submission, its current stage and the next action required."
        actions={
          <Link to="/app/services">
            <span className="inline-flex h-11 items-center gap-2 rounded-xl bg-navy px-4 text-sm font-semibold text-white transition hover:bg-navy-700">
              <Plus size={16} /> New application
            </span>
          </Link>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Total submitted', value: counts.total, icon: FileText, tone: 'bg-navy-50 text-navy' },
          { label: 'In progress', value: counts.pending, icon: Clock, tone: 'bg-saffron-50 text-saffron-600' },
          { label: 'Approved', value: counts.approved, icon: ArrowRight, tone: 'bg-emerald-50 text-emerald-700' },
        ].map((item) => (
          <Card key={item.label} className="flex items-center gap-3 p-4">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${item.tone}`}>
              <item.icon size={18} />
            </span>
            <div>
              <p className="text-lg font-extrabold text-navy">{item.value}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mb-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search reference or service..."
              className="input pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filters.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={cx(
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  filter === item.key
                    ? 'bg-navy text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-navy'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {error && <Alert type="danger" className="mb-4">{error}</Alert>}

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingBlock label="Loading applications..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={applications.length === 0 ? 'No applications yet' : 'No matching applications'}
            description={
              applications.length === 0
                ? 'Start with a city service and your application will appear here.'
                : 'Try a different filter or search term.'
            }
            action={
              applications.length === 0 ? (
                <Link to="/app/services" className="text-xs font-bold text-teal-700">
                  Explore services
                </Link>
              ) : null
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
                  <th>Documents</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((application) => (
                  <tr key={application.id} className="transition hover:bg-slate-50/70">
                    <td>
                      <Link
                        to={`/app/applications/${application.id}`}
                        className="font-bold text-navy hover:text-teal-700"
                      >
                        {application.referenceNo}
                      </Link>
                    </td>
                    <td>
                      <p className="font-medium text-navy">{application.service?.name}</p>
                      <p className="text-xs text-slate-400">
                        {application.service?.category} · {application.service && Number(application.service.fee) > 0
                          ? inr(application.service.fee)
                          : 'No fee'}
                      </p>
                    </td>
                    <td className="text-slate-500">{dateFmt(application.submittedAt)}</td>
                    <td className="text-slate-500">{application._count?.documents ?? 0}</td>
                    <td><Badge status={application.status} /></td>
                    <td className="text-right">
                      <Link
                        to={`/app/applications/${application.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-600"
                      >
                        Track <ArrowRight size={13} />
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
