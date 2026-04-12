import { useAuth } from '../context/AuthContext';
import { User, CreditCard, Wallet, Headphones, Zap, Shield, FileText, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const navigate = useNavigate();
    const { user, logout, loading } = useAuth();

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0a0a0a' }}>
            <div className="skeleton-loader" style={{ width: '50px', height: '50px', borderRadius: '50%' }}></div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="app-container"
        >
            <div className="flex-between" style={{ marginBottom: '24px' }}>
                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="glass flex-center" style={{ width: '50px', height: '50px', borderRadius: '50%', color: 'var(--accent-gold)' }}>
                            <User size={30} />
                        </div>
                        <div>
                            <div style={{ fontWeight: '700', fontSize: '18px' }}>{user.email.split('@')[0]}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>UID: {user.id.slice(-6)} | {user.phone}</div>
                        </div>
                    </div>
                ) : (
                    <div 
                        onClick={() => navigate('/login')}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                    >
                        <div className="glass flex-center" style={{ width: '50px', height: '50px', borderRadius: '50%', color: 'var(--accent-gold)' }}>
                            <User size={30} />
                        </div>
                        <div>
                            <div style={{ fontWeight: '700', fontSize: '18px' }}>Login / Register</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Welcome to TradeSet</div>
                        </div>
                    </div>
                )}
            </div>

            <div className="glass" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Account Status</div>
                        <div style={{ fontWeight: '700', color: '#00c087' }}>{user ? 'Verified' : 'Guest'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total assets</div>
                        <div style={{ fontWeight: '700', color: 'var(--accent-gold)' }}>{user?.balance || '0.00'} USDT</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Friends</div>
                        <div style={{ fontWeight: '600' }}>0</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Level</div>
                        <div style={{ fontWeight: '600' }}>VIP 1</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Revenue</div>
                        <div style={{ fontWeight: '600' }}>0.00</div>
                    </div>
                </div>
            </div>

            <div className="action-grid" style={{ marginBottom: '32px' }}>
                <div className="action-item" onClick={() => navigate('/deposit')}>
                    <div className="action-icon"><CreditCard size={20} /></div>
                    <span className="action-label">Deposit</span>
                </div>
                <div className="action-item" onClick={() => navigate('/withdrawal')}>
                    <div className="action-icon"><Wallet size={20} /></div>
                    <span className="action-label">Withdrawal</span>
                </div>
                <div className="action-item" onClick={() => navigate('/support')}>
                    <div className="action-icon"><Headphones size={20} /></div>
                    <span className="action-label">Customer Care</span>
                </div>
                <div className="action-item">
                    <div className="action-icon"><Zap size={20} /></div>
                    <span className="action-label">Mining</span>
                </div>
            </div>

            <div className="menu-list" style={{ marginBottom: '30px' }}>
                {[
                    { icon: FileText, label: 'Recharge Record' },
                    { icon: FileText, label: 'Withdrawal Record' },
                    { icon: Shield, label: 'Transaction history' },
                    { icon: FileText, label: 'Account Security' },
                ].map((item, i) => (
                    <div key={i} className="flex-between" style={{ padding: '16px 4px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <item.icon size={18} color="var(--text-secondary)" />
                            <span style={{ fontSize: '14px' }}>{item.label}</span>
                        </div>
                        <ChevronRight size={18} color="var(--text-secondary)" />
                    </div>
                ))}
            </div>

            {user && (
                <button 
                    onClick={logout}
                    style={{ 
                        width: '100%', 
                        padding: '16px', 
                        backgroundColor: 'rgba(255, 77, 79, 0.1)', 
                        color: '#ff4d4f', 
                        border: '1px solid rgba(255, 77, 79, 0.2)', 
                        borderRadius: '12px', 
                        fontWeight: '700', 
                        fontSize: '14px',
                        cursor: 'pointer',
                        marginBottom: '40px'
                    }}
                >
                    Log Out of Account
                </button>
            )}
        </motion.div>
    );
};

export default Profile;
