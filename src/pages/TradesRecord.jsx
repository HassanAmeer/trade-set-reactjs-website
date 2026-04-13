import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase-setup';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const TradesRecord = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchTrades();
    }, [user]);

    const fetchTrades = async () => {
        try {
            const q = query(collection(db, 'users', user.id, 'trades'), orderBy('timestamp', 'desc'));
            const snap = await getDocs(q);
            setTrades(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="app-container"
            style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: '#fff' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', borderBottom: '1px solid #222' }}>
                <ChevronLeft size={24} onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
                <h1 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Trade History</h1>
            </div>

            <div style={{ padding: '20px 16px' }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {[1,2,3,4,5].map(i => (
                            <div key={i} className="skeleton-loader" style={{ width: '100%', height: '110px', borderRadius: '12px' }}></div>
                        ))}
                    </div>
                ) : trades.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px 0', color: '#666' }}>No trades yet.</div>
                ) : (
                    trades.map(trade => (
                        <div key={trade.id} style={{ backgroundColor: '#111', padding: '16px', borderRadius: '12px', marginBottom: '12px', border: '1px solid #222' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {trade.direction === 'BUY' ? <TrendingUp size={18} color="#00c087" /> : <TrendingDown size={18} color="#ff4d4f" />}
                                    <span style={{ fontWeight: '700', fontSize: '15px' }}>{trade.asset}</span>
                                    <span style={{ fontSize: '10px', backgroundColor: trade.direction === 'BUY' ? 'rgba(0,192,135,0.1)' : 'rgba(255,77,79,0.1)', color: trade.direction === 'BUY' ? '#00c087' : '#ff4d4f', padding: '2px 6px', borderRadius: '4px' }}>
                                        {trade.direction}
                                    </span>
                                </div>
                                <span style={{ color: 'var(--accent-gold)', fontWeight: '700' }}>{trade.amount} USDT</span>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', color: '#888' }}>
                                <div>Entry: <span style={{ color: '#ccc' }}>{trade.entryRate}</span></div>
                                <div style={{ textAlign: 'right' }}>Status: <span style={{ color: trade.status === 'open' ? '#00c087' : '#aaa' }}>{trade.status}</span></div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={12} /> {new Date(trade.timestamp).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </motion.div>
    );
};

export default TradesRecord;
