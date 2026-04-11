import React from 'react';
import { User, CreditCard, Wallet, Headphones, Zap, Shield, FileText, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="app-container"
        >
            <div className="flex-between" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="glass flex-center" style={{ width: '50px', height: '50px', borderRadius: '50%', color: 'var(--accent-gold)' }}>
                        <User size={30} />
                    </div>
                    <div>
                        <div style={{ fontWeight: '700', fontSize: '18px' }}>Login Or Register</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Welcome to Bitop</div>
                    </div>
                </div>
            </div>

            <div className="glass" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Credit score</div>
                        <div style={{ fontWeight: '700' }}>0</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total assets</div>
                        <div style={{ fontWeight: '700' }}>0 USDT</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Yesterday</div>
                        <div>0</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Today</div>
                        <div>0</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total revenue</div>
                        <div>0</div>
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
                    <span className="action-label">Lock-up mining</span>
                </div>
            </div>

            <div className="menu-list">
                {[
                    { icon: FileText, label: 'Recharge Record' },
                    { icon: FileText, label: 'Withdrawal Record' },
                    { icon: Shield, label: 'Transaction records' },
                    { icon: FileText, label: 'Transaction Log' },
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
        </motion.div>
    );
};

export default Profile;
