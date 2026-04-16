import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, ShieldCheck, LogOut, Download, Settings, MessageSquare, FileText, Menu, X } from 'lucide-react';
import AdminDeposits from './AdminDeposits';
import AdminWithdrawals from './AdminWithdrawals';
import AdminUsers from './AdminUsers';
import AdminSupport from './AdminSupport';
import AdminKYC from './AdminKYC';
import AdminBlogs from './AdminBlogs';
import AdminSettings from './AdminSettings';
import AdminEmail from './AdminEmail';
import AdminAnnouncements from './AdminAnnouncements';
import AdminRewards from './AdminRewards';
import AdminMenu from './AdminMenu';
import AdminSignals from './AdminSignals';
import AdminCarousel from './AdminCarousel';
import AdminTrades from './AdminTrades';
import { BarChart3, Presentation, Mail, LayoutList, Zap, Megaphone, Trophy } from 'lucide-react';
import { db } from '../../firebase-setup';
import { doc, getDoc } from 'firebase/firestore';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('deposits');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const isAdmin = localStorage.getItem('adminToken');
        if (!isAdmin) {
            navigate('/set');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/set');
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'deposits': return <AdminDeposits />;
            case 'withdrawals': return <AdminWithdrawals />;
            case 'users': return <AdminUsers />;
            case 'support': return <AdminSupport />;
            case 'kyc': return <AdminKYC />;
            case 'blogs': return <AdminBlogs />;
            case 'settings': return <AdminSettings />;
            case 'trades': return <AdminTrades />;
            case 'carousel': return <AdminCarousel />;
            case 'email': return <AdminEmail />;
            case 'announcements': return <AdminAnnouncements />;
            case 'rewards': return <AdminRewards />;
            case 'menu': return <AdminMenu />;
            case 'signals': return <AdminSignals />;
            default: return null;
        }
    };

    const [visibleMenus, setVisibleMenus] = useState({});
    const [isLoadingMenus, setIsLoadingMenus] = useState(true);

    useEffect(() => {
        const fetchMenus = async () => {
            const isAdminSuper = localStorage.getItem('adminToken') === 'super';
            if (isAdminSuper) {
                setIsLoadingMenus(false);
                return;
            }
            try {
                const snap = await getDoc(doc(db, 'admin_set', 'menu_visibility'));
                if (snap.exists()) {
                    setVisibleMenus(snap.data());
                } else {
                    const defaults = {};
                    baseNavItems.forEach(item => { defaults[item.id] = true; });
                    setVisibleMenus(defaults);
                }
            } catch (err) {
                console.error("Error fetching menu config");
            } finally {
                setIsLoadingMenus(false);
            }
        };
        fetchMenus();
    }, []);

    const baseNavItems = [
        { id: 'deposits', label: 'Deposits', icon: <CreditCard size={18} />, section: 'FINANCIAL' },
        { id: 'withdrawals', label: 'Withdrawals', icon: <Download size={18} />, section: 'FINANCIAL' },
        { id: 'users', label: 'Users', icon: <Users size={18} />, section: 'MANAGEMENT' },
        { id: 'support', label: 'Support Center', icon: <MessageSquare size={18} />, section: 'MANAGEMENT' },
        { id: 'kyc', label: 'KYC Approvals', icon: <ShieldCheck size={18} />, section: 'MANAGEMENT' },
        { id: 'blogs', label: 'News & Blogs', icon: <FileText size={18} />, section: 'CONTENT' },
        { id: 'carousel', label: 'Home Banners', icon: <Presentation size={18} />, section: 'CONTENT' },
        { id: 'email', label: 'Email Campaign', icon: <Mail size={18} />, section: 'CONTENT' },
        { id: 'announcements', label: 'Announcements', icon: <Megaphone size={18} />, section: 'CONTENT' },
        { id: 'rewards', label: 'Deposit Rewards', icon: <Trophy size={18} />, section: 'GROWTH' },
        { id: 'signals', label: 'Market Signals', icon: <Zap size={18} />, section: 'GROWTH' },
        { id: 'trades', label: 'Trades Log', icon: <BarChart3 size={18} />, section: 'RECORDS' },
        { id: 'settings', label: 'Settings', icon: <Settings size={18} />, section: 'SYSTEM' },
    ];

    const isAdminSuper = localStorage.getItem('adminToken') === 'super';

    let finalNavItems = isAdminSuper 
        ? [...baseNavItems, { id: 'menu', label: 'Menu Control', icon: <LayoutList size={18} />, section: 'SYSTEM' }]
        : baseNavItems.filter(item => visibleMenus[item.id] !== false);

    // Group items by section for rendering
    const sections = [];
    finalNavItems.forEach(item => {
        let sec = sections.find(s => s.name === item.section);
        if (!sec) {
            sec = { name: item.section, items: [] };
            sections.push(sec);
        }
        sec.items.push(item);
    });

    return (
        <div className="admin-layout">
            {/* Mobile Top Header */}
            <div className="admin-mobile-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <LayoutDashboard size={24} color="#00c087" />
                    <span style={{ fontWeight: '900', color: '#fff' }}>Admin Panel</span>
                </div>
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                >
                    {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* Sidebar / Drawer Overlay */}
            {isMobileMenuOpen && <div className="admin-drawer-overlay" onClick={() => setIsMobileMenuOpen(false)} />}

            {/* Sidebar */}
            <div className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="admin-sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', color: '#00c087' }}>
                    <LayoutDashboard size={28} />
                    <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>TradeSet Admin</h2>
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {isLoadingMenus ? (
                        /* Skeleton Loaders */
                        [1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="skeleton-loader" style={{ width: '100%', height: '45px', borderRadius: '8px' }}></div>
                        ))
                    ) : (
                        sections.map(sec => (
                            <div key={sec.name} style={{ marginBottom: '20px' }}>
                                <div style={{ 
                                    fontSize: '10px', 
                                    fontWeight: '800', 
                                    color: '#555', 
                                    marginBottom: '10px', 
                                    paddingLeft: '16px',
                                    letterSpacing: '1px'
                                }}>
                                    {sec.name}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {sec.items.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                setActiveTab(item.id);
                                                setIsMobileMenuOpen(false);
                                            }}
                                            style={{ 
                                                ...sidebarBtnStyle, 
                                                backgroundColor: activeTab === item.id ? 'rgba(0,192,135,0.1)' : 'transparent', 
                                                color: activeTab === item.id ? '#00c087' : '#888' 
                                            }}
                                        >
                                            {item.icon} {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </nav>

                <button
                    className="admin-sidebar-exit"
                    onClick={handleLogout}
                    style={{ ...sidebarBtnStyle, backgroundColor: 'transparent', color: '#ff4d4f', borderTop: '1px solid #222', paddingTop: '20px', borderRadius: 0, justifyContent: 'flex-start' }}
                >
                    <LogOut size={18} /> Exit Panel
                </button>
            </div>

            {/* Main Content */}
            <div className="admin-main">
                {renderContent()}
            </div>
        </div>
    );
};

const sidebarBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '12px 16px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'left'
};

export default AdminDashboard;

