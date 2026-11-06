import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, MapPin, Phone, Search, UserCheck, UserX, Users } from 'lucide-react';
import api, { apiError } from '../../lib/api';
import { dateFmt, initials } from '../../lib/format';
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

export default function Citizens() {
  const toast = useToast();
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [working, setWorking] = useState(false);

  const load = async (term = search) => {
    const { data } = await api.get('/admin/citizens', { params: term ? { search: term } : {} });
    setCitizens(data.citizens);
    return data.citizens;
  };

  useEffect(() => {
    setLoading(true);
    load(search)
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filtered = useMemo(
    () =>
      filter === 'ALL'
        ? citizens
        : citizens.filter((citizen) => (filter === 'ACTIVE' ? citizen.isActive : !citizen.isActive)),
    [citizens, filter]
  );

  const stats = useMemo(
    () => ({
      total: citizens.length,
      active: citizens.filter((citizen) => citizen.isActive).length,
      verified: citizens.filter((citizen) => citizen.phoneVerified).length,
      applications: citizens.reduce((sum, citizen) => sum + (citizen._count?.applications || 0), 0),
    }),
    [citizens]
  );

  const toggleActive = async (citizen) => {
    setWorking(true);
    try {
      const { data } = await api.patch(`/admin/citizens/${citizen.id}`, { isActive: !citizen.isActive });
      setCitizens((current) =>
        current.map((item) => (item.id === citizen.id ? { ...item, isActive: data.user.isActive } : item))
      );
      setSelected((current) =>
        current && current.id === citizen.id ? { ...current, isActive: data.user.isActive } : current
      );
      toast.success(data.user.isActive ? 'Citizen account reactivated.' : 'Citizen account deactivated.');
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setWorking(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Citizen directory"
        title="Citizens"
        description="Search registered citizens, review their APCRDA footprint and control account access."
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Citizens', value: stats.total, icon: Users },
          { label: 'Active accounts', value: stats.active, icon: UserCheck },
          { label: 'Phone verified', value: stats.verified, icon: BadgeCheck },
          { label: 'Applications filed', value: stats.applications, icon: MapPin },
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
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(query.trim());
          }}
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, email or mobile number"
              className="input pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Search</Button>
            {search && (
              <Button
                variant="ghost"
                onClick={() => {
                  setQuery('');
                  setSearch('');
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </form>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[
            { key: 'ALL', label: 'All citizens' },
            { key: 'ACTIVE', label: 'Active' },
            { key: 'INACTIVE', label: 'Deactivated' },
          ].map((item) => (
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
      </Card>

      {error && <Alert type="danger" className="mb-4">{error}</Alert>}

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingBlock label="Loading citizen directory..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No citizens found"
            description={search ? `No accounts match “${search}”. Try a different search.` : 'Registered citizens will appear here.'}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Citizen</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Usage</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((citizen) => (
                  <tr key={citizen.id} className="transition hover:bg-slate-50/70">
                    <td>
                      <button type="button" onClick={() => setSelected(citizen)} className="flex items-center gap-2.5 text-left">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-navy text-[11px] font-bold text-white">
                          {initials(citizen.fullName)}
                        </span>
                        <span>
                          <span className="block text-sm font-bold text-navy">{citizen.fullName}</span>
                          <span className="block text-[11px] text-slate-400">{citizen.email}</span>
                        </span>
                      </button>
                    </td>
                    <td>
                      <p className="text-xs text-slate-600">{citizen.phone || '—'}</p>
                      <p className="text-[10px] font-semibold text-slate-400">
                        {citizen.phoneVerified ? 'Verified' : 'Unverified'}
                      </p>
                    </td>
                    <td className="text-xs text-slate-500">
                      {citizen.profile?.city || '—'}
                      {citizen.profile?.district ? `, ${citizen.profile.district}` : ''}
                    </td>
                    <td>
                      <p className="text-xs text-slate-600">
                        {citizen._count?.applications || 0} applications
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {citizen._count?.credentials || 0} credentials · {citizen._count?.payments || 0} payments
                      </p>
                    </td>
                    <td className="text-xs text-slate-500">{dateFmt(citizen.createdAt)}</td>
                    <td><Badge status={citizen.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                    <td className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelected(citizen)}>Review</Button>
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
        onClose={() => setSelected(null)}
        title={selected?.fullName}
        description={selected?.email}
        footer={
          selected && (
            <>
              <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
              <Button
                variant={selected.isActive ? 'danger' : 'teal'}
                loading={working}
                onClick={() => toggleActive(selected)}
              >
                {selected.isActive ? <><UserX size={15} /> Deactivate account</> : <><UserCheck size={15} /> Reactivate account</>}
              </Button>
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-navy text-sm font-bold text-white">
                {initials(selected.fullName)}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-navy">{selected.fullName}</p>
                <p className="text-xs text-slate-500">{selected.email}</p>
                <div className="mt-1 flex gap-1.5">
                  <Badge status={selected.isActive ? 'ACTIVE' : 'INACTIVE'} />
                  {selected.phoneVerified && <Badge status="VERIFIED" />}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Mini label="Applications" value={selected._count?.applications || 0} />
              <Mini label="Credentials" value={selected._count?.credentials || 0} />
              <Mini label="Payments" value={selected._count?.payments || 0} />
            </div>

            <div className="grid gap-2 text-xs">
              <InfoRow icon={Phone} label="Mobile" value={selected.phone || 'Not provided'} />
              <InfoRow
                icon={MapPin}
                label="Address"
                value={
                  selected.profile?.addressLine
                    ? `${selected.profile.addressLine}, ${selected.profile.city || ''}`
                    : 'Not provided'
                }
              />
              <InfoRow icon={BadgeCheck} label="Aadhaar on file" value={selected.profile?.aadhaarNumber || 'Not provided'} />
              <InfoRow icon={Users} label="Joined" value={dateFmt(selected.createdAt)} />
            </div>

            <Field label="Account controls" hint="Deactivation immediately blocks new sign-ins but preserves records.">
              <div className="rounded-xl border border-slate-200 p-3 text-xs text-slate-500">
                Role is locked to Citizen from this view to avoid accidental privilege escalation in the prototype.
              </div>
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 p-3 text-center">
      <p className="text-lg font-extrabold text-navy">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-slate-50 px-3 py-2">
      <Icon size={14} className="mt-0.5 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-slate-600">{value}</p>
      </div>
    </div>
  );
}
