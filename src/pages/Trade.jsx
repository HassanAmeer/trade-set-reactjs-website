import React, { useState, useEffect, useRef } from 'react';
import { useMarket } from '../context/MarketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Home as HomeIcon, ChevronDown, Search, X, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../firebase-setup';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, updateDoc, doc, increment } from 'firebase/firestore';

const Trade = () => {
    const { assets, selectedAsset, setSelectedAsset } = useMarket();
    const { user, updateUser } = useAuth();
    const [activeTime, setActiveTime] = useState('D');
    const [showAssetList, setShowAssetList] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [chartLoading, setChartLoading] = useState(true);
    const [tradeAmount, setTradeAmount] = useState('10');
    const [trading, setTrading] = useState(false);
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

    useEffect(() => {
        if (selectedAsset) {
            const updated = assets.find(a => a.id === selectedAsset.id);
            if (updated) setSelectedAsset(updated);
        }
    }, [assets]);

    useEffect(() => {
        if (!selectedAsset) return;

        setChartLoading(true);
        if (container.current) {
            container.current.innerHTML = '';
        }

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;

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

        const timer = setTimeout(() => {
            setChartLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, [selectedAsset?.id, activeTime]);

    const handlePlaceTrade = async (direction) => {
        if (!user) {
            alert("Please login to trade");
            return;
        }

        const amount = parseFloat(tradeAmount);
        if (isNaN(amount) || amount <= 0) {
            alert("Invalid amount");
            return;
        }

        if (user.balance < amount) {
            alert("Insufficient balance");
            return;
        }

        setTrading(true);
        try {
            await updateUser({ balance: increment(-amount) });

            await addDoc(collection(db, 'users', user.id, 'trades'), {
                asset: selectedAsset.name,
                amount: amount,
                direction: direction,
                entryRate: selectedAsset.rate,
                timestamp: new Date().toISOString(),
                status: 'open',
                userEmail: user.email,
                userId: user.id
            });

            alert(`Trade placed: ${direction} ${selectedAsset.name} for ${amount} USDT`);
        } catch (error) {
            alert("Trade failed: " + error.message);
        } finally {
            setTrading(false);
        }
    };

    const filteredAssetsBySearchAndCat = assets.filter(a => {
        const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = activeFilter === 'All' || a.category === activeFilter;
        return matchesSearch && matchesCat;
    });

    const renderSkeleton = () => (
        <div style={{ padding: '0 0 100px 0', backgroundColor: '#0a0a0a', minHeight: '100vh' }}>
            <div style={{ padding: '12px 16px', backgroundColor: '#111', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="skeleton-loader" style={{ width: '20px', height: '20px', borderRadius: '4px' }}></div>
                    <div className="skeleton-loader" style={{ width: '100px', height: '24px', borderRadius: '4px' }}></div>
                </div>
                <div className="skeleton-loader" style={{ width: '20px', height: '20px', borderRadius: '50%' }}></div>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="skeleton-loader" style={{ width: '40px', height: '14px', borderRadius: '2px' }}></div>
                ))}
            </div>
            <div className="skeleton-loader" style={{ height: '400px', width: '100%', margin: '8px 0' }}></div>
            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="skeleton-loader" style={{ height: '60px', borderRadius: '8px' }}></div>
                <div className="skeleton-loader" style={{ height: '60px', borderRadius: '8px' }}></div>
            </div>
        </div>
    );

    if (!assets || assets.length === 0 || !selectedAsset) return renderSkeleton();

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                backgroundColor: '#0a0a0a',
                minHeight: '100vh',
                color: '#fff',
                paddingBottom: '160px',
                fontFamily: 'Inter, system-ui, sans-serif'
            }}
        >
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
                        <span style={{ fontWeight: '700', fontSize: '18px' }}>{selectedAsset?.name}</span>
                        <ChevronDown size={16} color="#888" />
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end' }}>
                    <span style={{ paddingLeft: '10px', fontSize: '11px', color: selectedAsset?.change?.startsWith('+') ? '#00c087' : '#ff4d4f' }}>
                        {selectedAsset?.change}
                    </span>
                </div>
                <Link to="/" style={{ marginLeft: '12px' }}>
                    <HomeIcon size={20} color="#fff" />
                </Link>
            </div>

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

            <div style={{ height: '450px', width: '100%', position: 'relative', backgroundColor: '#000' }}>
                {chartLoading && (
                    <div
                        className="skeleton-loader"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            zIndex: 10,
                            borderRadius: 0
                        }}
                    />
                )}
                <div
                    ref={container}
                    className="tradingview-widget-container"
                    style={{ height: '100%', width: '100%' }}
                >
                    <div className="tradingview-widget-container__widget" style={{ height: '100%', width: '100%' }}></div>
                </div>
            </div>

            <div style={{
                padding: '12px 16px',
                fontSize: '11px',
                color: '#777',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                backgroundColor: '#0a0a0a',
                borderBottom: '1px solid #1a1a1a',
                lineHeight: '1.8'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <span>Time: <span style={{ color: '#aaa' }}>{new Date().toISOString().slice(0, 16).replace('T', ' ')}</span></span>
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <span>Open: <span style={{ color: '#aaa' }}>{selectedAsset?.rate}</span></span>
                    </div>
                </div>
            </div>

            <div style={{
                position: 'fixed',
                bottom: '80px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100%',
                maxWidth: '480px',
                backgroundColor: 'rgba(17, 17, 17, 0.95)',
                backdropFilter: 'blur(10px)',
                padding: '20px 16px',
                borderTop: '1px solid #222',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                zIndex: 100
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', color: '#888' }}>Amount:</span>
                        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#000', borderRadius: '8px', padding: '4px 12px', border: '1px solid #333' }}>
                            <input 
                                type="number" 
                                value={tradeAmount}
                                onChange={(e) => setTradeAmount(e.target.value)}
                                style={{ width: '60px', background: 'none', border: 'none', color: '#fff', textAlign: 'center', fontSize: '16px', fontWeight: '700', outline: 'none' }} 
                            />
                            <span style={{ fontSize: '12px', color: 'var(--accent-gold)', marginLeft: '4px' }}>USDT</span>
                        </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>
                        Balance: <span style={{ color: '#fff' }}>{user?.balance || '0.00'} USDT</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        onClick={() => handlePlaceTrade('BUY')}
                        disabled={trading}
                        style={{
                            flex: 1,
                            background: 'linear-gradient(to right, #00c087, #00d2ad)',
                            color: '#fff',
                            padding: '16px',
                            borderRadius: '12px',
                            border: 'none',
                            fontWeight: '800',
                            fontSize: '15px',
                            cursor: trading ? 'not-allowed' : 'pointer',
                            opacity: trading ? 0.7 : 1,
                            boxShadow: '0 4px 15px rgba(0, 192, 135, 0.3)'
                        }}
                    >
                        {trading ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : 'BUY / LONG'}
                    </button>
                    <button 
                        onClick={() => handlePlaceTrade('SELL')}
                        disabled={trading}
                        style={{
                            flex: 1,
                            background: 'linear-gradient(to right, #ff4d4f, #ff7875)',
                            color: '#fff',
                            padding: '16px',
                            borderRadius: '12px',
                            border: 'none',
                            fontWeight: '800',
                            fontSize: '15px',
                            cursor: trading ? 'not-allowed' : 'pointer',
                            opacity: trading ? 0.7 : 1,
                            boxShadow: '0 4px 15px rgba(255, 77, 79, 0.3)'
                        }}
                    >
                        {trading ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : 'SELL / SHORT'}
                    </button>
                </div>
            </div>

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
                            {filteredAssetsBySearchAndCat.map(asset => (
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
                            {filteredAssetsBySearchAndCat.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#555' }}>
                                    No results found
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Trade;
