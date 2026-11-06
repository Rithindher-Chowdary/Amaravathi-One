import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CalendarClock,
  Droplets,
  FileText,
  HardHat,
  Landmark,
  Megaphone,
  Search,
  Store,
  Zap,
} from 'lucide-react';
import api, { apiError } from '../../lib/api';
import { inr } from '../../lib/format';
import { Alert, Card, EmptyState, LoadingBlock, PageHeader, cx } from '../../components/ui';

const categoryIcons = {
  'Property Services': Building2,
  'Water Services': Droplets,
  'Electricity Services': Zap,
  'Building Permissions': HardHat,
  'Trade Licences': Store,
  'Municipal Services': Landmark,
  'Public Grievances': Megaphone,
};

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');

  useEffect(() => {
    api
      .get('/services')
      .then(({ data }) => setServices(data.services))
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => ['All', ...new Set(services.map((service) => service.category))], [services]);

  const filtered = useMemo(
    () =>
      services.filter((service) => {
        const matchesCategory = category === 'All' || service.category === category;
        const matchesQuery =
          !query ||
          service.name.toLowerCase().includes(query.toLowerCase()) ||
          service.description.toLowerCase().includes(query.toLowerCase());
        return matchesCategory && matchesQuery;
      }),
    [services, category, query]
  );

  return (
    <div>
      <PageHeader
        eyebrow="Service directory"
        title="Government services"
        description="Find the service you need, review eligibility and required documents, then apply online."
      />

      <Card className="mb-5 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search services..."
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
                  category === item
                    ? 'bg-navy text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-navy'
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {error && <Alert type="danger" className="mb-4">{error}</Alert>}
      {loading ? (
        <LoadingBlock label="Loading services..." />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Search}
            title="No services match your search"
            description="Try a different keyword or clear the category filter."
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((service) => {
            const Icon = categoryIcons[service.category] || FileText;
            return (
              <Link
                key={service.id}
                to={`/app/services/${service.id}`}
                className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lift"
              >
                <div className="flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy-50 text-navy transition group-hover:bg-teal-50 group-hover:text-teal-700">
                    <Icon size={20} />
                  </span>
                  <ArrowRight size={17} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-teal" />
                </div>
                <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-teal-700">{service.category}</p>
                <h3 className="mt-1 text-[15px] font-bold leading-snug text-navy">{service.name}</h3>
                <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-6 text-slate-500">{service.description}</p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                  <span className="font-bold text-navy">{Number(service.fee) === 0 ? 'No fee' : inr(service.fee)}</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <CalendarClock size={12} /> {service.processingDays} days
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400">
                  {service.requiredDocuments?.length || 0} documents required
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
