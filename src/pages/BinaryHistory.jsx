import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, TrendingUp, TrendingDown, Clock, Trophy, CircleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase-setup';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const BinaryHistory = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchTrades();
    }, [user]);

    const fetchTrades = async () => {
        try {
            // Only fetch BUY/SELL trades
            const q = query(
                collection(db, 'users', user.id, 'trades'), 
                orderBy('timestamp', 'desc')
            );
            const snap = await getDocs(q);
            // Filter locally to ensure we only get binary trades
            const list = snap.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(t => t.direction === 'BUY' || t.direction === 'SELL');
            
            setTrades(list);
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
            style={{ minHeight: '100vh', background: '#000', color: '#fff' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', borderBottom: '1px solid #1a1a1a', backgroundColor: '#050505', sticky: 'top', zIndex: 10 }}>
                <ChevronLeft size={24} onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
                <h1 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Binary Trade History</h1>
            </div>

            <div style={{ padding: '20px 16px' }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="skeleton-loader" style={{ width: '100%', height: '120px', borderRadius: '16px' }}></div>
                        ))}
                    </div>
                ) : trades.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px 0', color: '#444' }}>
                        <Clock size={40} style={{ marginBottom: '15px', opacity: 0.5 }} />
                        <div style={{ fontSize: '14px' }}>No binary trades found.</div>
                    </div>
                ) : (
                    trades.map(trade => (
                        <div key={trade.id} style={{ 
                            backgroundColor: '#0a0a0a', 
                            padding: '20px', 
                            borderRadius: '16px', 
                            marginBottom: '15px', 
                            border: '1px solid #1a1a1a',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        backgroundColor: trade.direction === 'BUY' ? 'rgba(0,192,135,0.1)' : 'rgba(255,77,79,0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {trade.direction === 'BUY' ? <TrendingUp size={20} color="#00c087" /> : <TrendingDown size={20} color="#ff4d4f" />}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '16px' }}>{trade.asset}</div>
                                        <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
                                            {trade.direction === 'BUY' ? 'Buy / Long' : 'Sell / Short'}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ 
                                        color: trade.status === 'profit' ? '#00c087' : '#ff4d4f', 
                                        fontWeight: '900', 
                                        fontSize: '18px' 
                                    }}>
                                        {trade.status === 'profit' ? `+${trade.resultAmount?.toFixed(2)}` : `-${Math.abs(trade.amount || 0).toFixed(2)}`}
                                        <span style={{ fontSize: '10px', marginLeft: '2px' }}>USDT</span>
                                    </div>
                                    <div style={{ 
                                        fontSize: '10px', 
                                        fontWeight: '800', 
                                        color: trade.status === 'profit' ? '#00c087' : '#ff4d4f',
                                        backgroundColor: trade.status === 'profit' ? 'rgba(0,192,135,0.1)' : 'rgba(255,77,79,0.1)',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        display: 'inline-block',
                                        marginTop: '4px'
                                    }}>
                                        {trade.status?.toUpperCase()}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', paddingTop: '15px', borderTop: '1px solid #1a1a1a' }}>
                                <div>
                                    <div style={{ fontSize: '9px', color: '#444', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>INVESTED</div>
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>${Number(trade.amount || 0).toFixed(2)}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '9px', color: '#444', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>ENTRY PRICE</div>
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>${trade.entryRate}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '9px', color: '#444', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>DATE</div>
                                    <div style={{ fontSize: '11px', color: '#777' }}>
                                        {new Date(trade.timestamp).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </motion.div>
    );
};

export default BinaryHistory;
