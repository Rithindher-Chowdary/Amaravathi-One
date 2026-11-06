import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  FileText,
  IndianRupee,
  Info,
  ShieldCheck,
} from 'lucide-react';
import api, { apiError } from '../../lib/api';
import { inr } from '../../lib/format';
import { Alert, Button, Card, Field, LoadingBlock, PageHeader } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';

const extraFields = {
  PROPERTY_TAX_CLEARANCE: [
    { key: 'assessmentNo', label: 'Property assessment number', placeholder: 'e.g. AMR-PT-2025-1187' },
    { key: 'propertyType', label: 'Property type', placeholder: 'Residential / Commercial' },
  ],
  PROPERTY_MUTATION: [
    { key: 'deedNo', label: 'Registered sale deed number', placeholder: 'Deed registration number' },
    { key: 'sellerName', label: 'Previous owner name', placeholder: 'Full name' },
  ],
  WATER_CONNECTION: [
    { key: 'propertyAddress', label: 'Connection address', placeholder: 'Door no, street, locality' },
    { key: 'connectionType', label: 'Connection type', placeholder: 'Domestic / Commercial' },
  ],
  ELECTRICITY_NAME_CHANGE: [
    { key: 'consumerNo', label: 'Consumer number', placeholder: 'Electricity consumer number' },
    { key: 'connectionAddress', label: 'Connection address', placeholder: 'Address on the bill' },
  ],
  BUILDING_PERMISSION: [
    { key: 'plotNo', label: 'Plot / survey number', placeholder: 'Plot or survey number' },
    { key: 'siteArea', label: 'Site area (sq. ft.)', placeholder: 'e.g. 2400' },
  ],
  TRADE_LICENCE: [
    { key: 'businessName', label: 'Business name', placeholder: 'Registered trade name' },
    { key: 'tradeType', label: 'Trade type', placeholder: 'Retail, food, services...' },
    { key: 'gstin', label: 'GSTIN', placeholder: 'GST registration number' },
  ],
  BIRTH_CERTIFICATE: [
    { key: 'childName', label: 'Child name', placeholder: 'Full name of the child' },
    { key: 'dateOfBirth', label: 'Date of birth', placeholder: 'YYYY-MM-DD' },
    { key: 'hospital', label: 'Hospital', placeholder: 'Hospital where the birth occurred' },
  ],
  PUBLIC_GRIEVANCE: [
    { key: 'issueLocation', label: 'Issue location', placeholder: 'Ward, street or landmark' },
    { key: 'issueDescription', label: 'Describe the issue', placeholder: 'What needs attention?' },
  ],
};

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    applicantName: user?.fullName || '',
    phone: user?.phone || '',
    address: [user?.profile?.addressLine, user?.profile?.city, user?.profile?.pincode].filter(Boolean).join(', '),
    remarks: '',
  });

  useEffect(() => {
    api
      .get(`/services/${id}`)
      .then(({ data }) => setService(data.service))
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const fields = service ? extraFields[service.code] || [] : [];

  const submit = async (event) => {
    event.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/applications', {
        serviceId: service.id,
        formData: form,
      });
      toast.success(`Application ${data.application.referenceNo} submitted.`);
      navigate(`/app/applications/${data.application.id}`);
    } catch (err) {
      setFormError(apiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingBlock label="Loading service details..." />;
  if (error || !service) return <Alert type="danger" title="Service unavailable">{error || 'Service not found.'}</Alert>;

  const fee = Number(service.fee);

  return (
    <div>
      <Link to="/app/services" className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-navy">
        <ArrowLeft size={14} /> Back to services
      </Link>

      <PageHeader eyebrow={service.category} title={service.name} description={service.description} />

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-50 text-teal-700">
                <IndianRupee size={17} />
              </span>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Fee</p>
              <p className="mt-0.5 text-lg font-extrabold text-navy">{fee === 0 ? 'No fee' : inr(fee)}</p>
            </Card>
            <Card className="p-5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-saffron-50 text-saffron-600">
                <CalendarClock size={17} />
              </span>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Processing</p>
              <p className="mt-0.5 text-lg font-extrabold text-navy">{service.processingDays} days</p>
            </Card>
            <Card className="p-5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-navy-50 text-navy">
                <FileText size={17} />
              </span>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Documents</p>
              <p className="mt-0.5 text-lg font-extrabold text-navy">{service.requiredDocuments?.length || 0} required</p>
            </Card>
          </div>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
              <ShieldCheck size={17} className="text-teal-700" /> Eligibility
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{service.eligibility}</p>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-navy">
              <FileText size={17} className="text-teal-700" /> Required documents
            </h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(service.requiredDocuments || []).map((document) => (
                <div key={document} className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-teal-600" />
                  <span className="text-sm text-slate-600">{document}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              You can upload supporting documents after submitting the application. PDF, JPG, PNG and TXT files up to
              5 MB are accepted.
            </p>
          </Card>

          <Alert type="info" title="How this application moves">
            Submission → document verification → officer review → approval or rejection. You will be notified at every
            stage and can track the full timeline from your dashboard.
          </Alert>
        </div>

        <Card className="h-fit p-5 xl:sticky xl:top-24">
          <h2 className="text-base font-bold text-navy">Application form</h2>
          <p className="mt-0.5 text-xs text-slate-500">Reference number and fee will be generated on submission.</p>

          {formError && <Alert type="danger" className="mt-4">{formError}</Alert>}

          <form onSubmit={submit} className="mt-4 space-y-4">
            <Field label="Applicant name">
              <input
                required
                value={form.applicantName}
                onChange={(event) => setForm({ ...form, applicantName: event.target.value })}
                className="input"
              />
            </Field>
            <Field label="Mobile number">
              <input
                required
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                placeholder="10-digit number"
                className="input"
              />
            </Field>
            <Field label="Address">
              <textarea
                required
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
                placeholder="Door no, street, city and pincode"
                className="textarea"
              />
            </Field>

            {fields.map((field) => (
              <Field key={field.key} label={field.label}>
                <input
                  required
                  value={form[field.key] || ''}
                  onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
                  placeholder={field.placeholder}
                  className="input"
                />
              </Field>
            ))}

            <Field label="Additional remarks" hint="Optional context for the reviewing officer">
              <textarea
                value={form.remarks}
                onChange={(event) => setForm({ ...form, remarks: event.target.value })}
                placeholder="Anything the officer should know?"
                className="textarea min-h-[80px]"
              />
            </Field>

            <div className="rounded-xl bg-slate-50 px-3.5 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Application fee</span>
                <span className="font-extrabold text-navy">{fee === 0 ? 'No fee' : inr(fee)}</span>
              </div>
              {fee > 0 && (
                <p className="mt-1 text-[11px] text-slate-400">
                  A pending UPI payment will be created automatically. Pay it from the payments page.
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg" loading={submitting}>
              Submit application <ArrowRight size={16} />
            </Button>
          </form>

          <div className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-slate-400">
            <Info size={13} className="mt-0.5 shrink-0" />
            This is a prototype. Submissions are stored locally and reviewed through the officer portal.
          </div>
        </Card>
      </div>
    </div>
  );
}
