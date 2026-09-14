import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Navigate } from 'react-router-dom';

// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Layouts
import UserLayout from '@/components/wb/UserLayout';
import AdminLayout from '@/components/wb/AdminLayout';
import AdminRoute from '@/components/wb/AdminRoute';

// User pages
import UserDashboard from '@/pages/wb/UserDashboard';
import Invest from '@/pages/wb/Invest';
import MyInvestments from '@/pages/wb/MyInvestments';
import Transactions from '@/pages/wb/Transactions';
import Withdraw from '@/pages/wb/Withdraw';
import Notifications from '@/pages/wb/Notifications';
import Profile from '@/pages/wb/Profile';
import Help from '@/pages/wb/Help';

// Admin pages
import AdminDashboard from '@/pages/wb/admin/AdminDashboard';
import AdminMembers from '@/pages/wb/admin/AdminMembers';
import AdminDeposits from '@/pages/wb/admin/AdminDeposits';
import AdminInvestments from '@/pages/wb/admin/AdminInvestments';
import AdminWithdrawals from '@/pages/wb/admin/AdminWithdrawals';
import AdminTransactions from '@/pages/wb/admin/AdminTransactions';
import AdminRates from '@/pages/wb/admin/AdminRates';
import AdminFees from '@/pages/wb/admin/AdminFees';
import AdminNotifications from '@/pages/wb/admin/AdminNotifications';
import AdminEmailLogs from '@/pages/wb/admin/AdminEmailLogs';
import AdminAuditLogs from '@/pages/wb/admin/AdminAuditLogs';
import AdminSettings from '@/pages/wb/admin/AdminSettings';

function HomeRedirect() {
  const { user, isAuthenticated, isLoadingAuth, authChecked } = useAuth();
  if (isLoadingAuth || !authChecked) return <div className="fixed inset-0 flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const role = user?.role || user?.data?.role;
  return (role === 'admin' || role === 'super_admin') ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />;
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
      const isPublicAuthPage =
  window.location.pathname === "/login" ||
  window.location.pathname === "/register" ||
  window.location.pathname === "/forgot-password" ||
  window.location.pathname === "/reset-password";

if (authError && !isPublicAuthPage) {
  if (authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  } else if (authError.type === 'auth_required') {
    navigateToLogin();
    return null;
  }
}


  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/" element={<HomeRedirect />} />
        <Route element={<UserLayout />}>
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/invest" element={<Invest />} />
          <Route path="/my-investments" element={<MyInvestments />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/help" element={<Help />} />
        </Route>
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="members" element={<AdminMembers />} />
          <Route path="deposits" element={<AdminDeposits />} />
          <Route path="investments" element={<AdminInvestments />} />
          <Route path="withdrawals" element={<AdminWithdrawals />} />
          <Route path="transactions" element={<AdminTransactions />} />
          <Route path="rates" element={<AdminRoute requiredRole="super_admin"><AdminRates /></AdminRoute>} />
          <Route path="fees" element={<AdminRoute requiredRole="super_admin"><AdminFees /></AdminRoute>} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="email-logs" element={<AdminEmailLogs />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="settings" element={<AdminRoute requiredRole="super_admin"><AdminSettings /></AdminRoute>} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App