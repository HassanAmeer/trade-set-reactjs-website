import React, { useState, useEffect } from 'react';
import { useMarket } from '../context/MarketContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Market = () => {
    const { assets, loading, setIsActive } = useMarket();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('All');

    // Activate market data loading for Market page
    useEffect(() => {
        setIsActive(true);
        return () => setIsActive(false);
    }, [setIsActive]);

    const filteredAssets = assets.filter(a => {
        if (activeTab === 'All') return true;
        return a.category?.toLowerCase() === activeTab.toLowerCase();
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="app-container"
            style={{ padding: '0 0 100px 0', minHeight: '100vh', background: '#111' }}
        >
            {/* Page Title */}
            <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid #222', marginBottom: '8px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Market</h1>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '15px', padding: '0 12px 2px 12px', borderBottom: '1px solid #333', marginBottom: '16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {['All', 'Foreign Exchange', 'Cryptocurrency', 'Precious Metals'].map(tab => (
                    <div
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: tab === 'All' ? '6px 20px' : '2px 10px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            color: activeTab === tab ? '#000' : '#888',
                            backgroundColor: activeTab === tab ? 'var(--accent-gold)' : 'transparent',
                            borderRadius: '4px 4px 0 0',
                            transition: 'all 0.3s'
                        }}
                    >
                        {tab}
                    </div>
                ))}
            </div>

            {/* Table Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', padding: '0 12px 8px 12px', fontSize: '12px', fontWeight: '800', color: '#fff', borderBottom: '1px solid #222' }}>
                <span>Currency</span>
                <span style={{ textAlign: 'center' }}>New exchange rate</span>
                <span style={{ textAlign: 'right' }}>Exchange rate changes</span>
            </div>

            {/* Asset List */}
            <div style={{ padding: '0 10px' }}>
                {loading ? (
                    [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', alignItems: 'center', padding: '14px 2px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div className="skeleton-loader" style={{ width: '28px', height: '18px', borderRadius: '1px' }}></div>
                                <div className="skeleton-loader" style={{ width: '60px', height: '14px' }}></div>
                            </div>
                            <div className="skeleton-loader" style={{ width: '50px', height: '14px', margin: '0 auto' }}></div>
                            <div style={{ textAlign: 'right' }}>
                                <div className="skeleton-loader" style={{ width: '110px', height: '32px', borderRadius: '6px' }}></div>
                            </div>
                        </div>
                    ))
                ) : (
                    filteredAssets.map((asset, index) => {
                        const isUp = asset.change.startsWith('+');
                        return (
                            <motion.div
                                layout
                                key={asset.id}
                                onClick={() => navigate('/trade', { state: { assetId: asset.id } })}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1.5fr 1fr 1fr',
                                    alignItems: 'center',
                                    padding: '14px 2px',
                                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <img src={asset.flag} alt={asset.name} style={{ width: '28px', height: '18px', borderRadius: '1px', objectFit: 'cover' }} />
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: '700', fontSize: '13px', color: '#fff' }}>{asset.name}</span>
                                        {asset.fullName && (
                                            <span style={{ fontSize: '10px', color: '#666', fontWeight: '500', marginTop: '1px' }}>{asset.fullName}</span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ fontSize: '13px', textAlign: 'center', color: '#fff', fontWeight: '500' }}>{asset.rate}</div>
                                <div style={{ textAlign: 'right' }}>
                                    <div
                                        className={`rate-btn ${isUp ? 'rate-up' : 'rate-down'}`}
                                        style={{
                                            display: 'inline-block',
                                            width: '110px',
                                            padding: '8px 0',
                                            borderRadius: '6px',
                                            fontSize: '13px',
                                            fontWeight: '700'
                                        }}
                                    >
                                        {asset.change}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </motion.div>
    );
};

export default Market;
