import React, { useState, useEffect } from 'react';
import { useMarket } from '../context/MarketContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// ── Stock Avatar: shows logo or first-letter circle fallback ──────────────
const StockAvatar = ({ asset, size = 28 }) => {
    const [failed, setFailed] = React.useState(false);
    const letter = (asset.symbol || asset.name || '?')[0].toUpperCase();
    if (failed) {
        return (
            <div style={{
                width: size, height: size, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#1a1a1a',
                border: '1px solid #3a3a3a',
                fontWeight: '700', color: '#8a8a93', fontSize: size * 0.42, userSelect: 'none',
            }}>
                {letter}
            </div>
        );
    }
    return (
        <img
            src={asset.flag}
            alt={asset.name}
            style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            onError={() => setFailed(true)}
        />
    );
};

const Market = () => {
    const { assets, loading, setIsActive } = useMarket();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('All');

    // Activate market data loading for Market page
    useEffect(() => {
        setIsActive(true);
        return () => setIsActive(false);
    }, [setIsActive]);

    const TAB_MAP = {
        'All': 'All',
        'Cryptocurrency': 'Cryptocurrency',
        'Exchange': 'Foreign Exchange',
        'Metals': 'Precious Metals',
        'Stocks': 'Stocks',
    };

    const filteredAssets = assets.filter(a => {
        if (activeTab === 'All') return true;
        const categoryValue = TAB_MAP[activeTab] || activeTab;
        if (a.category !== categoryValue) return false;
        // Explicitly exclude Ethereum from Precious Metals section
        if (categoryValue === 'Precious Metals' && (a.symbol?.includes('ETH') || a.name?.includes('ETH'))) return false;
        return true;
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
                {['All', 'Cryptocurrency', 'Exchange', 'Metals', 'Stocks'].map(tab => (
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
                            transition: 'all 0.3s',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {tab}
                    </div>
                ))}
            </div>

            {/* Table Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '0 12px 8px 12px', fontSize: '12px', fontWeight: '800', color: '#666', borderBottom: '1px solid #222' }}>
                <span>Currency</span>
                <span style={{ textAlign: 'right' }}>Price / Change</span>
            </div>

            {/* Asset List */}
            <div style={{ padding: '0 10px 30px 10px' }}>
                {loading ? (
                    [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 2px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div className="skeleton-loader" style={{ width: '28px', height: '18px', borderRadius: '1px' }}></div>
                                <div className="skeleton-loader" style={{ width: '60px', height: '14px' }}></div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div className="skeleton-loader" style={{ width: '110px', height: '32px', borderRadius: '6px' }}></div>
                            </div>
                        </div>
                    ))
                ) : (
                    filteredAssets.map((asset) => {
                        const isUp = asset.change.startsWith('+');
                        return (
                            <motion.div
                                layout
                                key={asset.id}
                                onClick={() => navigate('/trade', { state: { assetId: asset.id } })}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 2px',
                                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                                    cursor: 'pointer'
                                }}
                            >
                                {/* Left: icon + name */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {asset.category === 'Stocks' ? (
                                        <StockAvatar asset={asset} size={32} />
                                    ) : (
                                        <img src={asset.flag} alt={asset.name} style={{ width: '28px', height: '18px', borderRadius: '1px', objectFit: 'cover' }} />
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: '700', fontSize: '13px', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {asset.name}
                                            {asset.category === 'Precious Metals' && (
                                                <span style={{ color: asset.isLive ? '#00c087' : 'grey', fontSize: '12px' }}>✓</span>
                                            )}
                                        </span>
                                        {asset.fullName && (
                                            <span style={{ fontSize: '10px', color: '#555', fontWeight: '500', marginTop: '1px' }}>{asset.fullName}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Right: change badge + price below */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                    {asset.category !== 'Stocks' && (
                                        <div
                                            className={`rate-btn ${isUp ? 'rate-up' : 'rate-down'}`}
                                            style={{
                                                display: 'inline-block',
                                                minWidth: '90px',
                                                padding: '5px 10px',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: '700',
                                                textAlign: 'center',
                                            }}
                                        >
                                            {asset.change}
                                        </div>
                                    )}
                                    <span style={{
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        color: asset.category === 'Precious Metals' && !asset.isLive ? '#555' : '#ccc',
                                    }}>
                                        ${asset.rate}
                                    </span>
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

