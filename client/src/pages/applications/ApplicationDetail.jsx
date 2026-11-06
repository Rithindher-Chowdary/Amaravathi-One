import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Download,
  FileCheck2,
  FileText,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
  Upload,
  User,
} from 'lucide-react';
import api, { apiError, fileUrl } from '../../lib/api';
import { dateFmt, dateTimeFmt, formatStatus, inr } from '../../lib/format';
import { Alert, Badge, Button, Card, EmptyState, Field, LoadingBlock, PageHeader, cx } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';

const stages = [
  { key: 'SUBMITTED', label: 'Application submitted' },
  { key: 'DOCUMENTS_VERIFIED', label: 'Documents verified' },
  { key: 'UNDER_REVIEW', label: 'Officer review' },
  { key: 'APPROVED', label: 'Approval and certificate' },
];

const statusOptions = [
  'SUBMITTED',
  'DOCUMENTS_VERIFIED',
  'UNDER_REVIEW',
  'CORRECTION_REQUESTED',
  'APPROVED',
  'REJECTED',
];

const labelFromKey = (key) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (char) => char.toUpperCase());

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const role = user?.role;
  const base = role === 'ADMIN' ? '/admin' : role === 'OFFICER' ? '/officer' : '/app';

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [officers, setOfficers] = useState([]);

  const [actionStatus, setActionStatus] = useState('');
  const [actionRemarks, setActionRemarks] = useState('');
  const [officerId, setOfficerId] = useState('');
  const [resubmitRemarks, setResubmitRemarks] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [file, setFile] = useState(null);

  const load = async () => {
    const { data } = await api.get(`/applications/${id}`);
    setApplication(data.application);
    setActionStatus(data.application.status);
    setActionRemarks(data.application.officerRemarks || '');
    setOfficerId(data.application.assignedOfficerId || '');
    return data.application;
  };

  useEffect(() => {
    load()
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (role === 'ADMIN') {
      api
        .get('/admin/officers')
        .then(({ data }) => setOfficers(data.officers.filter((officer) => officer.isActive)))
        .catch(() => {});
    }
  }, [role]);

  const run = async (key, action, successMessage) => {
    setBusy(key);
    try {
      await action();
      await load();
      if (successMessage) toast.success(successMessage);
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy('');
    }
  };

  const updateStatus = () =>
    run(
      'status',
      () =>
        api.patch(`/applications/${id}/status`, {
          status: actionStatus,
          remarks: actionRemarks || undefined,
        }),
      'Application status updated.'
    );

  const resubmit = () =>
    run(
      'resubmit',
      () => api.post(`/applications/${id}/resubmit`, { remarks: resubmitRemarks || undefined }),
      'Application resubmitted for review.'
    );

  const assignOfficer = () =>
    run('assign', () => api.post(`/applications/${id}/assign`, { officerId }), 'Officer assigned.');

  const verifyDocument = (document, isVerified) =>
    run(
      `doc-${document.id}`,
      () => api.patch(`/applications/${id}/documents/${document.id}/verify`, { isVerified }),
      isVerified ? 'Document verified.' : 'Document flagged.'
    );

  const uploadDocument = (event) => {
    event.preventDefault();
    if (!file) {
      toast.error('Choose a file to upload.');
      return;
    }
    const payload = new FormData();
    payload.append('file', file);
    payload.append('documentType', documentType || 'Supporting document');
    run(
      'upload',
      () => api.post(`/applications/${id}/documents`, payload, { headers: { 'Content-Type': 'multipart/form-data' } }),
      'Document uploaded.'
    ).then(() => {
      setFile(null);
      setDocumentType('');
      event.target.reset();
    });
  };

  const openReceipt = async (paymentId) => {
    try {
      const { data } = await api.get(`/payments/${paymentId}/receipt`, { responseType: 'text' });
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(data);
        win.document.close();
      }
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  if (loading) return <LoadingBlock label="Loading application..." />;
  if (error || !application) {
    return <Alert type="danger" title="Could not load application">{error || 'Application not found.'}</Alert>;
  }

  const history = application.statusHistory || [];
  const latestStatus = application.status;
  const completedStatuses = new Set(history.map((entry) => entry.status));
  const paymentTotal = Number(application.service?.fee || 0);
  const formEntries = Object.entries(application.formData || {}).filter(
    ([, value]) => value !== null && value !== undefined && String(value).trim() !== ''
  );
  const canAct = role === 'OFFICER' || role === 'ADMIN';
  const isOwner = role === 'CITIZEN';

  return (
    <div>
      <Link to={`${base}/applications`} className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-navy">
        <ArrowLeft size={14} /> Back to applications
      </Link>

      <PageHeader
        eyebrow={application.service?.category}
        title={application.referenceNo}
        description={application.service?.name}
        actions={<Badge status={latestStatus} className="px-3 py-1.5 text-xs">{formatStatus(latestStatus)}</Badge>}
      />

      {latestStatus === 'CORRECTION_REQUESTED' && (
        <Alert type="warning" title="Correction requested" className="mb-4">
          {application.officerRemarks || 'An officer has requested changes. Upload the corrected documents and resubmit.'}
        </Alert>
      )}
      {latestStatus === 'REJECTED' && (
        <Alert type="danger" title="Application rejected" className="mb-4">
          {application.officerRemarks || 'This application was rejected. Contact support if you need help.'}
        </Alert>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-navy">Application tracking</h2>
              <span className="text-xs font-semibold text-slate-400">
                Submitted {dateFmt(application.submittedAt)}
              </span>
            </div>

            <div className="mt-4">
              {stages.map((stage, index) => {
                const entries = history.filter((entry) => entry.status === stage.key);
                const entry = entries[entries.length - 1];
                const done = Boolean(entry);
                const current = latestStatus === stage.key;
                const isLast = index === stages.length - 1;
                return (
                  <div key={stage.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={cx(
                          'grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold',
                          done
                            ? 'bg-teal text-white'
                            : current
                              ? 'border-2 border-teal bg-teal-50 text-teal-700'
                              : 'border-2 border-slate-200 bg-white text-slate-400'
                        )}
                      >
                        {done ? <Check size={14} /> : index + 1}
                      </span>
                      {!isLast && (
                        <span className={cx('my-1 min-h-[34px] w-px flex-1', done ? 'bg-teal-200' : 'bg-slate-200')} />
                      )}
                    </div>
                    <div className={cx('pb-4', isLast && 'pb-0')}>
                      <p className={cx('text-sm font-bold', done || current ? 'text-navy' : 'text-slate-400')}>
                        {stage.label}
                      </p>
                      <p className="text-xs text-slate-400">
                        {entry ? dateTimeFmt(entry.createdAt) : current ? 'In progress' : 'Pending'}
                      </p>
                      {entry?.remarks && (
                        <p className="mt-1 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs leading-5 text-slate-500">
                          {entry.remarks}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-bold text-navy">Application details</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 px-3.5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Service</p>
                <p className="mt-0.5 text-sm font-semibold text-navy">{application.service?.name}</p>
                <p className="text-xs text-slate-400">{application.service?.category}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3.5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Fee</p>
                <p className="mt-0.5 text-sm font-semibold text-navy">{paymentTotal === 0 ? 'No fee' : inr(paymentTotal)}</p>
                <p className="text-xs text-slate-400">{application.service?.processingDays} working days</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3.5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Assigned officer</p>
                <p className="mt-0.5 text-sm font-semibold text-navy">
                  {application.assignedOfficer?.fullName || 'Not assigned yet'}
                </p>
                <p className="text-xs text-slate-400">{application.assignedOfficer?.email || 'Awaiting allocation'}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3.5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Decision date</p>
                <p className="mt-0.5 text-sm font-semibold text-navy">
                  {application.decidedAt ? dateFmt(application.decidedAt) : 'Pending'}
                </p>
                <p className="text-xs text-slate-400">Last updated {dateTimeFmt(application.updatedAt)}</p>
              </div>
            </div>

            {formEntries.length > 0 && (
              <>
                <p className="mt-5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Submitted information</p>
                <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100">
                  {formEntries.map(([key, value]) => (
                    <div key={key} className="flex flex-col gap-1 px-3.5 py-2.5 sm:flex-row sm:justify-between">
                      <span className="text-xs font-medium text-slate-500">{labelFromKey(key)}</span>
                      <span className="text-sm text-navy sm:text-right">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {application.officerRemarks && (
              <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Officer remarks</p>
                <p className="mt-1 text-sm leading-6 text-amber-900">{application.officerRemarks}</p>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-navy">Documents</h2>
              <span className="text-xs text-slate-400">{application.documents?.length || 0} uploaded</span>
            </div>

            {application.documents?.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No documents uploaded"
                description="Upload the required supporting documents to help the officer process your application."
                className="py-8"
              />
            ) : (
              <div className="mt-3 space-y-2">
                {application.documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-100 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-navy-50 text-navy">
                        <FileCheck2 size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-navy">{document.fileName}</p>
                        <p className="text-xs text-slate-400">
                          {document.documentType} · uploaded by {document.uploadedBy?.fullName} · {dateFmt(document.createdAt)}
                        </p>
                        <div className="mt-1">
                          {document.isVerified ? (
                            <Badge status="VERIFIED">Verified</Badge>
                          ) : (
                            <Badge status="PENDING">Not verified</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <a
                        href={fileUrl(document.filePath)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-navy hover:bg-slate-50"
                      >
                        <Download size={13} /> View
                      </a>
                      {canAct && (
                        <Button
                          size="sm"
                          variant={document.isVerified ? 'ghost' : 'soft'}
                          loading={busy === `doc-${document.id}`}
                          onClick={() => verifyDocument(document, !document.isVerified)}
                        >
                          {document.isVerified ? 'Flag' : 'Verify'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isOwner && (
              <form onSubmit={uploadDocument} className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-3.5">
                <p className="text-xs font-bold text-navy">Upload a supporting document</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <select
                    value={documentType}
                    onChange={(event) => setDocumentType(event.target.value)}
                    className="input h-10"
                  >
                    <option value="">Document type</option>
                    {(application.service?.requiredDocuments || []).map((doc) => (
                      <option key={doc} value={doc}>{doc}</option>
                    ))}
                    <option value="Other supporting document">Other supporting document</option>
                  </select>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.txt"
                    onChange={(event) => setFile(event.target.files?.[0] || null)}
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-navy file:px-2.5 file:py-1 file:text-[11px] file:font-semibold file:text-white"
                  />
                  <Button type="submit" size="sm" loading={busy === 'upload'} className="h-10">
                    <Upload size={14} /> Upload
                  </Button>
                </div>
                <p className="mt-1.5 text-[10px] text-slate-400">PDF, JPG, PNG or TXT up to 5 MB.</p>
              </form>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-navy">Payments</h2>
              {paymentTotal > 0 && <span className="text-xs font-semibold text-slate-400">Fee {inr(paymentTotal)}</span>}
            </div>

            {application.payments?.length === 0 ? (
              <EmptyState icon={CircleDollarSign} title="No payment required" className="py-8" />
            ) : (
              <div className="mt-3 space-y-2">
                {application.payments.map((payment) => (
                  <div key={payment.id} className="flex flex-col gap-2 rounded-xl border border-slate-100 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-navy">
                        {inr(payment.amount)} · {payment.purpose}
                      </p>
                      <p className="text-xs text-slate-400">
                        {payment.referenceNo}
                        {payment.transactionId ? ` · ${payment.transactionId}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge status={payment.status} />
                      {payment.status === 'SUCCESS' && (
                        <Button size="sm" variant="outline" onClick={() => openReceipt(payment.id)}>
                          <Download size={13} /> Receipt
                        </Button>
                      )}
                      {payment.status === 'PENDING' && isOwner && (
                        <Button size="sm" variant="teal" onClick={() => navigate('/app/payments')}>
                          Pay now <ArrowRight size={13} />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          {canAct && (
            <Card className="p-5">
              <h2 className="text-sm font-bold text-navy">Officer action</h2>
              <p className="mt-0.5 text-xs text-slate-500">Update the stage and leave remarks for the citizen.</p>
              <div className="mt-3 space-y-3">
                <Field label="Application status">
                  <select value={actionStatus} onChange={(event) => setActionStatus(event.target.value)} className="input">
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{formatStatus(status)}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Remarks">
                  <textarea
                    value={actionRemarks}
                    onChange={(event) => setActionRemarks(event.target.value)}
                    placeholder="Explain the decision or what the citizen needs to correct."
                    className="textarea min-h-[90px]"
                  />
                </Field>
                <Button className="w-full" onClick={updateStatus} loading={busy === 'status'}>
                  <RefreshCw size={15} /> Update status
                </Button>
              </div>
            </Card>
          )}

          {role === 'ADMIN' && (
            <Card className="p-5">
              <h2 className="text-sm font-bold text-navy">Assign officer</h2>
              <div className="mt-3 space-y-3">
                <Field label="Officer">
                  <select value={officerId} onChange={(event) => setOfficerId(event.target.value)} className="input">
                    <option value="">Select an officer</option>
                    {officers.map((officer) => (
                      <option key={officer.id} value={officer.id}>
                        {officer.fullName} ({officer._count?.assignedApplications || 0} assigned)
                      </option>
                    ))}
                  </select>
                </Field>
                <Button className="w-full" variant="outline" onClick={assignOfficer} loading={busy === 'assign'} disabled={!officerId}>
                  <User size={15} /> Assign application
                </Button>
              </div>
            </Card>
          )}

          {isOwner && latestStatus === 'CORRECTION_REQUESTED' && (
            <Card className="p-5">
              <h2 className="text-sm font-bold text-navy">Resubmit application</h2>
              <p className="mt-0.5 text-xs text-slate-500">Upload the requested documents above, then resubmit.</p>
              <div className="mt-3 space-y-3">
                <Field label="Note to officer" hint="Optional">
                  <textarea
                    value={resubmitRemarks}
                    onChange={(event) => setResubmitRemarks(event.target.value)}
                    placeholder="Describe the corrections you made."
                    className="textarea min-h-[80px]"
                  />
                </Field>
                <Button className="w-full" variant="saffron" onClick={resubmit} loading={busy === 'resubmit'}>
                  <Send size={15} /> Resubmit for review
                </Button>
              </div>
            </Card>
          )}

          {canAct && (
            <Card className="p-5">
              <h2 className="text-sm font-bold text-navy">Citizen details</h2>
              <div className="mt-3 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-navy text-sm font-extrabold text-white">
                  {(application.user?.fullName || 'C').slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-bold text-navy">{application.user?.fullName}</p>
                  <p className="text-xs text-slate-400">{application.user?.email}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2.5 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400" /> {application.user?.phone || 'No phone on record'}
                </p>
                <p className="flex items-start gap-2">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" />
                  {[application.user?.profile?.addressLine, application.user?.profile?.city, application.user?.profile?.pincode]
                    .filter(Boolean)
                    .join(', ') || 'No address on record'}
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={14} className="text-slate-400" /> Aadhaar {application.user?.profile?.aadhaarNumber || 'not linked'}
                </p>
              </div>
            </Card>
          )}

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-50 text-teal-700">
                <ShieldCheck size={17} />
              </span>
              <h2 className="text-sm font-bold text-navy">Assistance</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Need help with this application? Our citizen support desk can review the case with you.
            </p>
            <div className="mt-3 space-y-1.5 text-xs text-slate-500">
              <p className="flex items-center gap-2"><Phone size={13} /> 1800 000 0000</p>
              <p className="flex items-center gap-2"><Mail size={13} /> help@amaravati.one</p>
              <p className="flex items-center gap-2"><Clock size={13} /> Mon-Sat, 9:00-18:00</p>
            </div>
          </Card>

          <Alert type="info" title="Prototype note">
            Status changes, credential checks and UPI payments are simulated for the APCRDA demonstration.
          </Alert>
        </div>
      </div>
    </div>
  );
}
