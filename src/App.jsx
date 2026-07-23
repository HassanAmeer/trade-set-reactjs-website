import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
// Critical pages - load immediately
import Home from './pages/Home';
import Market from './pages/Market';
import Trade from './pages/Trade';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Non-critical pages - lazy load
const Mining = lazy(() => import('./pages/mining'));
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
const BinaryHistory = lazy(() => import('./pages/BinaryHistory'));
const LiveChat = lazy(() => import('./pages/LiveChat'));
const P2P = lazy(() => import('./pages/P2P'));

import ShimmerScreen from './components/ShimmerScreen';
import NotFound from './pages/NotFound';
import FloatingChatButton from './components/FloatingChatButton';
import { Home as HomeIcon, BarChart2, Activity, Pickaxe, User } from 'lucide-react';
import { MarketProvider } from './context/MarketContext';
import { AuthProvider } from './context/AuthContext';
import { BrandingProvider, useBranding } from './context/BrandingContext';
import './App.css';

const BottomNav = () => {
  const location = useLocation();
  const path = location.pathname;
  const [toastMsg, setToastMsg] = useState('');

  // Hide bottom nav on auth pages, chat page, and admin routes
  if (path === '/login' || path === '/signup' || path === '/forgot-password' || path === '/chat' || path.startsWith('/set') || path.startsWith('/admin')) return null;

  const handleNavClick = (e, targetPath) => {
    if (localStorage.getItem('isTrading') === 'true' && targetPath !== '/trade') {
      e.preventDefault();
      setToastMsg('Cannot navigate until trade ends');
      // clear timeout if already exists, but simply setting a new one works for short toasts
      setTimeout(() => setToastMsg(''), 2500);
    }
  };

  const navItems = [
    { name: 'Home', path: '/', icon: HomeIcon },
    { name: 'Market', path: '/market', icon: BarChart2 },
    { name: 'Trade', path: '/trade', icon: Activity },
    { name: 'Mining', path: '/mining', icon: Pickaxe },
    { name: 'User', path: '/profile', icon: User }
  ];

  return (
    <>
      <nav className="bottom-nav">
        {navItems.map(item => (
          <Link
            key={item.name}
            to={item.path}
            onClick={(e) => handleNavClick(e, item.path)}
            className={`nav-item ${path === item.path ? 'active' : ''}`}
          >
            <item.icon size={20} />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Navigation Warning Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'fixed',
              bottom: '15%',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(20, 20, 20, 0.95)',
              border: '1px solid #ff9800', // Warning orange
              color: '#ff9800',
              padding: '12px 20px',
              borderRadius: '12px',
              zIndex: 9999,
              boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
              fontSize: '13px',
              fontWeight: '800',
              whiteSpace: 'nowrap',
              pointerEvents: 'none'
            }}
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const AppContent = () => {
  const location = useLocation();
  const path = location.pathname;
  const isAdminRoute = path.startsWith('/set') || path.startsWith('/admin');
  const { isWebsiteEnabled, loading } = useBranding();

  if (loading) {
    return <ShimmerScreen />;
  }

  if (!isWebsiteEnabled && !isAdminRoute) {
    return <NotFound />;
  }

  return (
    <div className={isAdminRoute ? "admin-root-wrapper" : "mobile-layout-wrapper"}>
      <Suspense fallback={<ShimmerScreen />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/market" element={<Market />} />
          <Route path="/trade" element={<Trade />} />
          <Route path="/trade-history" element={<TradesRecord />} />
          <Route path="/binary-history" element={<BinaryHistory />} />
          <Route path="/mining" element={<Mining />} />
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
          <Route path="/chat" element={<LiveChat />} />
          <Route path="/p2p" element={<P2P />} />

          {/* Admin Routes */}
          <Route path="/set" element={<AdminLogin />} />
          <Route path="/admin/*" element={<AdminDashboard />} />

          {/* Catch-all fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <FloatingChatButton />
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
