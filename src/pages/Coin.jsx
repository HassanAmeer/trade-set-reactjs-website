import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, SlidersHorizontal, Search, X, HomeIcon, PodcastIcon } from 'lucide-react';
import { useMarket } from '../context/MarketContext';

const Coin = () => {
    const { assets, selectedAsset, setSelectedAsset, loading } = useMarket();
    const [activeType, setActiveType] = useState('Buy');
    const [activePositionTab, setActivePositionTab] = useState('My position');
    const [showAssetList, setShowAssetList] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');

    // Generate realistic order book data based on real price
    const getOrderBook = () => {
        if (!selectedAsset) return { buy: [], sell: [] };
        const price = parseFloat(selectedAsset.rate.replace(/,/g, ''));
        const precision = price < 1 ? 6 : 2;

        const buy = [
            { price: (price * 0.9999).toFixed(precision), qty: (Math.random() * 0.5 + 0.1).toFixed(3), width: '60%' },
            { price: (price * 0.9998).toFixed(precision), qty: (Math.random() * 0.5 + 0.1).toFixed(3), width: '70%' },
            { price: (price * 0.9997).toFixed(precision), qty: (Math.random() * 0.5 + 0.1).toFixed(3), width: '75%' },
            { price: (price * 0.9996).toFixed(precision), qty: (Math.random() * 0.5 + 0.1).toFixed(3), width: '40%' },
            { price: (price * 0.9995).toFixed(precision), qty: (Math.random() * 0.5 + 0.1).toFixed(3), width: '90%' },
            { price: (price * 0.9994).toFixed(precision), qty: (Math.random() * 0.5 + 0.1).toFixed(3), width: '45%' },
        ];

        const sell = [
            { price: (price * 1.0001).toFixed(precision), qty: (Math.random() * 0.5 + 0.1).toFixed(3), width: '72%' },
            { price: (price * 1.0002).toFixed(precision), qty: (Math.random() * 0.5 + 0.1).toFixed(3), width: '63%' },
            { price: (price * 1.0003).toFixed(precision), qty: (Math.random() * 0.5 + 0.1).toFixed(3), width: '55%' },
            { price: (price * 1.0004).toFixed(precision), qty: (Math.random() * 0.5 + 0.1).toFixed(3), width: '35%' },
            { price: (price * 1.0005).toFixed(precision), qty: (Math.random() * 0.5 + 0.1).toFixed(3), width: '60%' },
            { price: (price * 1.0006).toFixed(precision), qty: (Math.random() * 0.5 + 0.1).toFixed(3), width: '90%' },
        ];

        return { buy, sell };
    };

    const { buy: buyOrders, sell: sellOrders } = getOrderBook();

    const filteredAssets = assets.filter(a => {
        const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = activeFilter === 'All' || a.category === activeFilter;
        return matchesSearch && matchesCat;
    });

    if (!selectedAsset) return <div className="skeleton-loader" style={{ height: '100vh' }}></div>;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="app-container"
            style={{ padding: '0 0 100px 0', minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'Inter, sans-serif' }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 12px', borderBottom: '1px solid #1a1a1a', marginBottom: '10px' }}>
                <div
                    style={{ fontSize: '18px', fontWeight: '800' }}
                >
                    Positions
                </div>
                {/* <SlidersHorizontal size={20} color="#888" /> */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '18px', fontWeight: '800', cursor: 'pointer' }}>
                    <PodcastIcon size={20} color="#888" />
                </div>
            </div>

            <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid #111', padding: '0 12px' }}>
                    {['My position', 'My closed position'].map(tab => (
                        <div
                            key={tab}
                            onClick={() => setActivePositionTab(tab)}
                            style={{
                                padding: '12px 15px',
                                fontSize: '13px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                borderBottom: activePositionTab === tab ? '2px solid var(--accent-gold)' : '2px solid transparent',
                                color: activePositionTab === tab ? '#fff' : '#555',
                                transition: 'all 0.3s'
                            }}
                        >
                            {tab}
                        </div>
                    ))}
                </div>
                <div style={{ textAlign: 'center', padding: '100px 0', color: '#333', fontSize: '14px', fontWeight: '600' }}>
                    <div style={{ marginBottom: '10px' }}>No {activePositionTab === 'My position' ? 'active' : 'closed'} positions found</div>
                    <div style={{ fontSize: '12px', color: '#222' }}>Start trading to see your positions here.</div>
                </div>
            </div>

            {/* Asset Selection Modal */}
            <AnimatePresence>
                {showAssetList && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: '#0a0a0a',
                            zIndex: 1000,
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <div style={{ padding: '20px', borderBottom: '1px solid #222' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                <X size={24} onClick={() => setShowAssetList(false)} style={{ cursor: 'pointer' }} />
                                <div style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: '10px', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                                    <Search size={18} color="#555" />
                                    <input
                                        type="text"
                                        placeholder="Search coins or forex..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ background: 'none', border: 'none', color: '#fff', padding: '12px', width: '100%', outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                                {['All', 'Cryptocurrency', 'Foreign Exchange', 'Precious Metals'].map(cat => (
                                    <div
                                        key={cat}
                                        onClick={() => setActiveFilter(cat)}
                                        style={{
                                            padding: '6px 16px',
                                            borderRadius: '20px',
                                            backgroundColor: activeFilter === cat ? 'var(--accent-gold)' : '#1a1a1a',
                                            color: activeFilter === cat ? '#000' : '#888',
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            whiteSpace: 'nowrap',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {cat}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
                            {filteredAssets.map(asset => (
                                <div
                                    key={asset.id}
                                    onClick={() => {
                                        setSelectedAsset(asset);
                                        setShowAssetList(false);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '15px 20px',
                                        borderBottom: '1px solid #111',
                                        backgroundColor: selectedAsset?.id === asset.id ? '#1a1a1a' : 'transparent'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <img src={asset.flag} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                                        <div>
                                            <div style={{ fontWeight: '700' }}>{asset.name}</div>
                                            <div style={{ fontSize: '11px', color: '#555' }}>{asset.fullName || asset.category}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: '700' }}>{asset.rate}</div>
                                        <div style={{ fontSize: '11px', color: asset.change?.startsWith('+') ? '#00c087' : '#ff4d4f' }}>
                                            {asset.change}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Coin;
