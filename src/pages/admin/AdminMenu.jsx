import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-setup';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Eye, EyeOff, Save, Loader2, LayoutList, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Must match the navItems ids in AdminDashboard.jsx
const ALL_MENU_ITEMS = [
    { id: 'deposits', label: 'Deposits', section: 'FINANCIAL' },
    { id: 'withdrawals', label: 'Withdrawals', section: 'FINANCIAL' },
    { id: 'users', label: 'Users', section: 'MANAGEMENT' },
    { id: 'support', label: 'Support Center', section: 'MANAGEMENT' },
    { id: 'blogs', label: 'News & Blogs', section: 'CONTENT' },
    { id: 'kyc', label: 'KYC Approvals', section: 'MANAGEMENT' },
    { id: 'carousel', label: 'Home Banners', section: 'CONTENT' },
    { id: 'email', label: 'Email Campaign', section: 'CONTENT' },
    { id: 'announcements', label: 'Announcements', section: 'CONTENT' },
    { id: 'rewards', label: 'Deposit Rewards', section: 'GROWTH' },
    { id: 'signals', label: 'Market Signals', section: 'GROWTH' },
    { id: 'trades', label: 'Trades Log', section: 'RECORDS' },
    { id: 'mining', label: 'Mining Logs', section: 'RECORDS' },
    { id: 'settings', label: 'Settings', section: 'SYSTEM' },
];

const FIRESTORE_DOC = doc(db, 'admin_set', 'menu_visibility');

const AdminMenu = () => {
    const [visibility, setVisibility] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetchVisibility();
    }, []);

    const fetchVisibility = async () => {
        setLoading(true);
        try {
            const snap = await getDoc(FIRESTORE_DOC);
            if (snap.exists()) {
                setVisibility(snap.data());
            } else {
                // Default: all visible
                const defaults = {};
                ALL_MENU_ITEMS.forEach(item => { defaults[item.id] = true; });
                setVisibility(defaults);
            }
        } catch (err) {
            console.error('Error fetching menu visibility:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggle = (id) => {
        setVisibility(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(FIRESTORE_DOC, visibility);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            alert('Failed to save: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div style={{ padding: '0px' }}>
            <div className="skeleton-loader" style={{ width: '250px', height: '35px', marginBottom: '30px' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                    <div key={i} className="skeleton-loader" style={{ width: '100%', height: '60px', borderRadius: '12px' }}></div>
                ))}
            </div>
        </div>
    );

    const visibleCount = ALL_MENU_ITEMS.filter(m => visibility[m.id]).length;
    const hiddenCount = ALL_MENU_ITEMS.length - visibleCount;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                    <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', margin: '0 0 6px' }}>
                        Menu Visibility Control
                    </h2>
                    <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>
                        Toggle which sidebar items are visible to regular admins.
                        <span style={{ color: '#00c087', fontWeight: '700' }}> Super Admin</span> always sees all.
                    </p>
                </div>

                {/* Stats & Save */}
                <div style={{ display: 'flex', alignItems: 'stretch', gap: '12px' }}>
                    <div style={{ padding: '10px 18px', background: 'rgba(0,192,135,0.1)', border: '1px solid rgba(0,192,135,0.2)', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#00c087' }}>{visibleCount}</div>
                        <div style={{ fontSize: '11px', color: '#888' }}>Visible</div>
                    </div>
                    <div style={{ padding: '10px 18px', background: 'rgba(255,77,79,0.1)', border: '1px solid rgba(255,77,79,0.2)', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#ff4d4f' }}>{hiddenCount}</div>
                        <div style={{ fontSize: '11px', color: '#888' }}>Hidden</div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            padding: '0 24px',
                            backgroundColor: '#f0b90b',
                            color: '#000',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: '800',
                            fontSize: '14px',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 15px rgba(240,185,11,0.2)'
                        }}
                    >
                        {saving ? <><Loader2 size={16} className="animate-spin" /> Saving</> : <><Save size={16} /> Save</>}
                    </button>
                </div>
            </div>

            {/* Super Admin Notice */}
            <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg, rgba(240,185,11,0.08), rgba(240,185,11,0.04))', border: '1px solid rgba(240,185,11,0.2)', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>👑</span>
                <div>
                    <div style={{ fontWeight: '800', color: '#ffb800', fontSize: '13px' }}>Super Admin Mode Active</div>
                    <div style={{ color: '#888', fontSize: '12px' }}>Hidden items will still be visible to you. Regular admins will only see enabled items.</div>
                </div>
            </div>

            {/* Menu Toggle List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', marginBottom: '30px' }}>
                {Array.from(new Set(ALL_MENU_ITEMS.map(m => m.section))).map(sectionName => (
                    <div key={sectionName}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#555', marginBottom: '15px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            {sectionName}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {ALL_MENU_ITEMS.filter(m => m.section === sectionName).map((item, idx) => {
                                const isVisible = !!visibility[item.id];
                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '16px 20px',
                                            backgroundColor: isVisible ? 'rgba(0,192,135,0.05)' : 'rgba(255,255,255,0.02)',
                                            border: `1px solid ${isVisible ? 'rgba(0,192,135,0.2)' : '#1e1e1e'}`,
                                            borderRadius: '12px',
                                            transition: 'all 0.25s ease',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '8px',
                                                backgroundColor: isVisible ? 'rgba(0,192,135,0.1)' : 'rgba(255,255,255,0.04)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <LayoutList size={16} color={isVisible ? '#00c087' : '#555'} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '700', fontSize: '15px', color: isVisible ? '#fff' : '#666' }}>
                                                    {item.label}
                                                </div>
                                                <div style={{ fontSize: '11px', color: isVisible ? '#00c087' : '#ff4d4f', marginTop: '2px', fontWeight: '600' }}>
                                                    {isVisible ? 'Visible to admin' : 'Hidden from admin'}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => toggle(item.id)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                padding: '8px 16px', borderRadius: '8px', border: 'none',
                                                cursor: 'pointer', fontWeight: '700', fontSize: '13px',
                                                backgroundColor: isVisible ? 'rgba(0,192,135,0.15)' : 'rgba(255,77,79,0.1)',
                                                color: isVisible ? '#00c087' : '#ff4d4f',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            {isVisible ? <Eye size={15} /> : <EyeOff size={15} />}
                                            {isVisible ? 'Visible' : 'Hidden'}
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Toast Notification */}
            <AnimatePresence>
                {saved && (
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 20, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 20,
                            right: 20,
                            backgroundColor: '#00c087',
                            color: '#fff',
                            padding: '12px 24px',
                            borderRadius: '30px',
                            zIndex: 1000,
                            fontWeight: '700',
                            fontSize: '14px',
                            boxShadow: '0 4px 15px rgba(0, 192, 135, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <CheckCircle2 size={18} /> Settings saved successfully!
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AdminMenu;
