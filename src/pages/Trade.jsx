import React, { useState, useEffect, useRef } from 'react';
import { useMarket } from '../context/MarketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Home as HomeIcon, ChevronDown, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const Trade = () => {
    const { assets } = useMarket();
    const [selectedAsset, setSelectedAsset] = useState(assets[0] || { name: 'BTC/USDT', rate: '0.00' });
    const [activeTime, setActiveTime] = useState('1m');
    const [showAssetList, setShowAssetList] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const container = useRef();

    const timeframes = [
        { label: '1 min', value: '1' },
        { label: '5 min', value: '5' },
        { label: '15 min', value: '15' },
        { label: '30 min', value: '30' },
        { label: '1 hour', value: '60' },
        { label: '1 day', value: 'D' },
        { label: '1 week', value: 'W' }
    ];

    // Effect to update the local selected asset when the context updates
    useEffect(() => {
        if (selectedAsset) {
            const updated = assets.find(a => a.id === selectedAsset.id);
            if (updated) setSelectedAsset(updated);
        }
    }, [assets]);

    // TradingView Widget Loader
    useEffect(() => {
        if (!selectedAsset) return;

        // Clean up previous widget
        if (container.current) {
            container.current.innerHTML = '';
        }

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;

        // Map asset name to TradingView symbol
        let symbol = selectedAsset.name.replace('/', '');
        if (selectedAsset.category === 'Cryptocurrency') {
            symbol = `BINANCE:${symbol}`;
        } else if (selectedAsset.category === 'Foreign Exchange') {
            symbol = `FX_IDC:${symbol}`;
        } else if (selectedAsset.name === 'XAU/USD') {
            symbol = "OANDA:XAUUSD";
        }

        script.innerHTML = JSON.stringify({
            "autosize": true,
            "symbol": symbol,
            "interval": activeTime,
            "timezone": "Etc/UTC",
            "theme": "dark",
            "style": "1",
            "locale": "en",
            "enable_publishing": false,
            "hide_top_toolbar": true,
            "hide_legend": true,
            "save_image": false,
            "calendar": false,
            "hide_volume": true,
            "support_host": "https://www.tradingview.com"
        });

        container.current.appendChild(script);
    }, [selectedAsset, activeTime]);

    const filteredAssets = assets.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                backgroundColor: '#0a0a0a',
                minHeight: '100vh',
                color: '#fff',
                paddingBottom: '100px',
                fontFamily: 'Inter, system-ui, sans-serif'
            }}
        >
            {/* Trading Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: '#111',
                borderBottom: '1px solid #222',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Menu size={20} color="#fff" onClick={() => setShowAssetList(true)} style={{ cursor: 'pointer' }} />
                    <div
                        onClick={() => setShowAssetList(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                    >
                        <span style={{ fontWeight: '700', fontSize: '18px' }}>{selectedAsset.name}</span>
                        <ChevronDown size={16} color="#888" />
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: selectedAsset.change?.startsWith('+') ? '#00c087' : '#ff4d4f' }}>
                        {selectedAsset.rate}
                    </span>
                    <span style={{ fontSize: '11px', color: selectedAsset.change?.startsWith('+') ? '#00c087' : '#ff4d4f' }}>
                        {selectedAsset.change}
                    </span>
                </div>
                <Link to="/" style={{ marginLeft: '12px' }}>
                    <HomeIcon size={20} color="#fff" />
                </Link>
            </div>

            {/* Timeframes */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 16px',
                fontSize: '12px',
                color: '#888',
                backgroundColor: '#111',
                borderBottom: '1px solid #222'
            }}>
                {timeframes.map(time => (
                    <div
                        key={time.value}
                        onClick={() => setActiveTime(time.value)}
                        style={{
                            cursor: 'pointer',
                            color: activeTime === time.value ? 'var(--accent-gold)' : '#888',
                            fontWeight: activeTime === time.value ? '700' : '500',
                            transition: 'all 0.2s'
                        }}
                    >
                        {time.label}
                    </div>
                ))}
            </div>

            {/* Chart Area */}
            <div style={{ height: '450px', width: '100%', position: 'relative', backgroundColor: '#000' }}>
                <div
                    ref={container}
                    className="tradingview-widget-container"
                    style={{ height: '100%', width: '100%' }}
                >
                    <div className="tradingview-widget-container__widget" style={{ height: '100%', width: '100%' }}></div>
                </div>
            </div>

            {/* Trading Info Strip */}
            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ backgroundColor: '#111', padding: '12px', borderRadius: '8px', border: '1px solid #222' }}>
                    <div style={{ color: '#555', fontSize: '11px', marginBottom: '4px' }}>24h High</div>
                    <div style={{ fontWeight: '600' }}>{selectedAsset.high24h || '--'}</div>
                </div>
                <div style={{ backgroundColor: '#111', padding: '12px', borderRadius: '8px', border: '1px solid #222' }}>
                    <div style={{ color: '#555', fontSize: '11px', marginBottom: '4px' }}>24h Low</div>
                    <div style={{ fontWeight: '600' }}>{selectedAsset.low24h || '--'}</div>
                </div>
            </div>

            {/* Bottom Trade Buttons */}
            <div style={{
                position: 'fixed',
                bottom: '80px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100%',
                maxWidth: '480px',
                display: 'flex',
                gap: '12px',
                padding: '0 16px',
                zIndex: 100
            }}>
                <button style={{
                    flex: 1,
                    background: 'linear-gradient(to right, #00c087, #00d2ad)',
                    color: '#fff',
                    padding: '16px',
                    borderRadius: '12px',
                    border: 'none',
                    fontWeight: '800',
                    fontSize: '15px',
                    boxShadow: '0 4px 15px rgba(0, 192, 135, 0.3)'
                }}>
                    BUY / LONG
                </button>
                <button style={{
                    flex: 1,
                    background: 'linear-gradient(to right, #ff4d4f, #ff7875)',
                    color: '#fff',
                    padding: '16px',
                    borderRadius: '12px',
                    border: 'none',
                    fontWeight: '800',
                    fontSize: '15px',
                    boxShadow: '0 4px 15px rgba(255, 77, 79, 0.3)'
                }}>
                    SELL / SHORT
                </button>
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
                        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #222' }}>
                            <X size={24} onClick={() => setShowAssetList(false)} style={{ cursor: 'pointer' }} />
                            <div style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: '10px', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                                <Search size={18} color="#555" />
                                <input
                                    type="text"
                                    placeholder="Search coins..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ background: 'none', border: 'none', color: '#fff', padding: '12px', width: '100%', outline: 'none' }}
                                />
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
                                        <img src={asset.flag} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                                        <div>
                                            <div style={{ fontWeight: '700' }}>{asset.name}</div>
                                            <div style={{ fontSize: '11px', color: '#555' }}>{asset.category}</div>
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

export default Trade;
