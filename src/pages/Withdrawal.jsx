import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, X, Eye, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { db } from '../firebase-setup';
import { collection, addDoc } from 'firebase/firestore';

const Withdrawal = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { minWithdrawal } = useBranding();
    const [activeTab, setActiveTab] = useState('USDT Withdrawal');
    const [amount, setAmount] = useState('');
    const [address, setAddress] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleWithdrawal = async () => {
        if (!amount || parseFloat(amount) < minWithdrawal) return;
        if (parseFloat(amount) > (user?.balance || 0)) return;
        if (!address) return;
        if (!password) return;

        // Verify login password
        if (password !== user.password) {
            alert("Incorrect login password!");
            return;
        }

        setSubmitting(true);
        try {
            const { updateDoc, doc, increment } = await import('firebase/firestore');

            // 1. Deduct balance from user document
            const userRef = doc(db, 'users', user.id);
            await updateDoc(userRef, {
                balance: increment(-parseFloat(amount))
            });

            // 2. Create withdrawal record
            const withdrawalData = {
                amount: parseFloat(amount),
                address,
                status: 'pending',
                timestamp: new Date().toISOString(),
                type: 'withdrawal',
                userEmail: user.email,
                userId: user.id,
                uid: user.id,
                method: activeTab
            };

            await addDoc(collection(db, 'users', user.id, 'withdrawals'), withdrawalData);

            alert("Withdrawal request submitted! Amount has been deducted from your balance.");
            
            // Reset fields
            setAmount('');
            setAddress('');
            setPassword('');
            navigate('/withdrawal-history');
        } catch (error) {
            console.error(error);
            alert("Failed to submit withdrawal: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="app-container"
            style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '0 0 40px 0', color: '#fff' }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid #222' }}>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <ChevronLeft size={24} onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
                    <h1 style={{ flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: '700' }}>Withdrawal Channel</h1>
                </div>
                <button 
                    onClick={() => navigate('/withdrawal-history')}
                    style={{ 
                        backgroundColor: 'rgba(255,184,0,0.1)', 
                        border: '1px solid rgba(255,184,0,0.2)', 
                        padding: '6px 10px', 
                        borderRadius: '8px', 
                        color: 'var(--accent-gold)', 
                        fontSize: '12px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        marginLeft: '10px'
                    }}
                >
                    <Clock size={14} /> History
                </button>
            </div>


            <div style={{ padding: '20px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '25px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Withdraw coins</h2>
                    <span style={{ color: '#00c087', fontSize: '18px', fontWeight: '700' }}>{activeTab === 'USDT Withdrawal' ? 'USDT' : 'Bank'}</span>
                </div>

                {/* Tabs */}
                <div style={{ borderBottom: '1px solid var(--accent-gold)', marginBottom: '24px', display: 'flex' }}>
                    <div
                        onClick={() => setActiveTab('USDT Withdrawal')}
                        style={{
                            background: activeTab === 'USDT Withdrawal' ? 'var(--accent-gold)' : 'transparent',
                            color: activeTab === 'USDT Withdrawal' ? '#000' : '#888',
                            padding: '10px 16px',
                            borderRadius: '4px 4px 0 0',
                            fontSize: '14px',
                            fontWeight: '700',
                            cursor: 'pointer'
                        }}
                    >
                        USDT Withdrawal
                    </div>
                    <div
                        onClick={() => setActiveTab('Bank Withdrawal')}
                        style={{
                            background: activeTab === 'Bank Withdrawal' ? 'var(--accent-gold)' : 'transparent',
                            color: activeTab === 'Bank Withdrawal' ? '#000' : '#fff',
                            padding: '10px 16px',
                            borderRadius: '4px 4px 0 0',
                            fontSize: '14px',
                            fontWeight: '700',
                            cursor: 'pointer'
                        }}
                    >
                        Bank Format
                    </div>
                </div>

                {/* Balance */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '15px' }}>
                    <span>Available Balance</span>
                    <span style={{ color: '#00c087', fontWeight: '600' }}>{user?.balance || '0.00'} USDT</span>
                </div>

                <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '10px' }}>
                    {activeTab === 'USDT Withdrawal' ? 'USDT Address' : 'Bank Account Details'}
                </div>
                
                {/* Address Input */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#1a1a1a',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    border: (address === '' && amount !== '') ? '1px solid #ff4d4f' : '1px solid #333'
                }}>
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder={activeTab === 'USDT Withdrawal' ? "Enter TRC20 Address" : "Enter Bank details"}
                        style={{ flex: 1, border: 'none', background: 'transparent', color: '#fff', fontSize: '14px', outline: 'none' }}
                    />
                    {address && (
                        <div onClick={() => setAddress('')} style={{ cursor: 'pointer', width: '22px', height: '22px', background: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={14} color="#fff" />
                        </div>
                    )}
                </div>
                {address === '' && amount !== '' && (
                    <div style={{ color: '#ff4d4f', fontSize: '11px', marginBottom: '20px', fontWeight: '600' }}>Withdrawal address is required</div>
                )}
                <div style={{ marginBottom: '30px' }}></div>

                {/* Amount Input */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Withdrawal amount USDT</div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: '#1a1a1a',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: amount ? (
                            parseFloat(amount) < minWithdrawal || parseFloat(amount) > (user?.balance || 0) 
                            ? '1px solid #ff4d4f' 
                            : '1px solid var(--accent-gold)'
                        ) : '1px solid #333'
                    }}>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={`Min. limit is ${minWithdrawal} USDT`}
                            style={{ flex: 1, border: 'none', background: 'transparent', color: '#fff', fontSize: '14px', outline: 'none' }}
                        />
                    </div>
                    {amount && parseFloat(amount) < minWithdrawal && (
                        <div style={{ color: '#ff4d4f', fontSize: '11px', marginTop: '6px', fontWeight: '600' }}>Minimum withdrawal is {minWithdrawal} USDT</div>
                    )}
                    {amount && parseFloat(amount) > (user?.balance || 0) && (
                        <div style={{ color: '#ff4d4f', fontSize: '11px', marginTop: '6px', fontWeight: '600' }}>Insufficient balance</div>
                    )}
                </div>

                {/* Password Input */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Login password</div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: '#1a1a1a',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: (password === '' && amount !== '') ? '1px solid #ff4d4f' : '1px solid #333'
                    }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter login password"
                            style={{ flex: 1, border: 'none', background: 'transparent', color: '#fff', fontSize: '14px', outline: 'none' }}
                        />
                        <div onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                            <Eye size={16} color={showPassword ? "var(--accent-gold)" : "#888"} />
                        </div>
                    </div>
                    {password === '' && amount !== '' && (
                        <div style={{ color: '#ff4d4f', fontSize: '11px', marginTop: '6px', fontWeight: '600' }}>Login password is required</div>
                    )}
                </div>

                {/* Footer Button */}
                <button 
                    onClick={handleWithdrawal}
                    disabled={submitting}
                    style={{
                    width: '100%',
                    background: submitting ? '#333' : 'var(--accent-gold)',
                    color: submitting ? '#888' : '#000',
                    padding: '16px',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '800',
                    fontSize: '16px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    {submitting ? <><Loader2 className="animate-spin" size={20} /> Processing...</> : 'Submit Withdrawal'}
                </button>
            </div>
            
            <div style={{ marginTop: '24px', padding: '0 16px' }}>
                <div style={{ padding: '16px', backgroundColor: 'rgba(0, 192, 135, 0.05)', borderRadius: '16px', border: '1px solid rgba(0, 192, 135, 0.1)' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <CheckCircle2 size={16} color="#00c087" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ fontSize: '12px', color: '#888', lineHeight: '1.5' }}>
                            Withdrawals are processed manually. Please ensure your receiving address is correct. Any lost funds due to wrong network or address can not be recovered.
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default Withdrawal;
