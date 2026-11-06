import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, IndianRupee, Landmark, Printer, TrendingUp } from 'lucide-react';
import api, { apiError } from '../../lib/api';
import { formatStatus, inr } from '../../lib/format';
import {
  Alert,
  Badge,
  Button,
  Card,
  LoadingBlock,
  PageHeader,
  StatCard,
} from '../../components/ui';

const statusTone = {
  SUBMITTED: 'bg-sky-500',
  DOCUMENTS_VERIFIED: 'bg-cyan-500',
  UNDER_REVIEW: 'bg-amber-500',
  CORRECTION_REQUESTED: 'bg-orange-500',
  APPROVED: 'bg-emerald-500',
  REJECTED: 'bg-rose-500',
};

export default function Reports() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/reports')
      .then(({ data: payload }) => setData(payload))
      .catch((err) => setError(apiError(err)));
  }, []);

  const totals = useMemo(() => {
    if (!data) return null;
    const applications = data.applicationsByStatus.reduce((sum, row) => sum + row.count, 0);
    const approved = data.applicationsByStatus.find((row) => row.status === 'APPROVED')?.count || 0;
    const revenue = data.revenueByMonth.reduce((sum, month) => sum + month.amount, 0);
    const successful = data.paymentsByStatus.find((row) => row.status === 'SUCCESS');
    return {
      applications,
      approved,
      approvalRate: applications ? Math.round((approved / applications) * 100) : 0,
      revenue,
      collected: successful?.amount || 0,
      transactions: successful?.count || 0,
      topService: data.servicePopularity[0]?.name || '—',
      topServiceCount: data.servicePopularity[0]?.applications || 0,
    };
  }, [data]);

  if (error) return <Alert type="danger">{error}</Alert>;
  if (!data || !totals) return <LoadingBlock label="Compiling reports..." />;

  const maxRevenue = Math.max(...data.revenueByMonth.map((month) => month.amount), 1);
  const maxService = Math.max(...data.servicePopularity.map((service) => service.applications), 1);
  const totalApplications = data.applicationsByStatus.reduce((sum, row) => sum + row.count, 0) || 1;

  return (
    <div>
      <PageHeader
        eyebrow="Insight and accountability"
        title="Performance reports"
        description="Service demand, revenue trends and workflow throughput across the APCRDA pilot."
        actions={
          <Button variant="outline" onClick={() => window.print()}>
            <Printer size={15} /> Print report
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue (6 months)" value={inr(totals.revenue)} icon={IndianRupee} tone="teal" hint={`${totals.transactions} successful payments`} />
        <StatCard label="Applications" value={totals.applications} icon={BarChart3} tone="sky" hint="All service requests" />
        <StatCard label="Approval rate" value={`${totals.approvalRate}%`} icon={TrendingUp} tone="emerald" hint={`${totals.approved} approved`} />
        <StatCard label="Most requested" value={totals.topService} icon={Landmark} tone="saffron" hint={`${totals.topServiceCount} applications`} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <Card className="p-5">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h2 className="text-sm font-bold text-navy">Revenue trend</h2>
              <p className="text-xs text-slate-500">Successful UPI collections by month</p>
            </div>
            <Badge status="SUCCESS">{inr(totals.collected)} collected</Badge>
          </div>

          <div className="flex h-52 items-end gap-3 border-b border-slate-100 pb-0">
            {data.revenueByMonth.map((month) => {
              const height = Math.max(4, Math.round((month.amount / maxRevenue) * 100));
              return (
                <div key={month.key} className="group flex flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-[10px] font-bold text-navy opacity-0 transition group-hover:opacity-100">
                    {inr(month.amount)}
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-teal-600 to-teal-400 transition-all group-hover:from-teal-700 group-hover:to-teal-500"
                    style={{ height: `${height}%` }}
                    title={`${month.label}: ${inr(month.amount)}`}
                  />
                  <span className="text-[10px] font-semibold text-slate-500">{month.label}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {data.paymentsByStatus.map((row) => (
              <div key={row.status} className="rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{formatStatus(row.status)}</p>
                <p className="mt-0.5 text-sm font-extrabold text-navy">{inr(row.amount)}</p>
                <p className="text-[10px] text-slate-400">{row.count} transactions</p>
              </div>
            ))}
            {!data.paymentsByStatus.length && (
              <p className="col-span-3 text-xs text-slate-400">No payments recorded yet.</p>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-navy">Application workflow</h2>
            <p className="text-xs text-slate-500">Where files currently sit</p>
          </div>
          <div className="space-y-3">
            {data.applicationsByStatus.map((row) => (
              <div key={row.status}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">{formatStatus(row.status)}</span>
                  <span className="font-bold text-navy">{row.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${statusTone[row.status] || 'bg-navy'}`}
                    style={{ width: `${Math.max(4, (row.count / totalApplications) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {!data.applicationsByStatus.length && <p className="text-xs text-slate-400">No applications recorded yet.</p>}
          </div>

          <div className="mt-5 rounded-xl border border-dashed border-slate-200 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Reading the data</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              High correction rates usually signal unclear document checklists. Pair this view with service-level
              processing times before changing SLAs.
            </p>
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.25fr]">
        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-navy">Service demand</h2>
            <p className="text-xs text-slate-500">Top services by application volume</p>
          </div>
          <div className="space-y-3.5">
            {data.servicePopularity.map((service, index) => (
              <div key={service.name}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <span className="truncate font-semibold text-slate-600">
                    <span className="mr-1.5 text-slate-400">{index + 1}.</span>
                    {service.name}
                  </span>
                  <span className="shrink-0 font-bold text-navy">{service.applications}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-navy"
                    style={{ width: `${Math.max(4, (service.applications / maxService) * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-400">{service.category}</p>
              </div>
            ))}
            {!data.servicePopularity.length && <p className="text-xs text-slate-400">No service data yet.</p>}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-navy">Monthly revenue ledger</h2>
              <p className="text-xs text-slate-500">Successful collections, last six months</p>
            </div>
            <Download size={16} className="text-slate-300" />
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Collected</th>
                  <th>Share of period</th>
                </tr>
              </thead>
              <tbody>
                {data.revenueByMonth.map((month) => (
                  <tr key={month.key}>
                    <td className="font-semibold text-navy">{month.label}</td>
                    <td className="font-bold text-navy">{inr(month.amount)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-teal-500"
                            style={{ width: `${totals.revenue ? Math.round((month.amount / totals.revenue) * 100) : 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {totals.revenue ? Math.round((month.amount / totals.revenue) * 100) : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
