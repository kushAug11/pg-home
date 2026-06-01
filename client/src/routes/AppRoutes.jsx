import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';
import PublicLayout from '../components/layout/PublicLayout';
import DashboardLayout from '../components/layout/DashboardLayout';

// Public Pages
import Home from '../pages/public/Home';
import Pricing from '../pages/public/Pricing';
import Features from '../pages/public/Features';
import Login from '../pages/public/Login';
import Register from '../pages/public/Register';
import ForgotPassword from '../pages/public/ForgotPassword';
import ResetPassword from '../pages/public/ResetPassword';

import SetupAccount from '../pages/public/SetupAccount';
import PublicPGDetails from '../pages/public/PGDetails';

// Admin Pages
import AdminDashboard from '../pages/admin/PlatformDashboard'; // Will rename later

import PGManagement from '../pages/admin/PGManagement';
import AuditLogs from '../pages/admin/AuditLogs';

// Owner Pages
import OwnerDashboard from '../pages/owner/Dashboard';
import OwnerRooms from '../pages/owner/Rooms';
import OwnerTenants from '../pages/owner/Tenants';
import OwnerPayments from '../pages/owner/Payments';
import OwnerComplaints from '../pages/owner/Complaints';
import OwnerNotices from '../pages/owner/Notices';
import OwnerExpenses from '../pages/owner/Expenses';
import MessManagement from '../pages/owner/MessManagement';
import VisitorLog from '../pages/owner/VisitorLog';
import VisitRequests from '../pages/owner/VisitRequests';
import Housekeeping from '../pages/owner/Housekeeping';
import Inventory from '../pages/owner/Inventory';

// Tenant Pages
import TenantDashboard from '../pages/tenant/Dashboard';
import TenantPayments from '../pages/tenant/Payments';
import TenantComplaints from '../pages/tenant/Complaints';
import TenantFood from '../pages/tenant/Food';
import TenantVisitors from '../pages/tenant/Visitors';

import SocketTest from '../components/common/SocketTest';

const AppRoutes = () => {
    return (
        <>
            <SocketTest />
            <Routes>
                {/* Public Routes */}
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/features" element={<Features />} />
                    <Route path="/pg/:id" element={<PublicPGDetails />} />
                </Route>

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/setup-account" element={<SetupAccount />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'owner', 'tenant']} />}>
                    <Route element={<DashboardLayout />}>

                        {/* Super Admin */}
                        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                        <Route path="/admin/pgs" element={<ProtectedRoute allowedRoles={['admin']}><PGManagement /></ProtectedRoute>} />
                        <Route path="/admin/logs" element={<ProtectedRoute allowedRoles={['admin']}><AuditLogs /></ProtectedRoute>} />

                        {/* PG Owner */}
                        <Route path="/owner" element={<ProtectedRoute allowedRoles={['owner']}><OwnerDashboard /></ProtectedRoute>} />
                        <Route path="/owner/rooms" element={<ProtectedRoute allowedRoles={['owner']}><OwnerRooms /></ProtectedRoute>} />
                        <Route path="/owner/tenants" element={<ProtectedRoute allowedRoles={['owner']}><OwnerTenants /></ProtectedRoute>} />
                        <Route path="/owner/payments" element={<ProtectedRoute allowedRoles={['owner']}><OwnerPayments /></ProtectedRoute>} />
                        <Route path="/owner/complaints" element={<ProtectedRoute allowedRoles={['owner']}><OwnerComplaints /></ProtectedRoute>} />
                        <Route path="/owner/visitors" element={<ProtectedRoute allowedRoles={['owner']}><VisitorLog /></ProtectedRoute>} />
                        <Route path="/owner/requests" element={<ProtectedRoute allowedRoles={['owner']}><VisitRequests /></ProtectedRoute>} />
                        <Route path="/owner/housekeeping" element={<ProtectedRoute allowedRoles={['owner']}><Housekeeping /></ProtectedRoute>} />
                        <Route path="/owner/inventory" element={<ProtectedRoute allowedRoles={['owner']}><Inventory /></ProtectedRoute>} />
                        <Route path="/owner/notices" element={<ProtectedRoute allowedRoles={['owner']}><OwnerNotices /></ProtectedRoute>} />
                        <Route path="/owner/expenses" element={<ProtectedRoute allowedRoles={['owner']}><OwnerExpenses /></ProtectedRoute>} />
                        <Route path="/owner/mess" element={<ProtectedRoute allowedRoles={['owner']}><MessManagement /></ProtectedRoute>} />

                        {/* Tenant */}
                        <Route path="/tenant" element={<ProtectedRoute allowedRoles={['tenant']}><TenantDashboard /></ProtectedRoute>} />
                        <Route path="/tenant/payments" element={<ProtectedRoute allowedRoles={['tenant']}><TenantPayments /></ProtectedRoute>} />
                        <Route path="/tenant/complaints" element={<ProtectedRoute allowedRoles={['tenant']}><TenantComplaints /></ProtectedRoute>} />
                        <Route path="/tenant/food" element={<ProtectedRoute allowedRoles={['tenant']}><TenantFood /></ProtectedRoute>} />
                        <Route path="/tenant/visitors" element={<ProtectedRoute allowedRoles={['tenant']}><TenantVisitors /></ProtectedRoute>} />

                    </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
};

export default AppRoutes;
