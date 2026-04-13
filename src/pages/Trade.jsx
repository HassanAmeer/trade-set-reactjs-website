import React, { useState, useEffect, useRef } from 'react';
import { useMarket } from '../context/MarketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Home as HomeIcon, ChevronDown, Search, X, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../firebase-setup';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, updateDoc, doc, increment, onSnapshot, getDoc } from 'firebase/firestore';
import CustomChart from '../components/CustomChart';
import { Trophy, CircleAlert, Sparkles } from 'lucide-react';

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
    const [activeSignal, setActiveSignal] = useState(null);
    const [showResult, setShowResult] = useState(null); // { status: 'win' | 'loss', amount: number }
    const [tradeCountdown, setTradeCountdown] = useState(0);
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
        const unsub = onSnapshot(doc(db, 'admin_set', 'market_signal'), (snap) => {
            if (snap.exists()) {
                const data = snap.data();
                const isExpired = new Date(data.expiresAt) < new Date();
                if (data.isActive && !isExpired) {
                    setActiveSignal(data);
                } else {
                    setActiveSignal(null);
                }
            }
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (selectedAsset) {
            const updated = assets.find(a => a.id === selectedAsset.id);
            if (updated) setSelectedAsset(updated);
        }
    }, [assets]);

    useEffect(() => {
        if (!selectedAsset || activeSignal || !container.current) return;

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
    }, [selectedAsset?.id, activeTime, activeSignal]);

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
        setTradeCountdown(10); // 10 second trade for testing, can be 30 or 60
        
        try {
            // Deduct balance immediately
            await updateUser({ balance: increment(-amount) });

            const tradeRef = await addDoc(collection(db, 'users', user.id, 'trades'), {
                asset: selectedAsset.name,
                amount: amount,
                direction: direction,
                entryRate: selectedAsset.rate,
                timestamp: new Date().toISOString(),
                status: 'open',
                userEmail: user.email,
                userId: user.id
            });

            // Start countdown timer
            let timeLeft = 10;
            const timer = setInterval(async () => {
                timeLeft -= 1;
                setTradeCountdown(timeLeft);
                
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    
                    // Resolve trade
                    let isWin = false;
                    // Check signal (refetch to be sure)
                    const signalSnap = await getDoc(doc(db, 'admin_set', 'market_signal'));
                    const signal = signalSnap.data();
                    const isSignalActiveNow = signal?.isActive && new Date(signal?.expiresAt) > new Date();

                    if (isSignalActiveNow) {
                        isWin = (direction === 'BUY' && signal.direction === 'UP') || 
                                (direction === 'SELL' && signal.direction === 'DOWN');
                    } else {
                        // random 50/50 if no signal
                        isWin = Math.random() > 0.5;
                    }

                    const profitAmount = isWin ? amount * 1.85 : 0; // 85% profit
                    
                    if (isWin) {
                        await updateUser({ balance: increment(profitAmount) });
                    }

                    await updateDoc(tradeRef, {
                        status: isWin ? 'profit' : 'loss',
                        resultAmount: isWin ? profitAmount : -amount,
                        closedAt: new Date().toISOString()
                    });

                    setShowResult({ status: isWin ? 'win' : 'loss', amount: isWin ? profitAmount : amount });
                    setTrading(false);
                }
            }, 1000);

        } catch (error) {
            alert("Trade failed: " + error.message);
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
                {(chartLoading && !activeSignal) && (
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
                
                <div style={{ 
                    height: '100%', 
                    width: '100%', 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    opacity: activeSignal ? 1 : 0, 
                    pointerEvents: activeSignal ? 'auto' : 'none',
                    transition: 'opacity 0.5s ease',
                    zIndex: activeSignal ? 5 : 0
                }}>
                    {activeSignal && <CustomChart activeSignal={activeSignal} currentRate={selectedAsset?.rate} />}
                </div>

                <div
                    ref={container}
                    className="tradingview-widget-container"
                    style={{ 
                        height: '100%', 
                        width: '100%', 
                        opacity: activeSignal ? 0 : 1,
                        transition: 'opacity 0.5s ease'
                    }}
                >
                    <div className="tradingview-widget-container__widget" style={{ height: '100%', width: '100%' }}></div>
                </div>

                {/* Trade Countdown Overlay */}
                {trading && (
                    <div style={{ position: 'absolute', top: '25%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(17, 17, 17, 0.9)', padding: '15px 30px', borderRadius: '15px', border: '1px solid #333', textAlign: 'center', zIndex: 20, backdropFilter: 'blur(5px)' }}>
                        <div style={{ fontSize: '11px', color: '#f0b90b', fontWeight: '800', marginBottom: '2px', letterSpacing: '1px' }}>MARKET RESOLVING</div>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#fff' }}>{tradeCountdown}s</div>
                    </div>
                )}
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

            {/* Result Popup */}
            <AnimatePresence>
                {showResult && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            style={{ backgroundColor: '#111', width: '100%', maxWidth: '350px', borderRadius: '24px', padding: '30px', textAlign: 'center', border: '1px solid #222', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
                        >
                            {showResult.status === 'win' ? (
                                <>
                                    <div style={{ width: '80px', height: '80px', backgroundColor: 'rgba(0,192,135,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                        <Trophy size={40} color="#00c087" />
                                    </div>
                                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#00c087', margin: '0 0 10px' }}>PROFIT EARNED!</h2>
                                    <p style={{ color: '#888', fontSize: '14px', marginBottom: '20px' }}>Congratulations! Your trade predictions were correct.</p>
                                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#fff', marginBottom: '30px' }}>
                                        +{showResult.amount.toFixed(2)} <span style={{ fontSize: '16px', color: '#f0b90b' }}>USDT</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ width: '80px', height: '80px', backgroundColor: 'rgba(255,77,79,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                        <CircleAlert size={40} color="#ff4d4f" />
                                    </div>
                                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#ff4d4f', margin: '0 0 10px' }}>TRADE LOSS</h2>
                                    <p style={{ color: '#888', fontSize: '14px', marginBottom: '20px' }}>Unfortunately, the market moved against your trade.</p>
                                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#fff', marginBottom: '30px' }}>
                                        -{showResult.amount.toFixed(2)} <span style={{ fontSize: '16px', color: '#f0b90b' }}>USDT</span>
                                    </div>
                                </>
                            )}
                            <button 
                                onClick={() => setShowResult(null)}
                                style={{ width: '100%', padding: '16px', backgroundColor: '#f0b90b', color: '#000', borderRadius: '12px', border: 'none', fontWeight: '800', cursor: 'pointer' }}
                            >
                                CONTINUE
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Trade;
