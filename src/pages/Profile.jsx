import React from 'react';
import { User, CreditCard, Wallet, Headphones, Zap, Shield, FileText, ChevronRight, Camera, Loader2, LogOut, Copy, QrCode, Share2, Gift, Check, Users, BellIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { uploadFileChunks } from '../services/dbs';
import { db } from '../firebase-setup';
import { collection, getDocs } from 'firebase/firestore';
import giftBg from '../assets/gift-boxes-background.png';
import giftBox from '../assets/gift-box.png';

const Profile = () => {
    const navigate = useNavigate();
    const { user, logout, loading, updateUser } = useAuth();
    const { websiteName, referralCommission } = useBranding();
    const [uploading, setUploading] = React.useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
    const [showQrPopup, setShowQrPopup] = React.useState(false);
    const [copied, setCopied] = React.useState(false);
    const fileInputRef = React.useRef(null);
    const [userLevel, setUserLevel] = React.useState(null);

    React.useEffect(() => {
        const fetchLevel = async () => {
            if (!user) return;
            try {
                const snap = await getDocs(collection(db, 'users'));
                const list = snap.docs.map(d => {
                    const data = d.data();
                    return data.totalDeposit !== undefined ? Number(data.totalDeposit) : Number(data.balance || 0);
                });

                const uniqueDeposits = [...new Set(list)].sort((a, b) => b - a);
                const myDeposit = user.totalDeposit !== undefined ? Number(user.totalDeposit) : Number(user.balance || 0);

                if (myDeposit > 0) {
                    const rankIndex = uniqueDeposits.indexOf(myDeposit);
                    if (rankIndex !== -1 && rankIndex < 5) {
                        setUserLevel(rankIndex + 1);
                    }
                }
            } catch (err) {
                console.error("Error fetching ranking:", err);
            }
        };
        fetchLevel();
    }, [user]);

    const referralLink = `${window.location.origin}/signup?ref=${user?.id}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(referralLink)}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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
        <div style={{ padding: '24px', backgroundColor: '#0a0a0a', minHeight: '100vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '40px' }}>
                <div className="skeleton-loader" style={{ width: '65px', height: '65px', borderRadius: '50%' }}></div>
                <div style={{ flex: 1 }}>
                    <div className="skeleton-loader" style={{ width: '150px', height: '24px', marginBottom: '8px' }}></div>
                    <div className="skeleton-loader" style={{ width: '100px', height: '14px' }}></div>
                </div>
            </div>
            <div className="skeleton-loader" style={{ width: '100%', height: '160px', borderRadius: '16px', marginBottom: '24px' }}></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
                {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton-loader" style={{ width: '100%', height: '100px', borderRadius: '20px' }}></div>
                ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="skeleton-loader" style={{ width: '100%', height: '50px', borderRadius: '8px' }}></div>
                ))}
            </div>
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
                    <>
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ fontWeight: '800', fontSize: '20px', letterSpacing: '0.5px' }}>{user.name || user.email.split('@')[0]}</div>
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {userLevel ? (
                                        <span className='shimmer'>Level {userLevel}</span>
                                    ) : (
                                        <span>UID: {user.id.slice(-6).toUpperCase()}</span>
                                    )}
                                    <span style={{ color: '#444' }}>|</span>
                                    <span style={{ color: 'var(--accent-secondary)', fontWeight: '700' }}> Active </span>
                                    {/* <span style={{ color: 'var(--accent-gold)', fontWeight: '700' }}>{Number(user.balance || 0).toFixed(2)} USDT</span> */}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ cursor: 'pointer' }} onClick={() => navigate('/inbox')}>
                                <BellIcon size={22} color="var(--text-primary)" />
                            </div>

                            <LogOut
                                size={22}
                                color="#ff4d4f"
                                onClick={() => setShowLogoutConfirm(true)}
                                style={{ cursor: 'pointer', marginTop: '-8px' }}
                            />
                        </div>
                    </>
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
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Welcome to {websiteName}</div>
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
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Assets</div>
                        <div style={{ fontWeight: '900', color: 'var(--accent-gold)', fontSize: '20px' }}>
                            {Number(user?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span style={{ fontSize: '12px', fontWeight: '600' }}>USDT</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 5px', borderRadius: '12px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>Ref Earn</div>
                        <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--accent-gold)' }}>
                            {Number(user?.referralEarnings || 0).toFixed(2)}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 5px', borderRadius: '12px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>Total Ref</div>
                        <div style={{ fontWeight: '800', fontSize: '15px', color: '#fff' }}>{user?.totalReferrals || 0}</div>
                    </div>
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 5px', borderRadius: '12px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>Trade Earn</div>
                        <div style={{ fontWeight: '800', fontSize: '15px', color: '#00c087' }}>
                            {Number(user?.tradeEarnings || 0).toFixed(2)}
                        </div>
                    </div>
                </div>

            </div>

            {/* KYC Status Notification — only for unverified users */}
            {user && !user.isVerified && (
                <div
                    onClick={() => navigate('/verification')}
                    style={{
                        marginBottom: '24px',
                        padding: '16px 18px',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        backgroundColor: user?.kycStatus === 'rejected'
                            ? 'rgba(255,77,79,0.06)'
                            : user?.kycStatus === 'pending'
                                ? 'rgba(255,184,0,0.06)'
                                : 'rgba(255,184,0,0.06)',
                        border: user?.kycStatus === 'rejected'
                            ? '1px solid rgba(255,77,79,0.2)'
                            : '1px solid rgba(255,184,0,0.2)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                            backgroundColor: user?.kycStatus === 'rejected' ? 'rgba(255,77,79,0.1)' : 'rgba(255,184,0,0.1)',
                        }}>
                            {user?.kycStatus === 'rejected' ? '❌' : user?.kycStatus === 'pending' ? '🕐' : '🔔'}
                        </div>
                        <div>
                            <div style={{
                                fontWeight: '800', fontSize: '13px',
                                color: user?.kycStatus === 'rejected' ? '#ff4d4f' : '#ffb800'
                            }}>
                                {user?.kycStatus === 'rejected'
                                    ? 'KYC Rejected — Re-submit required'
                                    : user?.kycStatus === 'pending'
                                        ? 'KYC Under Review'
                                        : 'Identity Verification Required'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#888', marginTop: '2px', lineHeight: '1.4' }}>
                                {user?.kycMessage || 'Please verify your identity to unlock all features.'}
                            </div>
                        </div>
                    </div>
                    <ChevronRight size={18} color="#555" style={{ flexShrink: 0 }} />
                </div>
            )}

            <div
                className="action-grid"
                style={{
                    marginBottom: '32px',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px'
                }}
            >
                {[
                    { label: 'Deposit', icon: CreditCard, color: '#00c087', path: '/deposit' },
                    { label: 'Withdrawal', icon: Wallet, color: '#ff4d4f', path: '/withdrawal' },
                    { label: 'Support', icon: Headphones, color: 'var(--accent-gold)', path: '/support' }
                ].map((item, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(item.path)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: '16px 8px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            gap: '10px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                            backdropFilter: 'blur(5px)'
                        }}
                    >
                        <div style={{
                            width: '45px',
                            height: '45px',
                            borderRadius: '14px',
                            backgroundColor: `${item.color}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: item.color,
                            border: `1px solid ${item.color}30`
                        }}>
                            <item.icon size={22} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>{item.label}</span>
                    </motion.div>
                ))}
            </div>

            {/* Referral / Invitation Section */}
            <div style={{
                backgroundImage: `linear-gradient(rgba(26,26,26,0.85), rgba(26,26,26,0.95)), url(${giftBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '24px',
                padding: '24px',
                marginBottom: '32px',
                border: '1px solid rgba(255,255,255,0.05)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                overflow: 'visible',
                width: '100%',
                position: 'relative'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ padding: '8px', backgroundColor: 'rgba(240, 185, 11, 0.1)', borderRadius: '10px', color: 'var(--accent-gold)' }}>
                        <Share2 size={18} />
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Invite Friends</h3>
                </div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div
                        onClick={() => setShowQrPopup(true)}
                        style={{
                            backgroundColor: '#fff',
                            padding: '8px',
                            borderRadius: '12px',
                            width: '100px',
                            height: '100px',
                            minWidth: '100px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            overflow: 'hidden',
                            cursor: 'pointer'
                        }}
                    >
                        <img
                            src={qrCodeUrl}
                            alt="QR Code"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                display: 'block'
                            }}
                        />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', color: '#666', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Your Referral Link</div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            padding: '12px 14px',
                            borderRadius: '12px',
                            border: '1px solid #222',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                fontSize: '13px',
                                color: '#aaa',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1,
                                minWidth: 0,
                                fontFamily: 'monospace'
                            }}>
                                {referralLink}
                            </div>
                            {copied ? (
                                <Check
                                    size={18}
                                    color="#00c087"
                                    style={{ cursor: 'pointer' }}
                                />
                            ) : (
                                <Copy
                                    size={18}
                                    color="var(--accent-gold)"
                                    style={{ cursor: 'pointer' }}
                                    onClick={copyToClipboard}
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div style={{
                    marginTop: '20px',
                    padding: '16px',
                    backgroundColor: 'rgba(0, 192, 137, 0.05)',
                    borderRadius: '12px',
                    border: '1px dashed rgba(0, 192, 137, 0.2)',
                    position: 'relative',
                    overflow: 'visible'
                }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ color: '#00c087', fontWeight: '800', fontSize: '13px', marginBottom: '4px' }}>
                            Commission Rewards
                        </div>
                        <div style={{ fontSize: '11px', color: '#888', lineHeight: '1.5', maxWidth: '80%' }}>
                            Invite friends to join {websiteName} and earn <span style={{ color: '#fff', fontWeight: '700' }}>{referralCommission}%</span> commission on every deposit they make. Rewards are credited instantly.
                        </div>
                    </div>
                    {/* Golden Decorative Image Overlay - Popping Out & Floating */}
                    <motion.div
                        animate={{
                            y: [0, -15, 0],
                            rotate: [-15, -12, -15]
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        style={{
                            position: 'absolute',
                            right: '-20px',
                            top: '10%',
                            opacity: 1,
                            pointerEvents: 'none',
                            width: '100px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10
                        }}
                    >
                        <img src={giftBox} alt="Gift" style={{ width: '100%', height: 'auto', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.9))' }} />
                    </motion.div>
                </div>

                {/* My Team Statistics inside the card at bottom */}
                <div style={{
                    marginTop: '20px',
                    padding: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Users size={16} color="var(--accent-gold)" />
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>My Team Statistics</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>Total Ref</div>
                            <div style={{ fontSize: '15px', fontWeight: '800', color: '#888' }}>{user?.totalReferrals || 0} Members</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>Ref By</div>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: user?.referredBy ? 'var(--accent-gold)' : '#888' }}>
                                {user?.referredBy ? user.referredBy.slice(-6).toUpperCase() : 'Direct'}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <div className="menu-list" style={{ marginBottom: '30px' }}>
                <div style={{ padding: '0 4px 12px 4px', fontSize: '13px', fontWeight: '800', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>Records & History</div>
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
                            <div style={{ fontSize: '14px' }}>{item.label}</div>
                        </div>
                        {item.path && <ChevronRight size={18} color="var(--text-secondary)" />}
                    </div>
                ))}
            </div>

            {user && (
                <button
                    onClick={() => setShowLogoutConfirm(true)}
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

            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {showLogoutConfirm && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLogoutConfirm(false)}
                            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            style={{
                                width: '100%',
                                maxWidth: '320px',
                                background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                                borderRadius: '24px',
                                padding: '30px',
                                border: '1px solid rgba(255,255,255,0.08)',
                                position: 'relative',
                                textAlign: 'center',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                            }}
                        >
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(255, 77, 79, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                                color: '#ff4d4f',
                                border: '1px solid rgba(255, 77, 79, 0.2)'
                            }}>
                                <LogOut size={28} />
                            </div>
                            <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>Sign Out?</h3>
                            <p style={{ color: '#888', fontSize: '14px', marginBottom: '25px', lineHeight: '1.5' }}>Are you sure you want to log out of your account?</p>

                            <div style={{ display: 'grid', gap: '12px' }}>
                                <button
                                    onClick={() => {
                                        logout();
                                        setShowLogoutConfirm(false);
                                    }}
                                    style={{
                                        padding: '14px',
                                        backgroundColor: '#ff4d4f',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '14px',
                                        fontWeight: '700',
                                        fontSize: '15px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Yes, Log Out
                                </button>
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    style={{
                                        padding: '14px',
                                        backgroundColor: 'transparent',
                                        color: '#666',
                                        border: '1px solid #222',
                                        borderRadius: '14px',
                                        fontWeight: '600',
                                        fontSize: '15px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* QR Code Enlarged Modal */}
            <AnimatePresence>
                {showQrPopup && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowQrPopup(false)}
                            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)' }}
                        />
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            style={{
                                width: '100%',
                                maxWidth: '320px',
                                background: '#fff',
                                borderRadius: '30px',
                                padding: '30px',
                                position: 'relative',
                                textAlign: 'center',
                                boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
                            }}
                        >
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontSize: '18px', fontWeight: '800', color: '#000', marginBottom: '5px' }}>Scan to Join</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>{websiteName} Referral Program</div>
                            </div>

                            <div style={{
                                width: '260px',
                                height: '260px',
                                margin: '0 auto',
                                backgroundColor: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(referralLink)}`}
                                    alt="QR Large"
                                    style={{ width: '100%', height: '100%' }}
                                />
                            </div>

                            <button
                                onClick={() => setShowQrPopup(false)}
                                style={{
                                    marginTop: '25px',
                                    padding: '12px 30px',
                                    background: '#000',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '50px',
                                    fontWeight: '700',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Copy Success Toast */}
            <AnimatePresence>
                {copied && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        style={{
                            position: 'fixed',
                            bottom: '100px',
                            left: '50%',
                            translateX: '-50%',
                            backgroundColor: '#00c087',
                            color: '#fff',
                            padding: '12px 24px',
                            borderRadius: '12px',
                            fontWeight: '700',
                            fontSize: '14px',
                            boxShadow: '0 10px 25px rgba(0, 192, 135, 0.3)',
                            zIndex: 2000,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}
                    >
                        <Check size={18} />
                        Referral link copied!
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Profile;
