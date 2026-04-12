import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, ShieldCheck, LogOut, ArrowRightLeft } from 'lucide-react';
import AdminDeposits from './AdminDeposits';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('deposits');

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
            case 'deposits':
                return <AdminDeposits />;
            case 'users':
                return <div style={{ color: '#fff' }}>Users Management (Coming Soon)</div>;
            case 'kyc':
                return <div style={{ color: '#fff' }}>KYC Approvals (Coming Soon)</div>;
            default:
                return null;
        }
    };

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <div className="admin-sidebar">
                <div className="admin-sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', color: '#00c087' }}>
                    <LayoutDashboard size={28} />
                    <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>TradeSet Admin</h2>
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button 
                        onClick={() => setActiveTab('deposits')}
                        style={{ ...sidebarBtnStyle, backgroundColor: activeTab === 'deposits' ? 'rgba(0,192,135,0.1)' : 'transparent', color: activeTab === 'deposits' ? '#00c087' : '#888' }}
                    >
                        <CreditCard size={18} /> Deposits
                    </button>
                    <button 
                        onClick={() => setActiveTab('users')}
                        style={{ ...sidebarBtnStyle, backgroundColor: activeTab === 'users' ? 'rgba(0,192,135,0.1)' : 'transparent', color: activeTab === 'users' ? '#00c087' : '#888' }}
                    >
                        <Users size={18} /> Users
                    </button>
                    <button 
                        onClick={() => setActiveTab('kyc')}
                        style={{ ...sidebarBtnStyle, backgroundColor: activeTab === 'kyc' ? 'rgba(0,192,135,0.1)' : 'transparent', color: activeTab === 'kyc' ? '#00c087' : '#888' }}
                    >
                        <ShieldCheck size={18} /> KYC Approvals
                    </button>
                </nav>

                <button 
                    className="admin-sidebar-exit"
                    onClick={handleLogout}
                    style={{ ...sidebarBtnStyle, color: '#ff4d4f', borderTop: '1px solid #222', paddingTop: '20px', borderRadius: 0, justifyContent: 'flex-start' }}
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

