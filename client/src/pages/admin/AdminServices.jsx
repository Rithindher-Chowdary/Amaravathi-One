import { useEffect, useMemo, useState } from 'react';
import { FileText, Landmark, Pencil, Plus, Power, Search, Timer } from 'lucide-react';
import api, { apiError } from '../../lib/api';
import { inr } from '../../lib/format';
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

const emptyForm = {
  code: '',
  name: '',
  category: '',
  description: '',
  eligibility: '',
  requiredDocuments: '',
  fee: 0,
  processingDays: 7,
  isActive: true,
};

const formFrom = (service) => ({
  code: service.code,
  name: service.name,
  category: service.category,
  description: service.description,
  eligibility: service.eligibility,
  requiredDocuments: (service.requiredDocuments || []).join('\n'),
  fee: service.fee,
  processingDays: service.processingDays,
  isActive: service.isActive,
});

export default function AdminServices() {
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('ALL');
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [working, setWorking] = useState('');

  const load = async () => {
    const { data } = await api.get('/services/manage/all');
    setServices(data.services);
  };

  useEffect(() => {
    load()
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => ['ALL', ...Array.from(new Set(services.map((service) => service.category))).sort()],
    [services]
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return services.filter((service) => {
      const matchesCategory = category === 'ALL' || service.category === category;
      const matchesQuery =
        !term ||
        service.name.toLowerCase().includes(term) ||
        service.code.toLowerCase().includes(term) ||
        service.category.toLowerCase().includes(term);
      return matchesCategory && matchesQuery;
    });
  }, [services, query, category]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (service) => {
    setEditing(service);
    setForm(formFrom(service));
    setFormOpen(true);
  };

  const set = (key) => (event) =>
    setForm({ ...form, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      fee: Number(form.fee || 0),
      processingDays: Number(form.processingDays || 7),
      requiredDocuments: form.requiredDocuments
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    };
    try {
      if (editing) {
        await api.patch(`/services/${editing.id}`, payload);
        toast.success('Service updated.');
      } else {
        await api.post('/services', payload);
        toast.success('Service published.');
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const setActive = async (service, isActive) => {
    if (!isActive && !window.confirm(`Deactivate ${service.name}? Citizens will no longer see it in the catalogue.`)) return;
    setWorking(service.id);
    try {
      if (isActive) {
        await api.patch(`/services/${service.id}`, { isActive: true });
        toast.success('Service reactivated.');
      } else {
        await api.delete(`/services/${service.id}`);
        toast.success('Service deactivated.');
      }
      await load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setWorking('');
    }
  };

  const stats = useMemo(
    () => ({
      total: services.length,
      active: services.filter((service) => service.isActive).length,
      applications: services.reduce((sum, service) => sum + (service._count?.applications || 0), 0),
      averageDays: services.length
        ? Math.round(services.reduce((sum, service) => sum + service.processingDays, 0) / services.length)
        : 0,
    }),
    [services]
  );

  return (
    <div>
      <PageHeader
        eyebrow="Service catalogue"
        title="Services"
        description="Publish fees, eligibility rules and document checklists for every citizen service."
        actions={
          <Button onClick={openCreate}>
            <Plus size={15} /> New service
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Services', value: stats.total, icon: Landmark },
          { label: 'Published', value: stats.active, icon: Power },
          { label: 'Applications', value: stats.applications, icon: FileText },
          { label: 'Avg. SLA (days)', value: stats.averageDays, icon: Timer },
        ].map((item) => (
          <Card key={item.label} className="flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
              <item.icon size={17} />
            </span>
            <div>
              <p className="text-lg font-extrabold text-navy">{item.value}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mb-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search services by name, code or category"
              className="input pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={cx(
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  category === item ? 'bg-navy text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:text-navy'
                )}
              >
                {item === 'ALL' ? 'All categories' : item}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {error && <Alert type="danger" className="mb-4">{error}</Alert>}

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingBlock label="Loading services..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title="No services match"
            description="Adjust the search or category filter, or publish a new service."
            action={<Button size="sm" variant="soft" onClick={openCreate}><Plus size={14} /> New service</Button>}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Category</th>
                  <th>Fee</th>
                  <th>SLA</th>
                  <th>Documents</th>
                  <th>Applications</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((service) => (
                  <tr key={service.id} className="transition hover:bg-slate-50/70">
                    <td>
                      <p className="text-sm font-bold text-navy">{service.name}</p>
                      <p className="font-mono text-[10px] uppercase tracking-wide text-slate-400">{service.code}</p>
                    </td>
                    <td className="text-xs text-slate-600">{service.category}</td>
                    <td className="font-semibold text-navy">{inr(service.fee)}</td>
                    <td className="text-xs text-slate-600">{service.processingDays} days</td>
                    <td className="text-xs text-slate-600">{service.requiredDocuments?.length || 0}</td>
                    <td className="text-xs text-slate-600">{service._count?.applications || 0}</td>
                    <td><Badge status={service.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                    <td className="text-right whitespace-nowrap">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(service)}>
                        <Pencil size={13} /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={working === service.id}
                        onClick={() => setActive(service, !service.isActive)}
                        className={service.isActive ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-700 hover:bg-emerald-50'}
                      >
                        <Power size={13} /> {service.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit service' : 'Publish a new service'}
        description="Changes apply immediately to the citizen service catalogue."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button form="service-form" type="submit" loading={saving}>{editing ? 'Save changes' : 'Publish service'}</Button>
          </>
        }
      >
        <form id="service-form" onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Service name">
              <input required value={form.name} onChange={set('name')} placeholder="e.g. Layout Approval" className="input" />
            </Field>
            <Field label="Service code" hint="Letters, numbers and underscores only">
              <input required value={form.code} onChange={set('code')} placeholder="LAYOUT_APPROVAL" className="input font-mono" />
            </Field>
            <Field label="Category">
              <input required value={form.category} onChange={set('category')} placeholder="e.g. Land & Layout" className="input" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Fee (INR)">
                <input type="number" min="0" step="1" value={form.fee} onChange={set('fee')} className="input" />
              </Field>
              <Field label="SLA (days)">
                <input type="number" min="1" max="180" value={form.processingDays} onChange={set('processingDays')} className="input" />
              </Field>
            </div>
          </div>

          <Field label="Description">
            <textarea required value={form.description} onChange={set('description')} className="textarea" rows={3} />
          </Field>

          <Field label="Eligibility">
            <textarea required value={form.eligibility} onChange={set('eligibility')} className="textarea" rows={2} />
          </Field>

          <Field label="Required documents" hint="One document per line">
            <textarea
              value={form.requiredDocuments}
              onChange={set('requiredDocuments')}
              className="textarea font-mono text-xs"
              rows={5}
              placeholder={'Aadhaar card\nSale deed\nLayout plan'}
            />
          </Field>

          <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-xs font-semibold text-slate-600">
            <input type="checkbox" checked={form.isActive} onChange={set('isActive')} className="h-4 w-4 rounded border-slate-300 text-teal-600" />
            Published in the citizen catalogue
          </label>
        </form>
      </Modal>
    </div>
  );
}
