import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-setup';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { TrendingUp, TrendingDown, Sparkles, Loader2, AlertCircle, ShieldCheck, X, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminSignals = () => {
    const [duration, setDuration] = useState('5');
    const [loading, setLoading] = useState(false);
    const [currentSignal, setCurrentSignal] = useState(null);
    const [fetching, setFetching] = useState(true);

    // Global defaults (used when adding new users or bulk applying)
    const [globalPayout, setGlobalPayout] = useState(85);
    const [globalWinRate, setGlobalWinRate] = useState(100);

    const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
    const [targetChange, setTargetChange] = useState(5); // Target 5% move

    const ALL_SYMBOLS = [
        'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT',
        'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD',
        'XAU/USD', 'XAG/USD', 'WTI/USD', 'BRENT/USD', 'XPT/USD'
    ];

    // affectedUsers is an object: { userId: { payoutRate, winRate, name, email } }
    const [affectedUsers, setAffectedUsers] = useState({});

    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showUserModal, setShowUserModal] = useState(false);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                // Fetch Signal
                const signalSnap = await getDoc(doc(db, 'admin_set', 'market_signal'));
                if (signalSnap.exists()) {
                    const data = signalSnap.data();
                    setCurrentSignal(data);
                    setSelectedSymbol(data.symbol || 'BTC/USDT');
                    setTargetChange(data.targetChange || 5);

                    // Convert old array format to new object format if needed, or load existing object
                    if (data.affectedUsersMap) {
                        setAffectedUsers(data.affectedUsersMap);
                    } else if (Array.isArray(data.affectedUsers)) {
                        // Migration for old data
                        const obj = {};
                        data.affectedUsers.forEach(id => {
                            obj[id] = { payoutRate: data.payoutRate || 85, winRate: data.winRate || 100 };
                        });
                        setAffectedUsers(obj);
                    }
                }

                // Fetch Users
                const usersSnap = await getDocs(collection(db, 'users'));
                const usersList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setUsers(usersList);

            } catch (err) {
                console.error(err);
            } finally {
                setFetching(false);
            }
        };
        fetchAll();

        const interval = setInterval(async () => {
            const snap = await getDoc(doc(db, 'admin_set', 'market_signal'));
            if (snap.exists()) {
                const data = snap.data();
                if (!showUserModal) setCurrentSignal(data);
            }
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const addUserToSignal = (user) => {
        setAffectedUsers(prev => ({
            ...prev,
            [user.id]: {
                payoutRate: globalPayout,
                winRate: globalWinRate,
                name: user.name || 'Anonymous',
                email: user.email
            }
        }));
    };

    const removeUserFromSignal = (userId) => {
        setAffectedUsers(prev => {
            const next = { ...prev };
            delete next[userId];
            return next;
        });
    };

    const updateUserRate = (userId, field, value) => {
        setAffectedUsers(prev => ({
            ...prev,
            [userId]: { ...prev[userId], [field]: parseInt(value) }
        }));
    };

    const applyGlobalToAll = () => {
        const next = {};
        Object.keys(affectedUsers).forEach(id => {
            next[id] = { ...affectedUsers[id], payoutRate: parseInt(globalPayout), winRate: parseInt(globalWinRate) };
        });
        setAffectedUsers(next);
    };

    const setSignal = async (direction) => {
        setLoading(true);
        try {
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + parseInt(duration));

            const signalData = {
                direction,
                duration: parseInt(duration),
                symbol: selectedSymbol,
                targetChange: parseFloat(targetChange),
                startTime: new Date().toISOString(),
                expiresAt: expiresAt.toISOString(),
                isActive: true,
                affectedUsersMap: affectedUsers,
                updatedAt: new Date().toISOString()
            };

            await setDoc(doc(db, 'admin_set', 'market_signal'), signalData);
            setCurrentSignal(signalData);
            // alert(`✅ Signal activated for ${Object.keys(affectedUsers).length} users`);
        } catch (error) {
            console.error(error);
            alert("❌ Failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const clearSignal = async () => {
        setLoading(true);
        try {
            const stopData = { isActive: false, expiresAt: new Date().toISOString() };
            await setDoc(doc(db, 'admin_set', 'market_signal'), stopData, { merge: true });
            setCurrentSignal(null);
            // alert("✅ Signal stopped.");
        } catch (error) {
            alert("❌ Failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const stopSignal = clearSignal;

    const filteredUsers = users.filter(u =>
    (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const isSignalActive = currentSignal?.isActive && new Date(currentSignal?.expiresAt) > new Date();

    if (fetching) return (
        <div style={{ minHeight: '100vh', background: '#000', color: '#fff', padding: '24px', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ marginBottom: '32px' }}>
                <div className="skeleton" style={{ width: '300px', height: '34px', borderRadius: '8px', marginBottom: '8px' }} />
                <div className="skeleton" style={{ width: '200px', height: '18px', borderRadius: '6px' }} />
            </div>

            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '30px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="skeleton" style={{ height: '180px', borderRadius: '20px' }} />
                    <div className="skeleton" style={{ height: '300px', borderRadius: '20px' }} />
                </div>
                <div className="skeleton" style={{ height: '500px', borderRadius: '20px' }} />
            </div>

            <style>{`
                .skeleton {
                    background: linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite linear;
                }
                @keyframes shimmer {
                    from { background-position: -200% 0; }
                    to { background-position: 200% 0; }
                }
            `}</style>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#000', color: '#fff', padding: '24px', fontFamily: "'Inter', sans-serif" }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>Signal Control Center</h1>
                    <p style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>Manipulate market outcomes for specific targets.</p>
                </div>
                {fetching && <Loader2 className="animate-spin" color="#f0b90b" />}
            </div>

            {/* Main Content Grid */}
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '30px' }}>

                {/* Left Column: Configuration */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Active Status Card */}
                    <div style={{
                        background: 'linear-gradient(145deg, #0a0a0a 0%, #111 100%)',
                        padding: '24px',
                        borderRadius: '20px',
                        border: '1px solid #1a1a1a',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{
                                    padding: '12px',
                                    background: isSignalActive ? (currentSignal.direction === 'UP' ? 'rgba(0,192,135,0.1)' : 'rgba(255,77,79,0.1)') : '#161616',
                                    borderRadius: '14px',
                                    border: `1px solid ${isSignalActive ? (currentSignal.direction === 'UP' ? 'rgba(0,192,135,0.2)' : 'rgba(255,77,79,0.2)') : '#222'}`
                                }}>
                                    {isSignalActive ? (currentSignal.direction === 'UP' ? <TrendingUp color="#00c087" /> : <TrendingDown color="#ff4d4f" />) : <TrendingUp color="#333" />}
                                </div>
                                <div>
                                    <span style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>System Status</span>
                                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: isSignalActive ? '#fff' : '#444' }}>
                                        {isSignalActive ? `Active: ${currentSignal.direction}` : 'Standby Mode'}
                                    </h2>
                                </div>
                            </div>
                            {isSignalActive && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(240,185,11,0.1)', padding: '4px 10px', borderRadius: '20px' }}>
                                    <div className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f0b90b' }} />
                                    <span style={{ fontSize: '11px', color: '#f0b90b', fontWeight: '700' }}>LIVE</span>
                                </div>
                            )}
                        </div>

                        {isSignalActive && (
                            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #1a1a1a' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                    <div>
                                        <p style={{ fontSize: '11px', color: '#444', marginBottom: '4px' }}>Target Asset</p>
                                        <p style={{ fontSize: '14px', fontWeight: '600' }}>{currentSignal.symbol}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '11px', color: '#444', marginBottom: '4px' }}>Move %</p>
                                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#f0b90b' }}>{currentSignal.targetChange}%</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <div style={{ flex: 1, padding: '10px', background: '#000', borderRadius: '10px', border: '1px solid #222' }}>
                                        <p style={{ fontSize: '9px', color: '#444', textTransform: 'uppercase' }}>Expires At</p>
                                        <p style={{ fontSize: '12px', fontWeight: '700' }}>{new Date(currentSignal.expiresAt).toLocaleTimeString()}</p>
                                    </div>
                                    <button onClick={clearSignal} style={{ flex: 1, padding: '10px', background: 'rgba(255,77,79,0.1)', color: '#ff4d4f', border: '1px solid #ff4d4f', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                                        STOP SIGNAL
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Config Card */}
                    <div style={{ background: '#0a0a0a', padding: '24px', borderRadius: '20px', border: '1px solid #1a1a1a' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '20px', color: '#aaa' }}>Quick Settings</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: '#444', marginBottom: '6px', marginLeft: '4px' }}>Target Asset</label>
                                <select value={selectedSymbol} onChange={(e) => setSelectedSymbol(e.target.value)} style={{ width: '100%', padding: '12px', background: '#000', color: '#fff', border: '1px solid #222', borderRadius: '12px', fontSize: '14px' }}>
                                    {ALL_SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', color: '#444', marginBottom: '6px', marginLeft: '4px' }}>Duration</label>
                                    <select value={duration} onChange={(e) => setDuration(e.target.value)} style={{ width: '100%', padding: '12px', background: '#000', color: '#fff', border: '1px solid #222', borderRadius: '12px', fontSize: '14px' }}>
                                        {['1', '2', '5', '10', '15', '30'].map(m => <option key={m} value={m}>{m}m Session</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', color: '#444', marginBottom: '6px', marginLeft: '4px' }}>Target Move %</label>
                                    <input type="number" step="0.1" value={targetChange} onChange={(e) => setTargetChange(e.target.value)} style={{ width: '100%', padding: '12px', background: '#000', color: '#fff', border: '1px solid #222', borderRadius: '12px', fontSize: '14px' }} />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '30px' }}>
                            <button onClick={() => setSignal('UP')} disabled={loading} style={{ padding: '18px', background: 'linear-gradient(to bottom right, #00c087, #00a070)', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,192,135,0.2)' }}>
                                FORCE LONG
                            </button>
                            <button onClick={() => setSignal('DOWN')} disabled={loading} style={{ padding: '18px', background: 'linear-gradient(to bottom right, #ff4d4f, #d4380d)', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 15px rgba(255,77,79,0.2)' }}>
                                FORCE SHORT
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: User Management */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ background: '#0a0a0a', padding: '24px', borderRadius: '20px', border: '1px solid #1a1a1a', height: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#aaa' }}>Targeted Users ({Object.keys(affectedUsers).length})</h3>
                            <button onClick={() => setShowUserModal(true)} style={{ padding: '8px 16px', background: 'rgba(240,185,11,0.1)', color: '#f0b90b', border: '1px solid rgba(240,185,11,0.3)', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                                + Add Targets
                            </button>
                        </div>

                        {/* Global Defaults for Batch Edit */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <input type="number" placeholder="Payout %" value={globalPayout || ''} onChange={(e) => setGlobalPayout(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #333', color: '#fff', fontSize: '12px', paddingBottom: '4px' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <input type="number" placeholder="Win Rate %" value={globalWinRate || ''} onChange={(e) => setGlobalWinRate(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #333', color: '#fff', fontSize: '12px', paddingBottom: '4px' }} />
                            </div>
                            <button onClick={applyGlobalToAll} style={{ padding: '6px 10px', background: '#222', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>Apply</button>
                        </div>

                        {/* User List Scroll Area */}
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {Object.entries(affectedUsers).map(([id, u]) => (
                                <div key={id} style={{ padding: '15px', background: '#111', border: '1px solid #1a1a1a', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '32px', height: '32px', background: '#222', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#f0b90b' }}>
                                            {u.name[0]?.toUpperCase()}
                                        </div>
                                        <div style={{ maxWidth: '120px' }}>
                                            <p style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</p>
                                            <p style={{ fontSize: '11px', color: '#444', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <input type="number" value={u.payoutRate} onChange={(e) => updateUserRate(id, 'payoutRate', e.target.value)} style={{ width: '30px', background: 'transparent', border: 'none', borderBottom: '1px solid #333', color: '#00c087', fontSize: '12px', fontWeight: '700', textAlign: 'center' }} />
                                                <span style={{ fontSize: '10px', color: '#333' }}>%</span>
                                                <input type="number" value={u.winRate} onChange={(e) => updateUserRate(id, 'winRate', e.target.value)} style={{ width: '30px', background: 'transparent', border: 'none', borderBottom: '1px solid #333', color: '#f0b90b', fontSize: '12px', fontWeight: '700', textAlign: 'center' }} />
                                                <span style={{ fontSize: '10px', color: '#333' }}>%</span>
                                            </div>
                                        </div>
                                        <button onClick={() => removeUserFromSignal(id)} style={{ padding: '6px', background: 'transparent', border: 'none', color: '#444', cursor: 'pointer' }}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {Object.keys(affectedUsers).length === 0 && (
                                <div style={{ margin: 'auto', textAlign: 'center', color: '#333' }}>
                                    <Search size={40} style={{ marginBottom: '10px' }} />
                                    <p style={{ fontSize: '14px' }}>No targets selected.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Sheet Modal Replacement (Styled with Premium Feel) */}
            {showUserModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(5px)' }}>
                    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} style={{ width: '100%', maxWidth: '600px', background: '#0e0e0e', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', padding: '30px', border: '1px solid #222', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 -20px 40px rgba(0,0,0,0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Select Target Users</h3>
                            <button onClick={() => setShowUserModal(false)} style={{ background: '#222', border: 'none', padding: '10px', borderRadius: '50%', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <div style={{ position: 'relative', marginBottom: '24px' }}>
                            <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '14px 14px 14px 45px', background: '#000', border: '1px solid #222', borderRadius: '15px', color: '#fff', fontSize: '14px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {filteredUsers.map(u => {
                                const isAdded = !!affectedUsers[u.id];
                                return (
                                    <div key={u.id}
                                        onClick={() => isAdded ? removeUserFromSignal(u.id) : addUserToSignal(u)}
                                        style={{
                                            padding: '16px',
                                            background: isAdded ? 'rgba(240,185,11,0.05)' : '#161616',
                                            border: `1px solid ${isAdded ? '#f0b90b' : '#222'}`,
                                            borderRadius: '16px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <div style={{ width: '40px', height: '40px', background: '#222', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                                                {u.name?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: '700', fontSize: '14px' }}>{u.name}</p>
                                                <p style={{ fontSize: '11px', color: '#666' }}>{u.email}</p>
                                            </div>
                                        </div>
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            background: isAdded ? '#f0b90b' : 'transparent',
                                            border: `2px solid ${isAdded ? '#f0b90b' : '#333'}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {isAdded && <span style={{ color: '#000', fontSize: '14px', fontWeight: '900' }}>✓</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>
            )}

            <style>{`
                .pulse-dot {
                    animation: pulse 1.5s infinite;
                }
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(240,185,11,0.7); }
                    70% { transform: scale(1.1); opacity: 0.8; box-shadow: 0 0 0 10px rgba(240,185,11,0); }
                    100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(240,185,11,0); }
                }
                *::-webkit-scrollbar { width: 4px; }
                *::-webkit-scrollbar-track { background: transparent; }
                *::-webkit-scrollbar-thumb { background: #222; borderRadius: 10px; }
            `}</style>
        </div>
    );
};

export default AdminSignals;
