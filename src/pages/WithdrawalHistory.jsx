import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Clock, CheckCircle2, XCircle, AlertCircle, Calendar, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase-setup';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

const WithdrawalHistory = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchWithdrawals();
        }
    }, [user]);

    const fetchWithdrawals = async () => {
        try {
            const q = query(
                collection(db, 'users', user.id, 'withdrawals'),
                orderBy('timestamp', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const list = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setWithdrawals(list);
        } catch (error) {
            console.error("Error fetching withdrawals:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return '#00c087';
            case 'rejected': return '#ff4d4f';
            default: return 'var(--accent-gold)';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved': return <CheckCircle2 size={14} />;
            case 'rejected': return <XCircle size={14} />;
            default: return <Clock size={14} />;
        }
    };

    if (loading) return (
        <div style={{ padding: '24px', backgroundColor: '#050505', minHeight: '100vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '32px' }}>
                <div className="skeleton-loader" style={{ width: '24px', height: '24px', borderRadius: '4px' }}></div>
                <div className="skeleton-loader" style={{ width: '180px', height: '24px', borderRadius: '4px' }}></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[1,2,3,4,5].map(i => (
                    <div key={i} className="skeleton-loader" style={{ width: '100%', height: '100px', borderRadius: '16px' }}></div>
                ))}
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="app-container"
            style={{ paddingBottom: '100px', backgroundColor: '#050505' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '32px', padding: '20px 20px 0' }}>
                <ChevronLeft size={24} onClick={() => navigate(-1)} style={{ cursor: 'pointer', color: '#fff' }} />
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>Withdrawal Record</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 20px' }}>
                {withdrawals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px 20px', color: '#555' }}>
                        <AlertCircle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <p>No withdrawal records found.</p>
                    </div>
                ) : (
                    withdrawals.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="glass"
                            style={{ padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', backgroundColor: '#111' }}
                        >
                            <div className="flex-between" style={{ marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,77,79,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff4d4f' }}>
                                        <ArrowUpRight size={18} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>{item.amount} USDT</div>
                                        <div style={{ fontSize: '11px', color: '#666' }}>{item.method || 'USDT TRC20'}</div>
                                    </div>
                                </div>
                                <div style={{ 
                                    padding: '4px 10px', 
                                    borderRadius: '20px', 
                                    fontSize: '10px', 
                                    fontWeight: '800', 
                                    backgroundColor: `${getStatusColor(item.status)}20`, 
                                    color: getStatusColor(item.status),
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    textTransform: 'uppercase'
                                }}>
                                    {getStatusIcon(item.status)}
                                    {item.status}
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#888' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Calendar size={12} />
                                    {new Date(item.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    Dest: {item.address}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </motion.div>
    );
};

export default WithdrawalHistory;
