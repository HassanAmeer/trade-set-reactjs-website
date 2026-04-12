import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Clock, CheckCircle2, XCircle, AlertCircle, Calendar, Hash, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase-setup';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

const DepositHistory = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [deposits, setDeposits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVoucher, setSelectedVoucher] = useState(null);

    useEffect(() => {
        if (user) {
            fetchDeposits();
        }
    }, [user]);

    const fetchDeposits = async () => {
        try {
            const q = query(
                collection(db, 'users', user.id, 'deposits'),
                orderBy('timestamp', 'desc')
            );
            const querySnapshot = await getDocs(q);
            const depositList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setDeposits(depositList);
        } catch (error) {
            console.error("Error fetching deposits:", error);
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0a0a0a' }}>
            <div className="circular-loader-simple"></div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="app-container"
            style={{ paddingBottom: '100px' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '32px' }}>
                <ChevronLeft size={24} onClick={() => navigate('/deposit')} style={{ cursor: 'pointer' }} />
                <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Deposit History</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {deposits.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px 20px', color: '#555' }}>
                        <AlertCircle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <p>No deposit records found.</p>
                    </div>
                ) : (
                    deposits.map((deposit, index) => (
                        <motion.div
                            key={deposit.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="glass"
                            style={{ padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}
                        >
                            <div className="flex-between" style={{ marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,184,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)' }}>
                                        <Hash size={16} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: '700' }}>{deposit.amount} USDT</div>
                                        <div style={{ fontSize: '11px', color: '#666' }}>TRC20 Network</div>
                                    </div>
                                </div>
                                <div style={{ 
                                    padding: '4px 10px', 
                                    borderRadius: '20px', 
                                    fontSize: '10px', 
                                    fontWeight: '700', 
                                    backgroundColor: `${getStatusColor(deposit.status)}20`, 
                                    color: getStatusColor(deposit.status),
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    textTransform: 'capitalize'
                                }}>
                                    {getStatusIcon(deposit.status)}
                                    {deposit.status}
                                </div>
                            </div>

                            <div className="flex-between" style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666', fontSize: '11px' }}>
                                    <Calendar size={12} />
                                    {new Date(deposit.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                </div>
                                <div 
                                    style={{ color: 'var(--accent-gold)', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'underline' }}
                                    onClick={() => setSelectedVoucher(deposit.screenshot)}
                                >
                                    View Voucher <ExternalLink size={10} />
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Voucher Modal Popup */}
            <AnimatePresence>
                {selectedVoucher && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            zIndex: 1000,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{ position: 'relative', maxWidth: '100%', maxHeight: '80%' }}
                        >
                            <button
                                onClick={() => setSelectedVoucher(null)}
                                style={{
                                    position: 'absolute',
                                    top: '-40px',
                                    right: '0',
                                    backgroundColor: '#fff',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '50%',
                                    padding: '5px',
                                    cursor: 'pointer',
                                    boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
                                }}
                            >
                                <X size={20} />
                            </button>
                            <img
                                src={selectedVoucher}
                                alt="Payment Screenshot"
                                style={{ width: '100%', height: 'auto', borderRadius: '12px', display: 'block', border: '5px solid #fff' }}
                            />
                            <p style={{ color: '#fff', textAlign: 'center', marginTop: '15px', fontSize: '12px', fontWeight: '500' }}>
                                Payment Voucher Details
                            </p>
                        </motion.div>
                        <div 
                            style={{ position: 'absolute', inset: 0, zIndex: -1 }} 
                            onClick={() => setSelectedVoucher(null)} 
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default DepositHistory;
