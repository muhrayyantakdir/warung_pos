import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';

import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import MobileBottomNav from './components/layout/MobileBottomNav';

import DashboardPage from './pages/DashboardPage';
import PosPage from './pages/PosPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import TransactionsPage from './pages/TransactionsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

import { api } from './services/api';

function MainApp() {
  const { isAuthenticated, loading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);

  // Poll or refresh low stock count for sidebar & mobile badges
  const updateGlobalStats = async () => {
    try {
      const res = await api.getDashboardStats();
      if (res.success && res.data?.inventory) {
        setLowStockCount(res.data.inventory.low_stock_count || 0);
      }
    } catch (err) {
      // Backend not yet reachable or loading
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      updateGlobalStats();
    }
  }, [activePage, isAuthenticated]);

  // Loading spinner during session restoration
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--brand-dark)',
          color: 'white',
          gap: '16px'
        }}
      >
        <div className="sidebar-logo-badge" style={{ width: '48px', height: '48px', fontSize: '24px' }}>
          🏪
        </div>
        <p style={{ fontSize: '14px', color: 'var(--brand-mint)' }}>
          Memuat sesi kasir WARUNG POS...
        </p>
      </div>
    );
  }

  // 1. Authentication Gate: If not logged in, show LoginPage
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // 2. Main Page Switcher
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage setActivePage={setActivePage} />;
      case 'pos':
        return <PosPage />;
      case 'products':
        return <ProductsPage setActivePage={setActivePage} />;
      case 'categories':
        return <CategoriesPage />;
      case 'transactions':
        return <TransactionsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="app-container">
      {/* Desktop & Tablet Sidebar */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        lowStockCount={lowStockCount}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main View Area */}
      <div className="app-main">
        <Header
          activePage={activePage}
          setActivePage={setActivePage}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <main className="app-content-body">
          {renderPage()}
        </main>

        {/* Smartphone Floating Bottom Navigation */}
        <MobileBottomNav
          activePage={activePage}
          setActivePage={setActivePage}
          onOpenMenu={() => setIsSidebarOpen(true)}
          lowStockCount={lowStockCount}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
