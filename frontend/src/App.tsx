import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { brandService } from './services/brandService';
import { Brand } from './types';

// Layout & Components
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OtpVerifyPage } from './pages/OtpVerifyPage';
import { ForgotPasswordPage, ResetPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { BrandProfilesPage } from './pages/BrandProfilesPage';
import { BrandDetailPage } from './pages/BrandDetailPage';
import { SocialMonitoringPage } from './pages/SocialMonitoringPage';
import { AppStoreMonitoringPage } from './pages/AppStoreMonitoringPage';
import { ThreatDetailsPage } from './pages/ThreatDetailsPage';
import { InvestigationsPage } from './pages/InvestigationsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { DataSourceSettingsPage } from './pages/DataSourceSettingsPage';
import { HelpDocsPage } from './pages/HelpDocsPage';

// Authenticated Layout wrapper
const AppLayout: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadBrands();
    }
  }, [isAuthenticated]);

  const loadBrands = async () => {
    try {
      const data = await brandService.getBrands();
      setBrands(data);
      if (data.length > 0 && !selectedBrand) {
        setSelectedBrand(data[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-slate-400 text-sm">
        Authenticating session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#0b1120] text-slate-100 font-sans">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          selectedBrand={selectedBrand}
          setSelectedBrand={setSelectedBrand}
          brands={brands}
          onScanComplete={loadBrands}
        />
        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ selectedBrand, brands, refreshBrands: loadBrands }} />
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Auth Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<OtpVerifyPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Application Workspace */}
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage selectedBrand={null} />} />
            <Route path="brands" element={<BrandProfilesPage />} />
            <Route path="brands/:id" element={<BrandDetailPage />} />
            <Route path="social" element={<SocialMonitoringPage selectedBrand={null} />} />
            <Route path="apps" element={<AppStoreMonitoringPage selectedBrand={null} />} />
            <Route path="threats" element={<InvestigationsPage />} />
            <Route path="threats/:id" element={<ThreatDetailsPage />} />
            <Route path="investigations" element={<InvestigationsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="sources" element={<DataSourceSettingsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="docs" element={<HelpDocsPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
