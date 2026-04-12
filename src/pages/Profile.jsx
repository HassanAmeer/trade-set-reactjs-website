import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, CreditCard, Wallet, Headphones, Zap, Shield, FileText, ChevronRight, Camera, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { uploadFileChunks } from '../services/dbs';

const Profile = () => {
    const navigate = useNavigate();
    const { user, logout, loading, updateUser } = useAuth();
    const [uploading, setUploading] = React.useState(false);
    const fileInputRef = React.useRef(null);

    const handleImageSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const result = await uploadFileChunks(file);

        if (result.success && result.url) {
            // Update user document with the new profile picture URL (using 'profile' field)
            await updateUser({ profile: result.url });
        } else {
            alert("Upload failed: " + (result.error || "No link returned"));
        }
        setUploading(false);
    };

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
                        <div style={{ position: 'relative' }}>
                            <div
                                className="glass flex-center"
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    color: 'var(--accent-gold)',
                                    overflow: 'hidden',
                                    border: '2px solid var(--accent-gold)',
                                    position: 'relative'
                                }}
                            >
                                {user.profile ? (
                                    <img src={user.profile} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <User size={35} />
                                )}

                                {uploading && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: 'rgba(0,0,0,0.6)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 5
                                    }}>
                                        <div className="circular-loader-simple"></div>
                                    </div>
                                )}
                            </div>
                            <div
                                onClick={() => !uploading && fileInputRef.current?.click()}
                                style={{
                                    position: 'absolute',
                                    bottom: '-2px',
                                    right: '-2px',
                                    backgroundColor: 'var(--accent-gold)',
                                    borderRadius: '50%',
                                    padding: '5px',
                                    cursor: uploading ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 10
                                }}
                            >
                                <Camera size={12} color="#000" />
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageSelect}
                                style={{ display: 'none' }}
                                accept="image/*"
                            />
                        </div>
                        <div>
                            <div style={{ fontWeight: '800', fontSize: '20px', letterSpacing: '0.5px' }}>{user.name || user.email.split('@')[0]}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>UID: {user.id.slice(-6).toUpperCase()} | {user.phone}</div>
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={() => navigate('/login')}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                    >
                        <div className="glass flex-center" style={{ width: '55px', height: '55px', borderRadius: '50%', color: 'var(--accent-gold)' }}>
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
                    <div
                        onClick={() => navigate('/verification')}
                        style={{ cursor: 'pointer' }}
                    >
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Account Status</div>
                        <div style={{ fontWeight: '700', color: user?.isVerified ? '#00c087' : '#ff4d4f', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {user?.isVerified ? 'Verified' : 'Unverified'} <ChevronRight size={14} />
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total assets</div>
                        <div style={{ fontWeight: '700', color: 'var(--accent-gold)' }}>{user?.balance || '0.00'} USDT</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Referral Users</div>
                        <div style={{ fontWeight: '600' }}>0</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Revenue</div>
                        <div style={{ fontWeight: '600' }}>0.00</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Today</div>
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
                    { icon: FileText, label: 'Trade Record', path: '/trade-history' },
                    { icon: FileText, label: 'Recharge Record', path: '/deposit-history' },
                    { icon: FileText, label: 'Withdrawal Record', path: '/withdrawal-history' },
                ].map((item, i) => (
                    <div
                        key={i}
                        className="flex-between"
                        onClick={() => item.path && navigate(item.path)}
                        style={{ padding: '16px 4px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: item.path ? 'pointer' : 'default' }}
                    >
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
