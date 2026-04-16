import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, TrendingUp, TrendingDown, Clock, Lock, Unlock, ArrowBigDown, RefreshCw } from 'lucide-react';
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
            // Show only non-binary trades for general transaction history
            setTrades(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(t => t.direction !== 'BUY' && t.direction !== 'SELL'));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getTradeIcon = (trade) => {
        if (trade.direction === 'BUY') return <TrendingUp size={18} color="#00c087" />;
        if (trade.direction === 'SELL') return <TrendingDown size={18} color="#ff4d4f" />;
        if (trade.direction === 'FREEZE') return <Lock size={18} color="#f0b90b" />;
        if (trade.direction === 'RELEASE') return <Unlock size={18} color="#00c087" />;
        if (trade.direction === 'SECURE') return <ArrowBigDown size={18} color="#00c087" />;
        if (trade.direction === 'LIQUIDATE') return <RefreshCw size={18} color="#f0b90b" />;
        return <Clock size={18} color="#888" />;
    };

    const getStatusColor = (trade) => {
        if (trade.status === 'profit' || trade.status === 'Completed' || trade.type === 'release') return '#00c087';
        if (trade.status === 'loss' || trade.direction === 'FREEZE') return '#ff4d4f';
        if (trade.status === 'open' || trade.status === 'Pending') return 'var(--accent-gold)';
        return '#888';
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
                <h1 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Transaction History</h1>
            </div>

            <div style={{ padding: '20px 16px' }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="skeleton-loader" style={{ width: '100%', height: '110px', borderRadius: '12px' }}></div>
                        ))}
                    </div>
                ) : trades.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px 0', color: '#666' }}>No transactions found.</div>
                ) : (
                    trades.map(trade => (
                        <div key={trade.id} style={{ backgroundColor: '#111', padding: '16px', borderRadius: '12px', marginBottom: '12px', border: '1px solid #222' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {getTradeIcon(trade)}
                                    <span style={{ fontWeight: '700', fontSize: '15px' }}>{trade.asset || trade.symbol}</span>
                                    <span style={{ 
                                        fontSize: '10px', 
                                        backgroundColor: `${getStatusColor(trade)}15`, 
                                        color: getStatusColor(trade), 
                                        padding: '2px 6px', 
                                        borderRadius: '4px',
                                        fontWeight: '800'
                                    }}>
                                        {trade.direction?.toUpperCase() || trade.type?.toUpperCase()}
                                    </span>
                                </div>
                                <span style={{ color: 'var(--accent-gold)', fontWeight: '700' }}>
                                    {trade.amount || trade.usdtAmount?.toFixed(2)} USDT
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', color: '#888' }}>
                                <div>Rate: <span style={{ color: '#ccc' }}>{trade.entryRate || trade.rate}</span></div>
                                <div style={{ textAlign: 'right' }}>
                                    {trade.category === 'mining' ? (
                                        <>Amount: <span style={{ color: '#ccc' }}>{trade.assetAmount?.toFixed(6)}</span></>
                                    ) : (
                                        <>Profit: <span style={{
                                            color: getStatusColor(trade),
                                            fontWeight: '700'
                                        }}>
                                            {trade.status === 'profit' ? `+${trade.resultAmount?.toFixed(2)}` :
                                                trade.status === 'loss' ? `-${Math.abs(trade.amount || 0).toFixed(2)}` : '0.00'}
                                        </span></>
                                    )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={12} /> 
                                    {trade.direction === 'RELEASE' && trade.frozenAt ? (
                                        <span style={{ fontSize: '10px' }}>Locked: {new Date(trade.frozenAt).toLocaleDateString()} - {new Date(trade.timestamp).toLocaleDateString()}</span>
                                    ) : (
                                        new Date(trade.timestamp).toLocaleString()
                                    )}
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '10px', color: '#555' }}>
                                    {trade.status?.toUpperCase() || 'COMPLETED'}
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
