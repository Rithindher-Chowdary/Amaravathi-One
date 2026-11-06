import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '../components/ui';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-surface px-4">
      <div className="max-w-md text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-navy text-teal-100">
          <Compass size={26} />
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-teal-700">404</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy">This page could not be found</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          The link may be outdated, or you may not have access to this part of the platform.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft size={16} /> Back home
            </Button>
          </Link>
          <Link to="/login">
            <Button>Sign in</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
