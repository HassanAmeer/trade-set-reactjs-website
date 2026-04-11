import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const C2C = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Buy');

    const tradingCompanies = [
        { name: 'U Brothers Trading Company', sub: '#' },
        { name: '888 Trading Company', sub: '#' },
        { name: 'shop1', sub: 'Top U Business' }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="app-container"
            style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '0 0 100px 0', color: '#fff', fontFamily: 'Inter, sans-serif' }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '1px solid #222', marginBottom: '8px' }}>
                <ChevronLeft size={24} onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
                <h1 style={{ flex: 1, textAlign: 'center', fontSize: '18px', fontWeight: '700', marginRight: '24px' }}>C2C</h1>
            </div>

            {/* Tabs */}
            <div style={{ padding: '0 8px', borderBottom: '1px solid var(--accent-gold)', marginBottom: '16px', display: 'flex' }}>
                <div
                    onClick={() => setActiveTab('Buy')}
                    style={{
                        background: activeTab === 'Buy' ? 'var(--accent-gold)' : 'transparent',
                        color: activeTab === 'Buy' ? '#fff' : '#fff',
                        padding: '10px 30px',
                        borderRadius: '4px 4px 0 0',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: 'pointer'
                    }}
                >
                    Buy
                </div>
                <div
                    onClick={() => setActiveTab('Sell')}
                    style={{
                        background: activeTab === 'Sell' ? 'var(--accent-gold)' : 'transparent',
                        color: '#fff',
                        padding: '10px 30px',
                        borderRadius: '4px 4px 0 0',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        marginLeft: '15px'
                    }}
                >
                    Sell
                </div>
            </div>

            {/* Company List */}
            <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tradingCompanies.map((company, index) => (
                    <div
                        key={index}
                        style={{
                            background: '#2c2c2e',
                            borderRadius: '8px',
                            padding: '25px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative'
                        }}
                    >
                        <div style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            color: 'var(--accent-gold)',
                            textAlign: 'center',
                            marginBottom: '15px'
                        }}>
                            {company.name}
                        </div>
                        <div style={{ fontSize: '14px', color: '#fff', fontWeight: '500' }}>
                            {company.sub}
                        </div>
                        <button style={{
                            position: 'absolute',
                            right: '15px',
                            bottom: '15px',
                            background: '#00c087',
                            color: '#fff',
                            padding: '8px 24px',
                            borderRadius: '4px',
                            border: 'none',
                            fontWeight: '700',
                            fontSize: '14px',
                            cursor: 'pointer'
                        }}>
                            Buy
                        </button>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default C2C;
