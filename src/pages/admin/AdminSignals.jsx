import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase-setup';
import { doc, getDoc, setDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';
import { TrendingUp, TrendingDown, X, Search, ChevronUp, ChevronDown, Clock, Target, Users, StopCircle, Zap, BarChart2, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─────────────────────────────────────────────────────────
   Circular Countdown Ring
───────────────────────────────────────────────────────── */
const RingTimer = ({ value, max, label, color = '#f0b90b', size = 72 }) => {
    const r = (size / 2) - 7;
    const circ = 2 * Math.PI * r;
    const pct = max > 0 ? value / max : 0;
    const dash = circ * pct;
    return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#161616" strokeWidth="5" />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5"
                    strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1s linear', filter: `drop-shadow(0 0 6px ${color}88)` }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '15px', fontWeight: '900', color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</span>
                <span style={{ fontSize: '8px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
            </div>
        </div>
    );
};

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
                <button type="button" onClick={dec} className="spin-btn">
                    <ChevronDown size={13} />
                </button>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', flex: 1, justifyContent: 'center' }}>
                    <input type="number" value={value} onChange={e => onChange(parseFloat(e.target.value) || 0)}
                        style={{ background: 'none', border: 'none', outline: 'none', color, fontSize: compact ? '14px' : '20px', fontWeight: '900', textAlign: 'center', width: '100%', fontVariantNumeric: 'tabular-nums' }} />
                    {suffix && <span style={{ fontSize: '11px', color: '#3a3a4a', flexShrink: 0 }}>{suffix}</span>}
                </div>
                <button type="button" onClick={inc} className="spin-btn">
                    <ChevronUp size={13} />
                </button>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────
   Segment Tabs (replaces pill selector)
───────────────────────────────────────────────────────── */
const SegmentTabs = ({ options, value, onChange, label }) => (
    <div>
        {label && <p style={{ fontSize: '10px', color: '#666', marginBottom: '8px', letterSpacing: '0.8px', textTransform: 'uppercase', fontWeight: '600' }}>{label}</p>}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '3px', gap: '2px', border: '1px solid #1a1a1a' }}>
            {options.map(opt => {
                const isActive = value === (opt.value ?? opt);
                return (
                    <button key={opt.value ?? opt} type="button" onClick={() => onChange(opt.value ?? opt)} style={{
                        flex: 1, padding: '8px 4px', borderRadius: '9px', fontWeight: '700', fontSize: '11px', cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                        background: isActive ? 'rgba(240,185,11,0.15)' : 'transparent',
                        color: isActive ? '#f0b90b' : '#444',
                        boxShadow: isActive ? '0 0 16px rgba(240,185,11,0.1)' : 'none',
                    }}>{opt.label ?? opt}</button>
                );
            })}
        </div>
    </div>
);

/* ─────────────────────────────────────────────────────────
   Glowing Badge
───────────────────────────────────────────────────────── */
const GlowBadge = ({ color, children }) => (
    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '800', letterSpacing: '0.8px', textTransform: 'uppercase', background: `${color}18`, border: `1px solid ${color}40`, color }}>{children}</span>
);

/* ═══════════════════════════════════════════════════════════════════════════ */

