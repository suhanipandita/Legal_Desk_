import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { PrivateRoute, DashboardLayout } from './components/Layout';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageCases from './pages/admin/ManageCases';
import ManageStaff from './pages/admin/ManageStaff';
import AdminBilling from './pages/admin/Billing';

// Lawyer
import LawyerDashboard from './pages/lawyer/LawyerDashboard';
import LawyerCases from './pages/lawyer/LawyerCases';
import CaseDetail from './pages/lawyer/CaseDetail';
import AIAnalyzer from './pages/lawyer/AIAnalyzer';
import DocumentVault from './pages/lawyer/DocumentVault';
import Calendar from './pages/lawyer/Calendar';
import ExpenseTracker from './pages/lawyer/ExpenseTracker';

// Client
import ClientDashboard from './pages/client/ClientDashboard';
import MyCases from './pages/client/MyCases';
import BookAppointment from './pages/client/BookAppointment';
import MyDocuments from './pages/client/MyDocuments';

function RootRedirect() {
  const { user, token } = useSelector((state) => state.auth);
  if (token && user) {
    return <Navigate to={`/${user.role}`} replace />;
  }
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<RootRedirect />} />

        {/* Admin Routes */}
        <Route element={<PrivateRoute allowedRoles={['admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/cases" element={<ManageCases />} />
            <Route path="/admin/staff" element={<ManageStaff />} />
            <Route path="/admin/billing" element={<AdminBilling />} />
          </Route>
        </Route>

        {/* Lawyer Routes */}
        <Route element={<PrivateRoute allowedRoles={['lawyer']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/lawyer" element={<LawyerDashboard />} />
            <Route path="/lawyer/cases" element={<LawyerCases />} />
            <Route path="/lawyer/cases/:id" element={<CaseDetail />} />
            <Route path="/lawyer/ai-analyzer" element={<AIAnalyzer />} />
            <Route path="/lawyer/documents" element={<DocumentVault />} />
            <Route path="/lawyer/calendar" element={<Calendar />} />
            <Route path="/lawyer/billing" element={<ExpenseTracker />} />
          </Route>
        </Route>

        {/* Client Routes */}
        <Route element={<PrivateRoute allowedRoles={['client']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/client" element={<ClientDashboard />} />
            <Route path="/client/cases" element={<MyCases />} />
            <Route path="/client/cases/:id" element={<CaseDetail />} />
            <Route path="/client/appointments" element={<BookAppointment />} />
            <Route path="/client/documents" element={<MyDocuments />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer position="bottom-right" theme="dark" />
    </BrowserRouter>
  );
}
