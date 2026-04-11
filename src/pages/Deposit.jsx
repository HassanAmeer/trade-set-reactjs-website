import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Deposit = () => {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="app-container"
            style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '0 0 40px 0' }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '1px solid #222' }}>
                <ChevronLeft size={24} onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
                <h1 style={{ flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: '700', marginRight: '24px' }}>Recharge</h1>
            </div>

            <div style={{ padding: '20px 16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '20px' }}>Deposit</h2>

                {/* Tab */}
                <div style={{ borderBottom: '1px solid var(--accent-gold)', marginBottom: '24px' }}>
                    <div style={{
                        display: 'inline-block',
                        background: 'var(--accent-gold)',
                        color: '#000',
                        padding: '8px 16px',
                        borderRadius: '4px 4px 0 0',
                        fontSize: '14px',
                        fontWeight: '700'
                    }}>
                        USDT Deposit
                    </div>
                </div>

                {/* QR Code Placeholder */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <div style={{ background: '#fff', padding: '10px', borderRadius: '4px' }}>
                        <img
                            src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=TMR7XE9h****eApXK4"
                            alt="Deposit QR"
                            style={{ width: '180px', height: '180px' }}
                        />
                    </div>
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span style={{ color: '#fff' }}>Link network</span>
                        <span style={{ color: '#fff', fontWeight: '600' }}>TRC20</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span style={{ color: '#fff' }}>USDT Address</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ color: '#fff', fontSize: '12px' }}>TMR7XE9h****eApXK4</span>
                            <span style={{ color: 'var(--accent-gold)', fontWeight: '600', cursor: 'pointer' }}>Copy</span>
                        </div>
                    </div>
                </div>

                {/* Input */}
                <div style={{ marginBottom: '24px' }}>
                    <input
                        type="text"
                        placeholder="Enter deposit amount"
                        style={{
                            width: '100%',
                            background: 'transparent',
                            border: '1px solid #444',
                            borderRadius: '4px',
                            padding: '12px',
                            color: '#fff',
                            fontSize: '14px'
                        }}
                    />
                </div>

                {/* Voucher Upload */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Recharge voucher</div>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        border: '1px solid #fff',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                    }}>
                        <Plus size={40} color="#fff" strokeWidth={1.5} />
                    </div>
                </div>

                {/* Footer Button */}
                <button style={{
                    width: '100%',
                    background: '#a5b4bc',
                    color: '#fff',
                    padding: '14px',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: '700',
                    fontSize: '16px',
                    cursor: 'pointer'
                }}>
                    Recharge
                </button>
            </div>
        </motion.div>
    );
};

export default Deposit;
