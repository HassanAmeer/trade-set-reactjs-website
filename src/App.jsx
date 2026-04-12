import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Market from './pages/Market';
import Trade from './pages/Trade';
import Coin from './pages/Coin';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Verification from './pages/Verification';
import Deposit from './pages/Deposit';
import Withdrawal from './pages/Withdrawal';
import C2C from './pages/C2C';
import CustomerService from './pages/CustomerService';
import SelectLanguage from './pages/SelectLanguage';
import Messages from './pages/Messages';
import NewsAndBlog from './pages/NewsAndBlog';
import { Home as HomeIcon, BarChart2, Activity, Zap, User } from 'lucide-react';
import { MarketProvider } from './context/MarketContext';
import { AuthProvider } from './context/AuthContext';
import './App.css';

const BottomNav = () => {
  const location = useLocation();
  const path = location.pathname;

  // Hide bottom nav on login/signup pages
  if (path === '/login' || path === '/signup') return null;

  const navItems = [
    { name: 'Home', path: '/', icon: HomeIcon },
    { name: 'Market', path: '/market', icon: BarChart2 },
    { name: 'Trade', path: '/trade', icon: Activity },
    { name: 'Coin', path: '/coin', icon: Zap },
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

function App() {
  return (
    <AuthProvider>
      <MarketProvider>
        <Router>
          <div style={{ minHeight: '100vh', position: 'relative' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/market" element={<Market />} />
              <Route path="/trade" element={<Trade />} />
              <Route path="/coin" element={<Coin />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/verification" element={<Verification />} />
              <Route path="/deposit" element={<Deposit />} />
              <Route path="/withdrawal" element={<Withdrawal />} />
              <Route path="/c2c" element={<C2C />} />
              <Route path="/support" element={<CustomerService />} />
              <Route path="/language" element={<SelectLanguage />} />
              <Route path="/inbox" element={<Messages />} />
              <Route path="/news" element={<NewsAndBlog />} />
            </Routes>
            <BottomNav />
          </div>
        </Router>
      </MarketProvider>
    </AuthProvider>
  );
}

export default App;
