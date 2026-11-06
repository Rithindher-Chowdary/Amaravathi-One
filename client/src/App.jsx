import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from './components/PublicLayout';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import NotFound from './pages/NotFound';
import Dashboard from './pages/dashboard/Dashboard';
import Services from './pages/services/Services';
import ServiceDetail from './pages/services/ServiceDetail';
import Applications from './pages/applications/Applications';
import ApplicationDetail from './pages/applications/ApplicationDetail';
import Wallet from './pages/wallet/Wallet';
import Payments from './pages/payments/Payments';
import Notifications from './pages/notifications/Notifications';
import Profile from './pages/profile/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import Citizens from './pages/admin/Citizens';
import AdminServices from './pages/admin/AdminServices';
import AdminApplications from './pages/admin/AdminApplications';
import AdminPayments from './pages/admin/AdminPayments';
import AdminDueDates from './pages/admin/AdminDueDates';
import AdminNotifications from './pages/admin/AdminNotifications';
import Reports from './pages/admin/Reports';
import OfficerDashboard from './pages/officer/OfficerDashboard';
import OfficerApplications from './pages/officer/OfficerApplications';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute roles={['CITIZEN']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="services" element={<Services />} />
        <Route path="services/:id" element={<ServiceDetail />} />
        <Route path="applications" element={<Applications />} />
        <Route path="applications/:id" element={<ApplicationDetail />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="payments" element={<Payments />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="citizens" element={<Citizens />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="applications" element={<AdminApplications />} />
        <Route path="applications/:id" element={<ApplicationDetail />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="due-dates" element={<AdminDueDates />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="reports" element={<Reports />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route
        path="/officer"
        element={
          <ProtectedRoute roles={['OFFICER']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OfficerDashboard />} />
        <Route path="applications" element={<OfficerApplications />} />
        <Route path="applications/:id" element={<ApplicationDetail />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
