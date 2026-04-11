import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, X, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Withdrawal = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('USDT Withdrawal');

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="app-container"
            style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '0 0 40px 0', color: '#fff' }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '1px solid #222' }}>
                <ChevronLeft size={24} onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
                <h1 style={{ flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: '700', marginRight: '24px' }}>Withdrawal Channel</h1>
            </div>

            <div style={{ padding: '20px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '25px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Withdraw coins</h2>
                    <span style={{ color: '#00c087', fontSize: '18px', fontWeight: '700' }}>USDT</span>
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
                        Bank Withdrawal
                    </div>
                </div>

                {/* Balance */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '15px' }}>
                    <span>Available Balance</span>
                    <span style={{ color: '#00c087', fontWeight: '600' }}>0 USDT</span>
                </div>

                <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '30px' }}>USDT Address</div>

                {/* Amount Input */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Withdrawal amount USDT</div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: '#fff',
                        padding: '10px 14px',
                        borderRadius: '4px'
                    }}>
                        <input
                            type="text"
                            defaultValue="devbeast143@gmail.com"
                            style={{ flex: 1, border: 'none', color: '#000', fontSize: '14px', outline: 'none' }}
                        />
                        <div style={{ width: '22px', height: '22px', background: '#555', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={14} color="#fff" />
                        </div>
                    </div>
                </div>

                {/* Password Input */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>Transaction password</div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: '#fff',
                        padding: '10px 14px',
                        borderRadius: '4px'
                    }}>
                        <input
                            type="password"
                            defaultValue="........"
                            style={{ flex: 1, border: 'none', color: '#000', fontSize: '14px', outline: 'none' }}
                        />
                        <div style={{ width: '22px', height: '22px', background: '#555', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Eye size={16} color="#fff" />
                        </div>
                    </div>
                </div>

                {/* Footer Button */}
                <button style={{
                    width: '100%',
                    background: 'var(--accent-gold)',
                    color: '#000',
                    padding: '14px',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: '700',
                    fontSize: '18px',
                    cursor: 'pointer',
                    marginTop: '10px'
                }}>
                    Withdrawal
                </button>
            </div>
        </motion.div>
    );
};

export default Withdrawal;
