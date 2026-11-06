import { useEffect, useMemo, useState } from 'react';
import { CircleDollarSign, Download, IndianRupee, Search, TrendingDown, Wallet } from 'lucide-react';
import api, { apiError } from '../../lib/api';
import { dateFmt, inr } from '../../lib/format';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  LoadingBlock,
  PageHeader,
  cx,
} from '../../components/ui';
import { useToast } from '../../components/Toast';

const filters = ['ALL', 'PENDING', 'SUCCESS', 'FAILED'];

export default function AdminPayments() {
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');

  useEffect(() => {
    api
      .get('/admin/payments')
      .then(({ data }) => setPayments(data.payments))
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const successful = payments.filter((payment) => payment.status === 'SUCCESS');
    const pending = payments.filter((payment) => payment.status === 'PENDING');
    const failed = payments.filter((payment) => payment.status === 'FAILED');
    return {
      collected: successful.reduce((sum, payment) => sum + Number(payment.amount), 0),
      successCount: successful.length,
      pending: pending.reduce((sum, payment) => sum + Number(payment.amount), 0),
      pendingCount: pending.length,
      failed: failed.length,
    };
  }, [payments]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return payments.filter((payment) => {
      const matchesStatus = status === 'ALL' || payment.status === status;
      const matchesQuery =
        !term ||
        payment.referenceNo.toLowerCase().includes(term) ||
        payment.transactionId?.toLowerCase().includes(term) ||
        payment.user?.fullName?.toLowerCase().includes(term) ||
        payment.application?.referenceNo?.toLowerCase().includes(term);
      return matchesStatus && matchesQuery;
    });
  }, [payments, query, status]);

  const openReceipt = async (payment) => {
    try {
      const { data } = await api.get(`/payments/${payment.id}/receipt`, { responseType: 'text' });
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(data);
        win.document.close();
      }
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Treasury"
        title="Payments"
        description="Monitor every simulated UPI transaction, application fee and outstanding collection."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><IndianRupee size={18} /></span>
          <div>
            <p className="text-lg font-extrabold text-navy">{inr(stats.collected)}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Collected · {stats.successCount} payments</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-saffron-50 text-saffron-600"><Wallet size={18} /></span>
          <div>
            <p className="text-lg font-extrabold text-navy">{inr(stats.pending)}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Outstanding · {stats.pendingCount} pending</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-600"><TrendingDown size={18} /></span>
          <div>
            <p className="text-lg font-extrabold text-navy">{stats.failed}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Failed attempts</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><CircleDollarSign size={18} /></span>
          <div>
            <p className="text-lg font-extrabold text-navy">{payments.length}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Total transactions</p>
          </div>
        </Card>
      </div>

      <Card className="mb-4 p-4">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search reference, transaction, citizen or application"
            className="input pl-10"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={cx(
                'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                status === item ? 'bg-navy text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:text-navy'
              )}
            >
              {item === 'ALL' ? 'All' : item.charAt(0) + item.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </Card>

      {error && <Alert type="danger" className="mb-4">{error}</Alert>}

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingBlock label="Loading payments..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CircleDollarSign}
            title="No payments match"
            description="Try a different status or clear the search."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Citizen</th>
                  <th>Application</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-right">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((payment) => (
                  <tr key={payment.id} className="transition hover:bg-slate-50/70">
                    <td>
                      <p className="font-bold text-navy">{payment.referenceNo}</p>
                      <p className="font-mono text-[10px] text-slate-400">{payment.transactionId || '—'}</p>
                    </td>
                    <td>
                      <p className="text-sm text-slate-700">{payment.user?.fullName}</p>
                      <p className="text-[10px] text-slate-400">{payment.user?.email}</p>
                    </td>
                    <td>
                      <p className="text-xs font-medium text-slate-600">{payment.application?.referenceNo || 'Standalone'}</p>
                      <p className="text-[10px] text-slate-400">{payment.application?.service?.name || payment.purpose}</p>
                    </td>
                    <td className="font-bold text-navy">{inr(payment.amount)}</td>
                    <td className="text-xs uppercase text-slate-500">{payment.method || 'UPI'}</td>
                    <td className="text-xs text-slate-500">{dateFmt(payment.paidAt || payment.createdAt)}</td>
                    <td><Badge status={payment.status} /></td>
                    <td className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={payment.status !== 'SUCCESS'}
                        onClick={() => openReceipt(payment)}
                      >
                        <Download size={13} /> View
                      </Button>
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