const AdminSignals = () => {
    const [duration, setDuration] = useState(30);
    const [loading, setLoading] = useState(false);
    const [currentSignal, setCurrentSignal] = useState(null);
    const [fetching, setFetching] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [timeToStart, setTimeToStart] = useState(0);
    const [signalDuration, setSignalDuration] = useState(30);
    const [startDelay, setStartDelay] = useState('now');
    const [customStartTime, setCustomStartTime] = useState('');
    const [globalWinPercent, setGlobalWinPercent] = useState(85);
    const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
    const [targetChange, setTargetChange] = useState(5);
    const [affectedUsers, setAffectedUsers] = useState({});
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showUserModal, setShowUserModal] = useState(false);

    const ALL_SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'XAU/USD', 'XAG/USD', 'XPT/USD'];
    const DURATION_PRESETS = [{ label: '30s', value: 30 }, { label: '60s', value: 60 }, { label: '90s', value: 90 }, { label: '120s', value: 120 }];
    const START_OPTS = [{ label: 'Now', value: 'now' }, { label: '+1m', value: '1' }, { label: '+2m', value: '2' }, { label: '+5m', value: '5' }, { label: 'Custom', value: 'custom' }];

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const signalSnap = await getDoc(doc(db, 'admin_set', 'market_signal'));
                if (signalSnap.exists()) {
                    const data = signalSnap.data();
                    setCurrentSignal(data);
                    setSelectedSymbol(data.symbol || 'BTC/USDT');
                    setTargetChange(data.targetChange || 5);
                    setSignalDuration(data.duration || 30);
                    if (data.affectedUsersMap) setAffectedUsers(data.affectedUsersMap);
                }
                const usersSnap = await getDocs(collection(db, 'users'));
                setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) { console.error(err); }
            finally { setFetching(false); }
        };
        fetchAll();
        const unsub = onSnapshot(doc(db, 'admin_set', 'market_signal'), snap => {
            if (snap.exists() && !showUserModal) { setCurrentSignal(snap.data()); setSignalDuration(snap.data().duration || 30); }
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (!currentSignal?.expiresAt || !currentSignal?.isActive) { setTimeRemaining(0); setTimeToStart(0); return; }
        const tick = () => {
            const now = Date.now();
            const start = new Date(currentSignal.startTime || currentSignal.updatedAt).getTime();
            const expires = new Date(currentSignal.expiresAt).getTime();
            setTimeToStart(Math.max(0, Math.floor((start - now) / 1000)));
            const rem = Math.max(0, Math.floor((expires - now) / 1000));
            setTimeRemaining(rem);
            if (rem <= 0 && currentSignal.isActive) setDoc(doc(db, 'admin_set', 'market_signal'), { isActive: false }, { merge: true }).catch(console.error);
        };
        tick();
        const t = setInterval(tick, 1000);
        return () => clearInterval(t);
    }, [currentSignal?.startTime, currentSignal?.expiresAt, currentSignal?.isActive]);

    const addUserToSignal = user => setAffectedUsers(prev => ({ ...prev, [user.id]: { winPercent: globalWinPercent, name: user.name || 'Anonymous', email: user.email } }));
    const removeUserFromSignal = uid => setAffectedUsers(prev => { const n = { ...prev }; delete n[uid]; return n; });
    const updateUserRate = (uid, field, val) => {
        const parsed = parseInt(val);
        setAffectedUsers(prev => ({ ...prev, [uid]: { ...prev[uid], [field]: isNaN(parsed) ? '' : parsed } }));
    };
    const applyGlobalToAll = () => { const next = {}; Object.keys(affectedUsers).forEach(id => { next[id] = { ...affectedUsers[id], winPercent: parseInt(globalWinPercent) || 85 }; }); setAffectedUsers(next); };

    const setSignal = async direction => {
        setLoading(true);
        try {
            let start = new Date();
            if (startDelay === '1') start.setMinutes(start.getMinutes() + 1);
            else if (startDelay === '2') start.setMinutes(start.getMinutes() + 2);
            else if (startDelay === '5') start.setMinutes(start.getMinutes() + 5);
            else if (startDelay === 'custom' && customStartTime) start = new Date(customStartTime);
            const expiresAt = new Date(start.getTime());
            expiresAt.setSeconds(expiresAt.getSeconds() + parseInt(duration));
            const signalData = { direction, duration: parseInt(duration), symbol: selectedSymbol, targetChange: parseFloat(targetChange), startTime: start.toISOString(), expiresAt: expiresAt.toISOString(), isActive: true, affectedUsersMap: affectedUsers, updatedAt: new Date().toISOString() };
            await setDoc(doc(db, 'admin_set', 'market_signal'), signalData);
            setCurrentSignal(signalData);
            setSignalDuration(parseInt(duration));
        } catch (err) { console.error(err); alert('❌ Failed: ' + err.message); }
        finally { setLoading(false); }
    };

    const clearSignal = async () => {
        setLoading(true);
        try { await setDoc(doc(db, 'admin_set', 'market_signal'), { isActive: false, expiresAt: new Date().toISOString() }, { merge: true }); setCurrentSignal(null); }
        catch (err) { alert('❌ Failed: ' + err.message); }
        finally { setLoading(false); }
    };

    const filteredUsers = users.filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    const isSignalActive = currentSignal?.isActive && new Date(currentSignal?.expiresAt) > new Date();
    const isScheduled = isSignalActive && timeToStart > 0;
    const isWinSignal = currentSignal?.direction === 'UP';

    if (fetching) return (
        <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 20% 20%, #0a0a14 0%, #030305 100%)', padding: '32px', fontFamily: "'Inter', sans-serif" }}>
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

            {/* ══ TOP NAV BAR ══ */}
            <div style={{ borderBottom: '1px solid #1a1a1a', padding: '16px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #f0b90b22, #f0b90b08)', border: '1px solid #f0b90b30', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BarChart2 size={16} color="#f0b90b" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px', margin: 0, background: 'linear-gradient(90deg, #ffffff, #aaaacc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Signal Control Center</h1>
                        <p style={{ color: '#666', fontSize: '11px', margin: 0 }}>Market manipulation console</p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isSignalActive ? (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', borderRadius: '30px', background: isScheduled ? 'rgba(255,255,255,0.03)' : `rgba(${isWinSignal ? '0,192,135' : '255,77,79'},0.08)`, border: `1px solid ${isScheduled ? '#1a1a1a' : isWinSignal ? 'rgba(0,192,135,0.3)' : 'rgba(255,77,79,0.3)'}` }}>
                            {!isScheduled && <div className="pulse-dot" style={{ '--pc': isWinSignal ? '#00c087' : '#ff4d4f' }} />}
                            <span style={{ fontSize: '11px', fontWeight: '700', color: isScheduled ? '#666' : isWinSignal ? '#00c087' : '#ff4d4f' }}>
                                {isScheduled ? `SCHEDULED · ${timeToStart}s` : `LIVE · ${timeRemaining}s`}
                            </span>
                            <button onClick={clearSignal} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 12px', background: 'rgba(255,77,79,0.1)', border: '1px solid rgba(255,77,79,0.25)', borderRadius: '20px', color: '#ff4d4f', fontSize: '10px', fontWeight: '800', cursor: 'pointer', letterSpacing: '0.5px' }}>
                                <StopCircle size={11} /> STOP
                            </button>
                        </motion.div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '30px', background: 'rgba(255,255,255,0.02)', border: '1px solid #1a1a1a' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#444' }} />
                            <span style={{ fontSize: '11px', color: '#666', fontWeight: '600' }}>STANDBY</span>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ padding: '32px 36px', maxWidth: '1140px', margin: '0 auto' }}>

                {/* ══ ACTIVE SIGNAL BANNER ══ */}
                <AnimatePresence>
                    {isSignalActive && (
                        <motion.div initial={{ opacity: 0, y: -16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -16, scale: 0.98 }} transition={{ duration: 0.3 }}
                            style={{ marginBottom: '28px', padding: '24px 28px', borderRadius: '20px', position: 'relative', overflow: 'hidden', border: `1px solid ${isWinSignal ? 'rgba(0,192,135,0.2)' : 'rgba(255,77,79,0.2)'}`, background: `linear-gradient(135deg, ${isWinSignal ? 'rgba(0,192,135,0.06)' : 'rgba(255,77,79,0.06)'} 0%, #000 60%)` }}>
                            {/* Glow orb */}
                            <div style={{ position: 'absolute', top: '-40px', left: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: isWinSignal ? 'rgba(0,192,135,0.06)' : 'rgba(255,77,79,0.06)', filter: 'blur(40px)', pointerEvents: 'none' }} />

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', position: 'relative' }}>
                                {/* Left info */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: isWinSignal ? 'rgba(0,192,135,0.1)' : 'rgba(255,77,79,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${isWinSignal ? 'rgba(0,192,135,0.2)' : 'rgba(255,77,79,0.2)'}`, flexShrink: 0 }}>
                                        {isWinSignal ? <TrendingUp size={26} color="#00c087" /> : <TrendingDown size={26} color="#ff4d4f" />}
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <GlowBadge color={isScheduled ? '#8888bb' : isWinSignal ? '#00c087' : '#ff4d4f'}>{isScheduled ? 'SCHEDULED' : 'LIVE'}</GlowBadge>
                                            <GlowBadge color="#f0b90b">{currentSignal.symbol}</GlowBadge>
                                        </div>
                                        <p style={{ fontSize: '22px', fontWeight: '900', color: isWinSignal ? '#00c087' : '#ff4d4f', margin: 0, letterSpacing: '-0.5px' }}>
                                            {isWinSignal ? '↑ FORCE WIN' : '↓ FORCE LOSS'}
                                        </p>
                                        <p style={{ fontSize: '12px', color: '#666', margin: 0, marginTop: '2px' }}>Target move: <span style={{ color: '#f0b90b', fontWeight: '700' }}>{currentSignal.targetChange}%</span> · {Object.keys(affectedUsers).length} users targeted</p>
                                    </div>
                                </div>

                                {/* Ring timers */}
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    {isScheduled ? (
                                        <RingTimer value={timeToStart} max={300} label="starts in" color="#8888bb" />
                                    ) : (
                                        <RingTimer value={timeRemaining} max={signalDuration} label="remaining" color={isWinSignal ? '#00c087' : '#ff4d4f'} />
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ padding: '8px 14px', background: '#0a0a0a', borderRadius: '10px', border: '1px solid #1a1a1a' }}>
                                            <p style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>Duration</p>
                                            <p style={{ fontSize: '16px', fontWeight: '800', color: '#fff', margin: 0, fontVariantNumeric: 'tabular-nums' }}>{signalDuration}s</p>
                                        </div>
                                        <button onClick={clearSignal} style={{ padding: '8px 14px', background: 'rgba(255,77,79,0.1)', border: '1px solid rgba(255,77,79,0.25)', borderRadius: '10px', color: '#ff4d4f', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', letterSpacing: '0.3px' }}>
                                            <StopCircle size={12} /> Stop Signal
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ══ MAIN GRID ══ */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '24px', alignItems: 'start' }}>

                    {/* ── LEFT ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* Config card */}
                        <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '24px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', overflow: 'hidden' }}>
                            {/* Corner glow */}
                            <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(240,185,11,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Shield size={14} color="#f0b90b" />
                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Signal Configuration</span>
                            </div>

                            {/* ── Target asset ── */}
                            <div>
                                <p style={{ fontSize: '10px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>Target Asset</p>
                                <div style={{ position: 'relative' }}>
                                    <select value={selectedSymbol} onChange={e => setSelectedSymbol(e.target.value)}
                                        style={{ width: '100%', padding: '13px 42px 13px 16px', background: '#000', color: '#fff', border: '1px solid #1a1a1a', borderRadius: '14px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', appearance: 'none', outline: 'none', letterSpacing: '0.3px' }}>
                                        {ALL_SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <ChevronDown size={14} color="#666" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            {/* ── Duration ── */}
                            <div>
                                <p style={{ fontSize: '10px', color: '#666', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600' }}>Duration</p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '12px' }}>
                                    {DURATION_PRESETS.map(p => {
                                        const active = duration === p.value;
                                        return (
                                            <button key={p.value} type="button" onClick={() => setDuration(p.value)} style={{
                                                padding: '11px 0', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                                                border: `1px solid ${active ? '#f0b90b50' : '#1a1a1a'}`,
                                                background: active ? 'rgba(240,185,11,0.12)' : 'rgba(255,255,255,0.02)',
                                                color: active ? '#f0b90b' : '#666',
                                                boxShadow: active ? '0 0 18px rgba(240,185,11,0.12), inset 0 0 12px rgba(240,185,11,0.04)' : 'none',
                                            }}>{p.label}</button>
                                        );
                                    })}
                                </div>
                                <SpinCounter value={duration} onChange={setDuration} min={5} max={600} step={5} suffix="s" label="Custom duration" />
                            </div>

                            {/* ── Start delay ── */}
                            <SegmentTabs options={START_OPTS} value={startDelay} onChange={setStartDelay} label="Start Delay" />
                            {startDelay === 'custom' && (
                                <input type="datetime-local" value={customStartTime} onChange={e => setCustomStartTime(e.target.value)}
                                    style={{ width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', color: '#fff', border: '1px solid #1a1a1a', borderRadius: '14px', fontSize: '13px', outline: 'none' }} />
                            )}

                            {/* ── Target move ── */}
                            <SpinCounter value={targetChange} onChange={setTargetChange} min={0.1} max={50} step={0.1} suffix="%" label="Market Move Target %" color="#00c087" />
                        </div>

                        {/* ── Action Buttons ── */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <motion.button whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(0,192,135,0.35)' }} whileTap={{ scale: 0.97 }} onClick={() => setSignal('UP')} disabled={loading}
                                style={{ padding: '22px', background: 'linear-gradient(135deg, #00c087 0%, #00906a 100%)', color: '#fff', border: 'none', borderRadius: '18px', fontWeight: '900', fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 6px 28px rgba(0,192,135,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', letterSpacing: '1px', opacity: loading ? 0.7 : 1 }}>
                                <TrendingUp size={17} /> FORCE WIN
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(255,77,79,0.35)' }} whileTap={{ scale: 0.97 }} onClick={() => setSignal('DOWN')} disabled={loading}
                                style={{ padding: '22px', background: 'linear-gradient(135deg, #ff4d4f 0%, #c0282a 100%)', color: '#fff', border: 'none', borderRadius: '18px', fontWeight: '900', fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 6px 28px rgba(255,77,79,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', letterSpacing: '1px', opacity: loading ? 0.7 : 1 }}>
                                <TrendingDown size={17} /> FORCE LOSS
                            </motion.button>
                        </div>
                    </div>

                    {/* ── RIGHT ── */}
                    <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '24px', padding: '28px', display: 'flex', flexDirection: 'column', minHeight: '540px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '160px', height: '160px', background: 'radial-gradient(circle, rgba(240,185,11,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <Users size={14} color="#f0b90b" />
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Targeted Users</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                    <span style={{ fontSize: '32px', fontWeight: '900', color: '#fff', lineHeight: 1 }}>{Object.keys(affectedUsers).length}</span>
                                    <span style={{ fontSize: '13px', color: '#666' }}>active targets</span>
                                </div>
                            </div>
                            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => setShowUserModal(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: 'rgba(240,185,11,0.08)', color: '#f0b90b', border: '1px solid rgba(240,185,11,0.2)', borderRadius: '12px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', letterSpacing: '0.3px' }}>
                                + Add Targets
                            </motion.button>
                        </div>

                        {/* Global batch row */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid #1a1a1a', alignItems: 'flex-end' }}>
                            <SpinCounter value={globalWinPercent} onChange={setGlobalWinPercent} min={1} max={500} step={1} label="Win Prize %" suffix="%" color="#f0b90b" compact />
                            <motion.button whileTap={{ scale: 0.96 }} onClick={applyGlobalToAll}
                                style={{ padding: '0 14px', background: 'rgba(240,185,11,0.08)', border: '1px solid rgba(240,185,11,0.2)', borderRadius: '10px', color: '#f0b90b', fontSize: '10px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap', height: '44px', letterSpacing: '0.5px' }}>
                                APPLY ALL
                            </motion.button>
                        </div>

                        {/* Divider */}
                        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #1a1a1a, transparent)', marginBottom: '16px' }} />

                        {/* User list */}
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <AnimatePresence>
                                {Object.entries(affectedUsers).map(([id, u], idx) => (
                                    <motion.div key={id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: idx * 0.04 }}
                                        style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid #1a1a1a', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                        {/* Avatar */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                                            <div style={{ width: '38px', height: '38px', background: '#222', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '900', color: '#f0b90b', flexShrink: 0, border: '1px solid #333' }}>
                                                {(u.name?.[0] || '?').toUpperCase()}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <p style={{ fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{u.name}</p>
                                                <p style={{ fontSize: '10px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{u.email}</p>
                                            </div>
                                        </div>
                                        {/* Inline spin controls */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                            {/* Win Prize % */}
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                                <span style={{ fontSize: '8px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Win Prize%</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#000', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '3px 6px' }}>
                                                    <button type="button" onClick={() => updateUserRate(id, 'winPercent', Math.max(1, (parseInt(u.winPercent) || 85) - 1))} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 0 }}><ChevronDown size={11} /></button>
                                                    <input type="number" value={u.winPercent ?? ''} onChange={e => updateUserRate(id, 'winPercent', e.target.value)} style={{ width: '32px', background: 'none', border: 'none', outline: 'none', color: '#f0b90b', fontSize: '12px', fontWeight: '800', textAlign: 'center' }} />
                                                    <button type="button" onClick={() => updateUserRate(id, 'winPercent', Math.min(500, (parseInt(u.winPercent) || 85) + 1))} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 0 }}><ChevronUp size={11} /></button>
                                                </div>
                                            </div>
                                            <button onClick={() => removeUserFromSignal(id)} style={{ padding: '7px', background: 'rgba(255,77,79,0.07)', border: '1px solid rgba(255,77,79,0.15)', borderRadius: '9px', color: '#ff4d4f', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                <X size={13} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {Object.keys(affectedUsers).length === 0 && (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', padding: '50px 0' }}>
                                    <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '1px dashed #222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Users size={28} color="#444" />
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#444', margin: 0 }}>No targets selected</p>
                                        <p style={{ fontSize: '11px', color: '#333', marginTop: '4px' }}>Add users to target with this signal</p>
                                    </div>
                                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowUserModal(true)} style={{ padding: '10px 22px', background: 'rgba(240,185,11,0.07)', border: '1px solid rgba(240,185,11,0.18)', borderRadius: '12px', color: '#f0b90b', fontSize: '12px', fontWeight: '800', cursor: 'pointer', letterSpacing: '0.3px' }}>
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
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}>
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 240 }}
                            style={{ width: '100%', maxWidth: '540px', background: '#0e0e0e', borderTopLeftRadius: '28px', borderTopRightRadius: '28px', padding: '28px', border: '1px solid #222', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 -40px 80px rgba(0,0,0,0.7)' }}>

                            {/* Handle */}
                            <div style={{ width: '36px', height: '4px', background: '#222', borderRadius: '4px', margin: '0 auto 24px' }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div>
                                    <h3 style={{ fontSize: '20px', fontWeight: '900', margin: 0, letterSpacing: '-0.3px' }}>Select Target Users</h3>
                                    <p style={{ fontSize: '12px', color: '#666', marginTop: '3px' }}>{filteredUsers.length} users available</p>
                                </div>
                                <button onClick={() => setShowUserModal(false)} style={{ background: '#222', border: 'none', padding: '10px', borderRadius: '50%', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                    <X size={17} />
                                </button>
                            </div>

                            <div style={{ position: 'relative', marginBottom: '18px' }}>
                                <Search size={14} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
                                <input type="text" placeholder="Search by name or email…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    style={{ width: '100%', padding: '13px 13px 13px 44px', background: '#000', border: '1px solid #222', borderRadius: '14px', color: '#fff', fontSize: '13px', outline: 'none' }} />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                                {filteredUsers.map(u => {
                                    const isAdded = !!affectedUsers[u.id];
                                    return (
                                        <motion.div key={u.id} whileTap={{ scale: 0.985 }} onClick={() => isAdded ? removeUserFromSignal(u.id) : addUserToSignal(u)}
                                            style={{ padding: '14px 16px', background: isAdded ? 'rgba(240,185,11,0.05)' : '#161616', border: `1px solid ${isAdded ? '#f0b90b' : '#222'}`, borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.18s' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <div style={{ width: '42px', height: '42px', background: '#222', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '16px', color: isAdded ? '#f0b90b' : '#666', border: `1px solid ${isAdded ? '#f0b90b' : '#222'}` }}>
                                                    {u.name?.[0]?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: '700', fontSize: '14px', margin: 0 }}>{u.name}</p>
                                                    <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>{u.email}</p>
                                                </div>
                                            </div>
                                            <motion.div animate={{ scale: isAdded ? 1 : 0.85 }}
                                                style={{ width: '24px', height: '24px', borderRadius: '50%', background: isAdded ? '#f0b90b' : 'transparent', border: `2px solid ${isAdded ? '#f0b90b' : '#333'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: isAdded ? '0 0 12px rgba(240,185,11,0.4)' : 'none' }}>
                                                {isAdded && <span style={{ color: '#000', fontSize: '12px', fontWeight: '900' }}>✓</span>}
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
                .pulse-dot { width:7px; height:7px; border-radius:50%; background:var(--pc,#f0b90b); animation:pd 1.5s infinite; }
                @keyframes pd { 0%{transform:scale(1);opacity:1;box-shadow:0 0 0 0 color-mix(in srgb,var(--pc,#f0b90b) 60%,transparent)} 60%{transform:scale(1.15);opacity:.8;box-shadow:0 0 0 9px transparent} 100%{transform:scale(1);opacity:1;box-shadow:0 0 0 0 transparent} }
                .spin-btn { background:rgba(255,255,255,0.04); border:1px solid #222; border-radius:7px; color:#4a4a6a; cursor:pointer; width:26px; height:26px; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.15s; }
                .spin-btn:hover { background:rgba(240,185,11,0.08); border-color:rgba(240,185,11,0.2); color:#f0b90b; }
                .spin-wrap:focus-within { border-color:#222 !important; }
                input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
                input[type=number]{-moz-appearance:textfield;}
                input[type=datetime-local]::-webkit-calendar-picker-indicator{filter:invert(0.4);}
                *::-webkit-scrollbar{width:3px;}*::-webkit-scrollbar-track{background:transparent;}*::-webkit-scrollbar-thumb{background:#222;border-radius:10px;}
                select option{background:#0a0a0a;color:#fff;}
            `}</style>
        </div>
    );
};

export default AdminSignals;
