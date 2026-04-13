import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-setup';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { TrendingUp, TrendingDown, Clock, Sparkles, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminSignals = () => {
    const [duration, setDuration] = useState('5');
    const [loading, setLoading] = useState(false);
    const [currentSignal, setCurrentSignal] = useState(null);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        const fetchSignal = async () => {
            try {
                const snap = await getDoc(doc(db, 'admin_set', 'market_signal'));
                if (snap.exists()) {
                    setCurrentSignal(snap.data());
                }
            } catch (err) {
                console.error(err);
            } finally {
                setFetching(false);
            }
        };
        fetchSignal();
        
        // Polling every 10 seconds to keep UI updated
        const interval = setInterval(fetchSignal, 10000);
        return () => clearInterval(interval);
    }, []);

    const setSignal = async (direction) => {
        setLoading(true);
        try {
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + parseInt(duration));

            const signalData = {
                direction, // 'UP' or 'DOWN'
                duration: parseInt(duration),
                startTime: new Date().toISOString(),
                expiresAt: expiresAt.toISOString(),
                isActive: true
            };

            await setDoc(doc(db, 'admin_set', 'market_signal'), signalData);
            setCurrentSignal(signalData);
            alert(`Signal set: Market will go ${direction} for ${duration} minutes.`);
        } catch (error) {
            alert("Failed to set signal: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const clearSignal = async () => {
        setLoading(true);
        try {
            await setDoc(doc(db, 'admin_set', 'market_signal'), { isActive: false });
            setCurrentSignal(null);
            alert("Signal cleared. Market back to normal.");
        } catch (error) {
            alert("Failed to clear signal: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const isSignalActive = currentSignal?.isActive && new Date(currentSignal?.expiresAt) > new Date();

    if (fetching) return <div style={{ padding: '20px', color: '#888' }}><Loader2 className="animate-spin" /> Fetching signal status...</div>;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ color: '#fff' }}>
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 8px' }}>Market Signal Control</h2>
                <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>
                    Force the market candles and trade outcomes for all users.
                </p>
            </div>

            {/* Current Status Card */}
            <div style={{ 
                padding: '24px', 
                background: 'linear-gradient(135deg, #161616, #0d0d0d)', 
                borderRadius: '16px', 
                border: '1px solid #222', 
                marginBottom: '30px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {isSignalActive && (
                    <div style={{ position: 'absolute', top: 0, right: 0, padding: '8px 16px', background: '#f0b90b', color: '#000', fontSize: '11px', fontWeight: '800', borderBottomLeftRadius: '12px' }}>
                        LIVE SIGNAL ACTIVE
                    </div>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ 
                        width: '50px', 
                        height: '50px', 
                        borderRadius: '12px', 
                        backgroundColor: isSignalActive ? (currentSignal.direction === 'UP' ? 'rgba(0,192,135,0.1)' : 'rgba(255,77,79,0.1)') : '#222',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {isSignalActive ? (
                            currentSignal.direction === 'UP' ? <TrendingUp color="#00c087" /> : <TrendingDown color="#ff4d4f" />
                        ) : <ShieldCheck color="#555" />}
                    </div>
                    <div>
                        <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>Market Status</div>
                        <div style={{ fontSize: '18px', fontWeight: '700' }}>
                           {isSignalActive ? `Forced ${currentSignal.direction}` : 'Real-time Market'}
                        </div>
                    </div>
                    
                    {isSignalActive && (
                        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                             <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>Expires At</div>
                             <div style={{ fontSize: '15px', fontWeight: '600', color: '#f0b90b' }}>
                                {new Date(currentSignal.expiresAt).toLocaleTimeString()}
                             </div>
                        </div>
                    )}
                </div>

                {isSignalActive && (
                    <button 
                        onClick={clearSignal}
                        style={{ width: '100%', marginTop: '20px', padding: '12px', backgroundColor: 'rgba(255,77,79,0.1)', color: '#ff4d4f', border: '1px solid rgba(255,77,79,0.2)', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}
                    >
                        Stop Custom Signal
                    </button>
                )}
            </div>

            {/* Set New Signal */}
            <div style={{ background: '#111', padding: '24px', borderRadius: '16px', border: '1px solid #1a1a1a' }}>
               <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <Sparkles size={18} color="#f0b90b" /> Set New Signal
               </h3>

               <div style={{ marginBottom: '20px' }}>
                   <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '8px' }}>Duration (Minutes)</label>
                   <div style={{ display: 'flex', gap: '10px' }}>
                       {['1', '2', '5', '10', '15', '30'].map(m => (
                           <button 
                                key={m}
                                onClick={() => setDuration(m)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: '1px solid ' + (duration === m ? '#f0b90b' : '#222'),
                                    backgroundColor: duration === m ? 'rgba(240,185,11,0.1)' : 'transparent',
                                    color: duration === m ? '#f0b90b' : '#666',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                           >
                               {m}m
                           </button>
                       ))}
                   </div>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                   <button 
                        onClick={() => setSignal('UP')}
                        disabled={loading}
                        style={{
                            padding: '16px',
                            backgroundColor: '#00c087',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: '800',
                            fontSize: '15px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                        }}
                   >
                       {loading ? <Loader2 className="animate-spin" /> : <><TrendingUp size={20} /> Force GREEN (UP)</>}
                   </button>
                   <button 
                        onClick={() => setSignal('DOWN')}
                        disabled={loading}
                        style={{
                            padding: '16px',
                            backgroundColor: '#ff4d4f',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: '800',
                            fontSize: '15px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                        }}
                   >
                       {loading ? <Loader2 className="animate-spin" /> : <><TrendingDown size={20} /> Force RED (DOWN)</>}
                   </button>
               </div>

               <div style={{ marginTop: '20px', padding: '12px', backgroundColor: 'rgba(240,185,11,0.05)', borderRadius: '8px', border: '1px solid rgba(240,185,11,0.1)', display: 'flex', gap: '10px' }}>
                   <AlertCircle size={18} color="#f0b90b" style={{ flexShrink: 0 }} />
                   <p style={{ fontSize: '11px', color: '#aaa', margin: 0 }}>
                       When a signal is active, all users will see a custom candle chart moving in the specified direction. 
                       All trades placed during this time will result in a WIN if they match the signal direction, or a LOSS if they don't.
                   </p>
               </div>
            </div>
        </motion.div>
    );
};

export default AdminSignals;
