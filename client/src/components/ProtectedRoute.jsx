import { Navigate } from 'react-router-dom';
import { homeFor, useAuth } from '../context/AuthContext';
import { FullScreenLoader } from './ui';

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;

  return children;
}
