import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { db } from './firebase-setup';
import { doc, onSnapshot } from 'firebase/firestore';

// Critical pages - load immediately
import Home from './pages/Home';
import Market from './pages/Market';
import Trade from './pages/Trade';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Non-critical pages - lazy load
const Coin = lazy(() => import('./pages/Coin'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Verification = lazy(() => import('./pages/Verification'));
const Deposit = lazy(() => import('./pages/Deposit'));
const DepositHistory = lazy(() => import('./pages/DepositHistory'));
const Withdrawal = lazy(() => import('./pages/Withdrawal'));
const WithdrawalHistory = lazy(() => import('./pages/WithdrawalHistory'));
const C2C = lazy(() => import('./pages/C2C'));
const CustomerService = lazy(() => import('./pages/CustomerService'));
const Messages = lazy(() => import('./pages/Messages'));
const NewsAndBlog = lazy(() => import('./pages/NewsAndBlog'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const TradesRecord = lazy(() => import('./pages/TradesRecord'));

import { Home as HomeIcon, BarChart2, Activity, Pickaxe, User } from 'lucide-react';
import { MarketProvider } from './context/MarketContext';
import { AuthProvider } from './context/AuthContext';
import { BrandingProvider } from './context/BrandingContext';
import './App.css';

const BottomNav = () => {
  const location = useLocation();
  const path = location.pathname;

  // Hide bottom nav on auth pages and admin routes
  if (path === '/login' || path === '/signup' || path === '/forgot-password' || path.startsWith('/set') || path.startsWith('/admin')) return null;

  const navItems = [
    { name: 'Home', path: '/', icon: HomeIcon },
    { name: 'Market', path: '/market', icon: BarChart2 },
    { name: 'Trade', path: '/trade', icon: Activity },
    { name: 'Mining', path: '/coin', icon: Pickaxe },
    { name: 'User', path: '/profile', icon: User }
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map(item => (
        <Link
          key={item.name}
          to={item.path}
          className={`nav-item ${path === item.path ? 'active' : ''}`}
        >
          <item.icon size={20} />
          <span>{item.name}</span>
        </Link>
      ))}
    </nav>
  );
};

const AppContent = () => {
  const location = useLocation();
  const path = location.pathname;
  const isAdminRoute = path.startsWith('/set') || path.startsWith('/admin');

  return (
    <div className={isAdminRoute ? "admin-root-wrapper" : "mobile-layout-wrapper"}>
      <Suspense fallback={
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#0a0a0a'
        }}>
          <div className="circular-loader-simple"></div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/market" element={<Market />} />
          <Route path="/trade" element={<Trade />} />
          <Route path="/trade-history" element={<TradesRecord />} />
          <Route path="/coin" element={<Coin />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/deposit-history" element={<DepositHistory />} />
          <Route path="/withdrawal" element={<Withdrawal />} />
          <Route path="/withdrawal-history" element={<WithdrawalHistory />} />
          <Route path="/c2c" element={<C2C />} />
          <Route path="/support" element={<CustomerService />} />
          <Route path="/inbox" element={<Messages />} />
          <Route path="/news" element={<NewsAndBlog />} />
          <Route path="/news/:id" element={<BlogDetail />} />

          {/* Admin Routes */}
          <Route path="/set" element={<AdminLogin />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Routes>
      </Suspense>
      <BottomNav />
    </div>
  );
};

function App() {
  return (
    <BrandingProvider>
      <AuthProvider>
        <MarketProvider>
          <Router>
            <AppContent />
          </Router>
        </MarketProvider>
      </AuthProvider>
    </BrandingProvider>
  );
}

export default App;
