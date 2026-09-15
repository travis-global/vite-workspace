// src/App.jsx

import { NotificationProvider } from './context/NotificationContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardShell from './components/layout/DashboardShell';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/accounting/Expenses';
import Revenue from './pages/accounting/Revenue';
import VendorSubscriptions from './pages/accounting/VendorSubscriptions';
import Invoices from './pages/accounting/Invoices';
import VirtualAccounts from './pages/accounting/VirtualAccounts';
import FinancialReports from './pages/accounting/FinancialReports';
import Disbursements from './pages/accounting/Disbursements';
import ReceiptaSubscriptions from './pages/accounting/ReceiptaSubscriptions';
import ContentCalendar from './pages/marketing/ContentCalendar';
import Leads from './pages/marketing/Leads';
import LeadMagnets from './pages/marketing/LeadMagnets';
import Campaigns from './pages/marketing/Campaigns';
import SocialMetrics from './pages/marketing/SocialMetrics';
import MarketingAnalytics from './pages/marketing/MarketingAnalytics';
import FileLibrary from './pages/general/FileLibrary';
import Meetings from './pages/general/Meetings';
import TaskAssignment from './pages/general/TaskAssignment';
import MyTasks from './pages/general/MyTasks';
import Vault from './pages/general/Vault';
import Staff from './pages/general/Staff';
import StaffOnboarding from './pages/general/StaffOnboarding';
import Roles from './pages/general/Roles';
import FeaturesAdmin from './pages/general/FeaturesAdmin';
import WorkerQueries from './pages/general/WorkerQueries';
import Correspondence from './pages/general/Correspondence';
import Notifications from './pages/general/Notifications';
import Chat from './pages/general/Chat';
import Support from './pages/customer_rep/Support';	
import CspManagement from './pages/customer_rep/CspManagement';
import LogMonitor from './pages/technical/LogMonitor';
import StaffSecurity from './pages/technical/StaffSecurity';
import Theme from './pages/general/Theme';
import Salary from './pages/accounting/Salary';
import StaffDirectory from './pages/general/StaffDirectory';
import AiUsage from './pages/technical/AiUsage';

// Feature pages get added here as they're built — each one slots in
// under DashboardShell's Outlet, same as Dashboard below. This file
// is intentionally the only place new routes get wired in; the
// Sidebar's FEATURE_ROUTES map (see Sidebar.jsx) already anticipates
// several of these paths.

export default function App() {
  return (
    <BrowserRouter>
     <NotificationProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={<ChangePassword />} />
	  <Route path="accounting/expenses" element={<Expenses />} />
	  <Route path="accounting/revenue" element={<Revenue />} />
	  <Route path="accounting/vendor-subscriptions" element={<VendorSubscriptions />} />
	  <Route path="accounting/invoices" element={<Invoices />} />
	  <Route path="accounting/virtual-accounts" element={<VirtualAccounts />} />
	  <Route path="accounting/reports" element={<FinancialReports />} />
	  <Route path="accounting/disbursements" element={<Disbursements />} />
	  <Route path="accounting/receipta-subscriptions" element={<ReceiptaSubscriptions />} />
	  <Route path="marketing/calendar" element={<ContentCalendar />} />
	  <Route path="marketing/leads" element={<Leads />} />
	  <Route path="marketing/lead-magnets" element={<LeadMagnets />} />
	  <Route path="marketing/campaigns" element={<Campaigns />} />
	  <Route path="marketing/social-metrics" element={<SocialMetrics />} />
	  <Route path="marketing/analytics" element={<MarketingAnalytics />} />
	  <Route path="files" element={<FileLibrary />} />
	  <Route path="meetings" element={<Meetings />} />
          <Route path="tasks" element={<TaskAssignment />} />
          <Route path="tasks/mine" element={<MyTasks />} />
	  <Route path="vault" element={<Vault />} />
	  <Route path="staff" element={<Staff />} />
	  <Route path="staff/onboarding" element={<StaffOnboarding />} />
	  <Route path="roles" element={<Roles />} />
	  <Route path="admin/features" element={<FeaturesAdmin />} />
	  <Route path="worker-queries" element={<WorkerQueries />} />
	  <Route path="correspondence" element={<Correspondence />} />
	  <Route path="notifications" element={<Notifications />} />
	  <Route path="chat" element={<Chat />} />
	  <Route path="support" element={<Support />} />
	  <Route path="support/reps" element={<CspManagement />} />
	  <Route path="logs" element={<LogMonitor />} />
 	  <Route path="security" element={<StaffSecurity />} />
	  <Route path="theme" element={<Theme />} />
	  <Route path="accounting/salary" element={<Salary />} />
	  <Route path="directory" element={<StaffDirectory />} />
	  <Route path="ai-usage" element={<AiUsage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            {/* Additional feature routes get added here as pages are built,
                e.g.: <Route path="accounting/expenses" element={<Expenses />} /> */}
          </Route>
        </Routes>
	    </AuthProvider>  
	   </NotificationProvider>
    </BrowserRouter>
  );
}
