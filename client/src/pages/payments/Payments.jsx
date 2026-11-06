import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CircleDollarSign, Clock, Download, IndianRupee, Smartphone } from 'lucide-react';
import api, { apiError } from '../../lib/api';
import { dateFmt, inr } from '../../lib/format';
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

const filters = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'SUCCESS', label: 'Successful' },
  { key: 'FAILED', label: 'Failed' },
];

export default function Payments() {
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [upiId, setUpiId] = useState('ravi.teja@okhdfcbank');
  const [processing, setProcessing] = useState(false);

  const load = async () => {
    const { data } = await api.get('/payments');
    setPayments(data.payments);
  };

  useEffect(() => {
    load()
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (filter === 'ALL' ? payments : payments.filter((payment) => payment.status === filter)),
    [payments, filter]
  );

  const stats = useMemo(() => {
    const paid = payments.filter((payment) => payment.status === 'SUCCESS');
    const pending = payments.filter((payment) => payment.status === 'PENDING');
    return {
      paid: paid.reduce((sum, payment) => sum + Number(payment.amount), 0),
      paidCount: paid.length,
      pendingAmount: pending.reduce((sum, payment) => sum + Number(payment.amount), 0),
      pendingCount: pending.length,
    };
  }, [payments]);

  const closeModal = () => setSelected(null);

  const confirm = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      await api.post(`/payments/${selected.id}/confirm`, { upiId });
      toast.success('UPI payment completed (simulated).');
      closeModal();
      await load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setProcessing(false);
    }
  };

  const fail = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      await api.post(`/payments/${selected.id}/fail`);
      toast.info('Payment marked as failed for the demo.');
      closeModal();
      await load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setProcessing(false);
    }
  };

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
        eyebrow="UPI payments"
        title="Fees and receipts"
        description="Pay application fees through a simulated UPI gateway, track transaction IDs and download receipts."
      />

      <Alert type="info" title="Simulated payment gateway" className="mb-5">
        No real money is transferred. The UPI flow, transaction IDs and receipts are generated locally for the APCRDA
        prototype.
      </Alert>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
            <IndianRupee size={18} />
          </span>
          <div>
            <p className="text-lg font-extrabold text-navy">{inr(stats.paid)}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Paid · {stats.paidCount} transactions
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-saffron-50 text-saffron-600">
            <Clock size={18} />
          </span>
          <div>
            <p className="text-lg font-extrabold text-navy">{inr(stats.pendingAmount)}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Pending · {stats.pendingCount} payments
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
            <Smartphone size={18} />
          </span>
          <div>
            <p className="text-lg font-extrabold text-navy">UPI</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Payment method</p>
          </div>
        </Card>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {filters.map((item) => (
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
      </div>

      {error && <Alert type="danger" className="mb-4">{error}</Alert>}

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingBlock label="Loading payments..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CircleDollarSign}
            title="No payments in this view"
            description="Application fees appear here automatically when you submit a service application."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Purpose</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((payment) => (
                  <tr key={payment.id} className="transition hover:bg-slate-50/70">
                    <td>
                      <p className="font-bold text-navy">{payment.referenceNo}</p>
                      <p className="font-mono text-[10px] text-slate-400">{payment.transactionId || 'Awaiting UPI'}</p>
                    </td>
                    <td>
                      <p className="text-sm font-medium text-navy">{payment.purpose}</p>
                      <p className="text-xs text-slate-400">
                        {payment.application?.referenceNo || 'Standalone payment'}
                        {payment.application?.service?.name ? ` · ${payment.application.service.name}` : ''}
                      </p>
                    </td>
                    <td className="text-slate-500">{dateFmt(payment.paidAt || payment.createdAt)}</td>
                    <td className="font-bold text-navy">{inr(payment.amount)}</td>
                    <td><Badge status={payment.status} /></td>
                    <td className="text-right">
                      {payment.status === 'PENDING' ? (
                        <Button size="sm" variant="teal" onClick={() => setSelected(payment)}>
                          Pay now
                        </Button>
                      ) : payment.status === 'SUCCESS' ? (
                        <Button size="sm" variant="outline" onClick={() => openReceipt(payment)}>
                          <Download size={13} /> Receipt
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">No action</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={Boolean(selected)}
        onClose={closeModal}
        title="Complete UPI payment"
        description="Simulated UPI gateway · no real money is transferred"
        footer={
          selected && (
            <>
              <Button variant="ghost" onClick={fail} disabled={processing} className="mr-auto text-rose-600 hover:bg-rose-50">
                Simulate failure
              </Button>
              <Button variant="outline" onClick={closeModal}>Cancel</Button>
              <Button variant="teal" onClick={confirm} loading={processing}>
                <CheckCircle2 size={16} /> Pay {inr(selected.amount)}
              </Button>
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="rounded-xl bg-navy-900 p-4 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-200">Amount payable</p>
              <p className="mt-1 text-3xl font-extrabold">{inr(selected.amount)}</p>
              <p className="mt-1 text-xs text-white/60">{selected.purpose}</p>
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-white/60">
                <span>{selected.referenceNo}</span>
                <span>{selected.application?.referenceNo || 'No application'}</span>
              </div>
            </div>

            <Field label="UPI ID" hint="Enter any demo UPI ID, for example citizen@upi">
              <input value={upiId} onChange={(event) => setUpiId(event.target.value)} className="input" />
            </Field>

            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-xs text-slate-500">
              <Smartphone size={15} className="text-teal-700" />
              A collect request would be sent to your UPI app in a production integration.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
