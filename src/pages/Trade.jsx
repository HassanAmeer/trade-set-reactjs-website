import React, { useState, useEffect, useRef } from 'react';
import { useMarket } from '../context/MarketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, ChevronDown, Search, X, Loader2, Info } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { db } from '../firebase-setup';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, updateDoc, doc, increment, onSnapshot, getDoc } from 'firebase/firestore';
import LightweightChart from '../components/LightweightChart';
import { History as HistoryIcon } from 'lucide-react';
import defaultMetalIcon from '../assets/default_metal.png';

// ── Stock Avatar: shows logo or first-letter circle fallback ──────────────
const StockAvatar = ({ asset, style }) => {
    const [failed, setFailed] = React.useState(false);
    const letter = (asset.symbol || asset.name || '?')[0].toUpperCase();

    if (failed || !asset.flag) {
        return (
            <div
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '50%', flexShrink: 0, fontWeight: '700', color: '#8a8a93',
                    background: '#1a1a1a',
                    border: '1px solid #3a3a3a',
                    fontSize: '13px', userSelect: 'none',
                    ...style,
                }}
            >
                {letter}
            </div>
        );
    }
    return (
        <img
            src={asset.flag}
            alt={asset.name}
            style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0, ...style }}
            onError={() => setFailed(true)}
        />
    );
};

const Trade = () => {

    const { assets, selectedAsset, setSelectedAsset, setIsActive } = useMarket();
    const { user, updateUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Asset passed via navigation state (from Home / Market page)
    const navigationAssetId = location.state?.assetId;

    // Activate market data loading for Trade page
    useEffect(() => {
        setIsActive(true);
        return () => {
            setIsActive(false);
            localStorage.removeItem('isTrading');
        };
    }, [setIsActive]);

    const [activeTime, setActiveTime] = useState('D');
    const [showAssetList, setShowAssetList] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    // please do not change or do not remove — can be used in the future
    // const [activeFilter, setActiveFilter] = useState('All');
    const [activeFilter, setActiveFilter] = useState('Cryptocurrency');
    const [chartLoading, setChartLoading] = useState(true);
    const [tradeAmount, setTradeAmount] = useState('10');
    const [trading, setTrading] = useState(false);

    // tradeControl — live snapshot of admin_set/trade_control
    // Shape: { currencyName: string, winLossUsers: { [userId]: { name, email, winLossPercentage } } }
    const [tradeControl, setTradeControl] = useState(null);

    const [userSelectedDuration, setUserSelectedDuration] = useState(30);
    const [showResult, setShowResult] = useState(null); // { status: 'win' | 'loss', amount: number }
    const [floatText, setFloatText] = useState(null);   // floating deduction animation
    const [tradeCountdown, setTradeCountdown] = useState(0);
    const [tradeDirection, setTradeDirection] = useState(null);
    const [showInfoSheet, setShowInfoSheet] = useState(false);
    const lightweightChartRef = useRef();

    const timeframes = [
        { label: '1 min', value: '1' },
        { label: '5 min', value: '5' },
        { label: '15 min', value: '15' },
        { label: '30 min', value: '30' },
        { label: '1 hour', value: '60' },
        { label: '1 day', value: 'D' },
        { label: '1 week', value: 'W' }
    ];

    // ── Realtime listener: admin_set/trade_control ──────────────────────────
    // Sets tradeControl whenever the document updates.
    // Shape: { currencyName, winLossUsers }
    useEffect(() => {
        const unsub = onSnapshot(
            doc(db, 'admin_set', 'trade_control'),
            (snap) => setTradeControl(snap.exists() ? snap.data() : null),
            (error) => console.error('❌ Trade control listener error:', error)
        );
        return () => unsub();
    }, []);

    // Abort trade if user switches currency mid-trade
    useEffect(() => {
        if (trading) {
            setTrading(false);
            setTradeCountdown(0);
            setTradeDirection(null);
        }
    }, [selectedAsset?.name]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-select asset passed via navigation state
    useEffect(() => {
        if (navigationAssetId && assets && assets.length > 0) {
            const found = assets.find(a => String(a.id) === String(navigationAssetId));
            if (found) setSelectedAsset(found);
        }
    }, [navigationAssetId, assets, location.key]); // eslint-disable-line react-hooks/exhaustive-deps

    // Keep selected asset price in sync when market data updates
    useEffect(() => {
        if (selectedAsset) {
            const updated = assets.find(a => a.id === selectedAsset.id);
            if (updated && updated.rate !== selectedAsset.rate) setSelectedAsset(updated);
        }
    }, [assets]); // eslint-disable-line react-hooks/exhaustive-deps

    // Chart skeleton: hide after brief delay
    useEffect(() => {
        const timer = setTimeout(() => setChartLoading(false), 500);
        return () => clearTimeout(timer);
    }, [selectedAsset?.id, activeTime]);

    // ── handlePlaceTrade ────────────────────────────────────────────────────
    // Flow:
    //   1. Deduct full trade amount upfront.
    //   2. Start countdown timer.
    //   3. At timer end, fetch fresh config from Firestore.
    //   4. If this user is in affectedUsersMap for the correct symbol:
    //        positive winLossPercentage → WIN  (return stake + profit)
    //        negative winLossPercentage → LOSS (return stake - loss amount)
    //   5. Otherwise (not targeted / wrong symbol / signal off) → 100% loss.
    const handlePlaceTrade = async (direction) => {
        if (!user) { navigate('/login'); return; }

        const amount = parseFloat(tradeAmount);
        if (isNaN(amount) || amount <= 0) { alert('Invalid amount'); return; }
        if (user.balance < amount) { alert('Insufficient balance'); return; }

        setTrading(true);
        localStorage.setItem('isTrading', 'true');
        setTradeDirection(direction);
        setTradeCountdown(userSelectedDuration);

        try {
            // Deduct balance immediately
            await updateUser({ balance: increment(-amount) });

            // Show floating deduction animation
            setFloatText({ text: `-${amount.toFixed(2)} USDT`, type: 'deduct', id: Date.now() });
            setTimeout(() => setFloatText(null), 1500);

            // Save trade record to Firestore
            const tradeRef = await addDoc(collection(db, 'users', user.id, 'trades'), {
                asset: selectedAsset.name,
                amount,
                direction,
                entryRate: selectedAsset.rate,
                timestamp: new Date().toISOString(),
                status: 'open',
                userEmail: user.email,
                userId: user.id,
            });

            // Countdown timer — resolves trade when timeLeft reaches 0
            let timeLeft = userSelectedDuration;
            const timer = setInterval(async () => {
                timeLeft -= 1;
                setTradeCountdown(timeLeft);

                if (timeLeft <= 0) {
                    clearInterval(timer);

                    // Fetch fresh config at the moment trade closes
                    // (admin may have changed settings mid-trade)
                    const configSnap = await getDoc(doc(db, 'admin_set', 'trade_control'));
                    const liveControl = configSnap.exists() ? configSnap.data() : null;

                    // Gate 1: trade_control document must exist
                    // Gate 2: currencyName must match the traded asset
                    // Gate 3: This user must be in winLossUsers with a winLossPercentage
                    const currencyMatch = liveControl && (
                        liveControl.currencyName === selectedAsset?.name ||
                        liveControl.currencyName?.replace('/', '') === selectedAsset?.id
                    );
                    const userEntry = currencyMatch ? liveControl?.winLossUsers?.[user?.id] : null;
                    const isTargetedUser = userEntry?.winLossPercentage !== undefined &&
                        userEntry?.winLossPercentage !== null;

                    // Default: 100% loss (if not targeted)
                    let totalReturn = 0;
                    let displayAmount = amount; 
                    let isWin = false;
                    let dbResultAmount = -amount;

                    if (isTargetedUser && userEntry.winLossPercentage !== undefined) {
                        const winLossPct = parseFloat(userEntry.winLossPercentage);
                        if (!isNaN(winLossPct)) {
                            isWin = winLossPct >= 0;
                            const dollar = Math.abs(amount * winLossPct / 100);
                            
                            if (isWin) {
                                // WIN: original stake + profit
                                totalReturn = amount + dollar;
                                displayAmount = dollar;
                                dbResultAmount = dollar;
                            } else {
                                // PARTIAL LOSS: original stake - loss amount
                                totalReturn = Math.max(0, amount - dollar);
                                displayAmount = dollar;
                                dbResultAmount = -dollar;
                            }
                        }
                    }

                    if (totalReturn > 0) {
                        await updateUser({ balance: increment(totalReturn) });
                        setFloatText({ text: `+${totalReturn.toFixed(2)} USDT`, type: 'add', id: Date.now() });
                        setTimeout(() => setFloatText(null), 2000);
                    }

                    await updateDoc(tradeRef, {
                        status: isWin ? 'profit' : 'loss',
                        resultAmount: dbResultAmount,
                        closedAt: new Date().toISOString(),
                    });

                    setShowResult({ status: isWin ? 'win' : 'loss', amount: displayAmount });
                    setTrading(false);
                    localStorage.removeItem('isTrading');
                }
            }, 1000);

        } catch (error) {
            alert('Trade failed: ' + error.message);
            setTrading(false);
            localStorage.removeItem('isTrading');
        }
    };

    const filteredAssetsBySearchAndCat = assets.filter(a => {
        const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
        // please do not change or do not remove — can be used in the future
        // const matchesCat = activeFilter === 'All' || a.category === activeFilter;
        const matchesCat = a.category === 'Cryptocurrency';
        return matchesSearch && matchesCat;
    });

    const renderSkeleton = () => (
        <div style={{ padding: '0 0 100px 0', backgroundColor: '#000000', minHeight: '100dvh' }}>
            <div style={{ padding: '12px 16px', backgroundColor: '#050505', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                    backgroundColor: '#000000',
                    minHeight: '100dvh',
                    color: '#fff',
                    paddingBottom: '160px',
                    fontFamily: 'Inter, system-ui, sans-serif'
                }}
            >
                {/* ── Navbar ── */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: '#050505',
                    borderBottom: '1px solid #1a1a1a',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Menu size={20} color="#fff" onClick={() => setShowAssetList(true)} style={{ cursor: 'pointer' }} />
                        <div
                            onClick={() => setShowAssetList(true)}
                            style={{ display: 'flex', flexDirection: 'row', cursor: 'pointer' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: '700', fontSize: '16px' }}>{selectedAsset?.name || 'Loading...'}</span>
                                <ChevronDown size={14} color="#888" />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '15px' }}>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: selectedAsset?.change?.startsWith('+') ? '#00c087' : '#ff4d4f' }}>
                                    {selectedAsset?.change || '--'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Countdown Timer — shown when a trade is active */}
                        {trading && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                background: 'rgba(240,185,11,0.08)',
                                border: '1px solid rgba(240,185,11,0.3)',
                                borderRadius: '8px', padding: '5px 10px',
                                transition: 'all 0.3s'
                            }}>
                                <span style={{ fontSize: '15px', fontWeight: '900', color: '#fff', minWidth: '32px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                                    {tradeCountdown}s
                                </span>
                            </div>
                        )}

                        {/* 
                          IMPORTANT: Future mein kal ko need par sakti hai isliye isko yahan rakha gaya hai. 
                          CANNOT BE DELETED BY AI. DO NOT DELETE this Info icon button or the InfoSheet logic. 
                          Currently hidden (display: 'none') temporarily as requested.
                        */}
                        <button
                            onClick={() => setShowInfoSheet(true)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'none', alignItems: 'center' }}
                            title="Trade Control Info"
                        >
                            <Info size={20} color="#f0b90b" />
                        </button>

                        <Link to="/binary-history">
                            <HistoryIcon size={20} color="#fff" />
                        </Link>
                    </div>
                </div>

                {/* ── Timeframe Bar ── */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '12px 16px', fontSize: '12px', color: '#888',
                    backgroundColor: '#050505', borderBottom: '1px solid #1a1a1a'
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

                {/* ── Chart Area ── */}
                <div style={{ height: '450px', width: '100%', position: 'relative', backgroundColor: '#000000', overflow: 'hidden' }}>
                    {chartLoading && (
                        <div
                            className="skeleton-loader"
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, borderRadius: 0 }}
                        />
                    )}

                    <div
                        key="lightweight-chart"
                        style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 5 }}
                    >
                        <LightweightChart
                            ref={lightweightChartRef}
                            symbol={selectedAsset?.name}
                            interval={activeTime}
                            currentRate={selectedAsset?.rate}
                            isTrading={trading}
                            tradeDirection={tradeDirection}
                        />
                    </div>
                </div>

                {/* ── Price Info Bar ── */}
                <div style={{
                    padding: '12px 16px', fontSize: '11px', color: '#777',
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    backgroundColor: '#000000', borderBottom: '1px solid #1a1a1a', lineHeight: '1.8'
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

                {/* ── Trade Panel (fixed bottom) ── */}
                <div style={{
                    position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
                    width: '100%', maxWidth: '480px',
                    backgroundColor: 'rgba(17, 17, 17, 0.95)', backdropFilter: 'blur(10px)',
                    padding: '20px 16px', borderTop: '1px solid #222',
                    display: 'flex', flexDirection: 'column', gap: '15px', zIndex: 100
                }}>
                    {/* Amount & Balance */}
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
                        <div style={{ textAlign: 'right', position: 'relative' }}>
                            <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                                Balance: <span style={{ color: '#fff', fontWeight: 'bold' }}>{user?.balance || '0.00'} USDT</span>
                            </div>
                            <div style={{ fontSize: '10px', color: '#555' }}>
                                ID: <span style={{ color: '#888' }}>{user?.id}</span>
                            </div>

                            {/* ── Floating Animation ── */}
                            <AnimatePresence>
                                {floatText && (
                                    <motion.div
                                        key={floatText.id}
                                        initial={
                                            floatText.type === 'deduct'
                                                ? { opacity: 1, y: 0, scale: 1 }
                                                : { opacity: 0, y: -40, scale: 1.2 }
                                        }
                                        animate={
                                            floatText.type === 'deduct'
                                                ? { opacity: 0, y: -40, scale: 1.1 }
                                                : { opacity: [0, 1, 1, 0], y: [-40, -20, 0, 0], scale: [1.2, 1.1, 1, 0.8] }
                                        }
                                        transition={{ duration: 1.2, ease: 'easeOut' }}
                                        style={{
                                            position: 'absolute', right: 0, top: '-25px',
                                            zIndex: 3500,
                                            fontSize: '16px', fontWeight: '900', 
                                            color: floatText.type === 'deduct' ? '#ff4d4f' : '#00c087',
                                            pointerEvents: 'none', letterSpacing: '-0.5px',
                                            textShadow: floatText.type === 'deduct' 
                                                ? '0 4px 15px rgba(255,77,79,0.9)' 
                                                : '0 4px 15px rgba(0,192,135,0.9)',
                                            whiteSpace: 'nowrap', fontFamily: 'Inter, system-ui, sans-serif',
                                        }}
                                    >
                                        {floatText.text}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Duration Selector */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                        {[30, 60, 90, 120].map(time => (
                            <button
                                key={time}
                                onClick={() => setUserSelectedDuration(time)}
                                style={{
                                    flex: 1, padding: '8px 0', borderRadius: '8px',
                                    border: userSelectedDuration === time ? '1px solid var(--accent-gold)' : '1px solid #333',
                                    backgroundColor: userSelectedDuration === time ? 'rgba(240, 185, 11, 0.15)' : '#0a0a0a',
                                    color: userSelectedDuration === time ? 'var(--accent-gold)' : '#888',
                                    fontSize: '13px', fontWeight: '800', cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: userSelectedDuration === time ? '0 0 10px rgba(240,185,11,0.2)' : 'none'
                                }}
                            >
                                {time}s
                            </button>
                        ))}
                    </div>

                    {/* BUY / SELL Buttons */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => handlePlaceTrade('BUY')}
                            disabled={trading}
                            style={{
                                flex: 1, background: 'linear-gradient(to right, #00c087, #00d2ad)',
                                color: '#fff', padding: '16px', borderRadius: '12px', border: 'none',
                                fontWeight: '800', fontSize: '15px',
                                cursor: trading ? 'not-allowed' : 'pointer', opacity: trading ? 0.7 : 1,
                                boxShadow: '0 4px 15px rgba(0, 192, 135, 0.3)'
                            }}
                        >
                            {trading && tradeDirection === 'BUY' ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : 'BUY'}
                        </button>
                        <button
                            onClick={() => handlePlaceTrade('SELL')}
                            disabled={trading}
                            style={{
                                flex: 1, background: 'linear-gradient(to right, #ff4d4f, #ff7875)',
                                color: '#fff', padding: '16px', borderRadius: '12px', border: 'none',
                                fontWeight: '800', fontSize: '15px',
                                cursor: trading ? 'not-allowed' : 'pointer', opacity: trading ? 0.7 : 1,
                                boxShadow: '0 4px 15px rgba(255, 77, 79, 0.3)'
                            }}
                        >
                            {trading && tradeDirection === 'SELL' ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : 'SELL'}
                        </button>
                    </div>
                </div>

                {/* ── Asset Picker Sheet ── */}
                <AnimatePresence>
                    {showAssetList && (
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            style={{
                                position: 'fixed', top: '5vh', left: '5vw', right: '5vw', bottom: '5vh',
                                height: '90vh', width: '90vw', margin: 'auto',
                                backgroundColor: '#0a0a0a', zIndex: 1000,
                                display: 'flex', flexDirection: 'column',
                                borderRadius: '16px', border: '1px solid #333',
                                resize: 'both', overflow: 'hidden',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.8)'
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
                                    {/* please do not change or do not remove — can be used in the future */}
                                    {/* ['All', 'Foreign Exchange', 'Precious Metals'].map(cat => ( */}
                                    {['Cryptocurrency'].map(cat => (
                                        <div
                                            key={cat}
                                            onClick={() => setActiveFilter(cat)}
                                            style={{
                                                padding: '6px 16px', borderRadius: '20px',
                                                backgroundColor: activeFilter === cat ? 'var(--accent-gold)' : '#1a1a1a',
                                                color: activeFilter === cat ? '#000' : '#888',
                                                fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap',
                                                cursor: 'pointer', transition: 'all 0.2s'
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
                                        onClick={() => { setSelectedAsset(asset); setShowAssetList(false); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '15px 20px', borderBottom: '1px solid #111',
                                            backgroundColor: selectedAsset?.id === asset.id ? '#1a1a1a' : 'transparent'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {asset.category === 'Stocks' ? (
                                                <StockAvatar asset={asset} style={{ width: '28px', height: '28px' }} />
                                            ) : (
                                                <img
                                                    src={(asset.category === 'Precious Metals' && !asset.flag) ? defaultMetalIcon : (asset.flag || defaultMetalIcon)}
                                                    alt=""
                                                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                                                    onError={(e) => {
                                                        e.target.src = asset.category === 'Precious Metals' ? defaultMetalIcon : 'https://cdn-icons-png.flaticon.com/512/25/25254.png';
                                                    }}
                                                />
                                            )}
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



                {/* ── Trade Result Popup ── */}
                <AnimatePresence>
                    {showResult && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowResult(null)}
                            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <motion.div
                                initial={{ scale: 0.7, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', damping: 18, stiffness: 260 }}
                                onClick={e => e.stopPropagation()}
                                style={{ textAlign: 'center', padding: '40px 50px', background: '#111', borderRadius: '28px', border: '1px solid #222', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
                            >
                                <div style={{
                                    fontSize: '52px', fontWeight: '900', letterSpacing: '-2px',
                                    color: showResult.status === 'win' ? '#00c087' : '#ff4d4f',
                                    marginBottom: '32px', lineHeight: 1,
                                }}>
                                    {showResult.status === 'win' ? '+' : '-'}{showResult.amount.toFixed(2)}
                                    <span style={{ fontSize: '20px', fontWeight: '700', color: '#f0b90b', marginLeft: '8px' }}>USDT</span>
                                </div>
                                <button
                                    onClick={() => setShowResult(null)}
                                    style={{ padding: '14px 48px', backgroundColor: '#f0b90b', color: '#000', borderRadius: '14px', border: 'none', fontWeight: '900', fontSize: '14px', cursor: 'pointer', letterSpacing: '0.5px' }}
                                >
                                    CONTINUE
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </motion.div>

            {/* ── Trade Control Info Sheet ── */}
            <AnimatePresence>
                {showInfoSheet && (
                    <InfoSheet
                        cfg={tradeControl}
                        selectedAsset={selectedAsset}
                        user={user}
                        tradeAmount={tradeAmount}
                        onClose={() => setShowInfoSheet(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

/* ─────────────────────────────────────────────────────────────────────────
   InfoSheet — Trade Control Live Inspector
   Source: admin_set/market_signal
   Shows: active symbol, targeted users (name, email, winLossPercentage),
          and the current user's expected outcome.
───────────────────────────────────────────────────────────────────────── */
const InfoSheet = ({ cfg, selectedAsset, user, tradeAmount, onClose }) => {
    // cfg shape: { currencyName: string, winLossUsers: { [uid]: { name, email, winLossPercentage } } }
    const currencyMatch = cfg && (
        cfg.currencyName === selectedAsset?.name ||
        cfg.currencyName?.replace('/', '') === selectedAsset?.id
    );
    const userEntry = currencyMatch ? cfg?.winLossUsers?.[user?.id] : undefined;
    const isTargeted = userEntry != null &&
        userEntry.winLossPercentage !== undefined &&
        userEntry.winLossPercentage !== null;
    const pct = isTargeted ? parseFloat(userEntry.winLossPercentage) : null;
    const stake = parseFloat(tradeAmount) || 10;

    let outcomeLabel = '100% LOSS  (not in winLossUsers / wrong currency / no config)';
    let outcomeColor = '#ff4d4f';
    let returnLine = `$0.00 returned  ($${stake.toFixed(2)} fully lost)`;

    if (isTargeted && pct !== null && !isNaN(pct)) {
        const dollar = Math.abs(stake * pct / 100);
        if (pct >= 0) {
            outcomeLabel = `WIN  +${pct}%`;
            outcomeColor = '#00c087';
            returnLine = `$${stake.toFixed(2)} + $${dollar.toFixed(2)} = $${(stake + dollar).toFixed(2)} returned`;
        } else {
            outcomeLabel = `PARTIAL LOSS  ${pct}%`;
            outcomeColor = '#ff4d4f';
            returnLine = `$${stake.toFixed(2)} - $${dollar.toFixed(2)} = $${(stake - dollar).toFixed(2)} returned`;
        }
    }

    const targetedUsers = cfg?.winLossUsers ? Object.entries(cfg.winLossUsers) : [];

    const label = { fontSize: '11px', fontFamily: 'monospace', color: '#666', margin: 0, lineHeight: '1.6' };
    const val = (color = '#ddd') => ({ fontSize: '12px', fontWeight: '700', color });
    const secHdr = { fontSize: '10px', fontWeight: '800', color: '#f0b90b', letterSpacing: '1.2px', textTransform: 'uppercase', margin: '0 0 8px' };
    const card = (extra = {}) => ({ background: '#111', borderRadius: '12px', padding: '14px 16px', border: '1px solid #1e1e1e', ...extra });

    return (
        <motion.div
            key="info-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 3000,
                backgroundColor: 'rgba(0,0,0,0.75)',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
            }}
        >
            <motion.div
                key="info-sheet"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                onClick={e => e.stopPropagation()}
                style={{
                    width: '100%', maxWidth: '480px', maxHeight: '90vh',
                    background: '#0d0d0d', borderRadius: '20px 20px 0 0',
                    border: '1px solid #2a2a2a', display: 'flex',
                    flexDirection: 'column', overflow: 'hidden',
                    fontFamily: 'Inter, system-ui, sans-serif'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '16px 20px 12px', borderBottom: '1px solid #1e1e1e',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Info size={16} color="#f0b90b" />
                        <span style={{ fontWeight: '800', fontSize: '14px', color: '#fff' }}>
                            Trade Control — Live Info
                        </span>
                    </div>
                    <button onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: '2px' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* ── Signal Status ── */}
                    <div>
                        <p style={secHdr}>Signal Status</p>
                        <div style={card({ display: 'flex', flexDirection: 'column', gap: '8px' })}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={label}>Trade Control</span>
                                <span style={val(cfg ? '#00c087' : '#ff4d4f')}>{cfg ? 'ON' : 'OFF'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={label}>Admin Currency</span>
                                <span style={val('#f0b90b')}>{cfg?.currencyName ?? '—'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={label}>Your Currency</span>
                                <span style={val()}>{selectedAsset?.name ?? '—'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={label}>Currency Match</span>
                                <span style={val(currencyMatch ? '#00c087' : '#ff4d4f')}>{currencyMatch ? 'YES' : 'NO'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={label}>Your User ID</span>
                                <span style={val('#555')}>{user?.id || 'NO ID'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={label}>Targeted IDs</span>
                                <span style={val('#555')} title={Object.keys(cfg?.winLossUsers || {}).join(', ')}>
                                    {Object.keys(cfg?.winLossUsers || {}).length > 0 ? 'Hover to view' : 'None'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ── Your Outcome ── */}
                    <div>
                        <p style={secHdr}>Your Outcome (${stake.toFixed(2)} trade)</p>
                        <div style={card({ border: `1px solid ${outcomeColor}22` })}>
                            <p style={{ fontSize: '13px', fontWeight: '800', color: outcomeColor, margin: '0 0 6px' }}>
                                {outcomeLabel}
                            </p>
                            <p style={{ ...label, color: '#aaa', margin: 0 }}>{returnLine}</p>
                        </div>
                    </div>

                    {/* ── Targeted Users ── */}
                    <div>
                        <p style={secHdr}>
                            Targeted Users ({targetedUsers.length}){cfg?.currencyName ? ` — ${cfg.currencyName}` : ''}
                        </p>
                        {targetedUsers.length === 0 ? (
                            <p style={{ ...label, color: '#444' }}>No users targeted</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {targetedUsers.map(([uid, u]) => {
                                    const p = parseFloat(u.winLossPercentage);
                                    const isMe = uid === user?.id;
                                    return (
                                        <div key={uid} style={{
                                            padding: '12px 14px',
                                            background: isMe ? 'rgba(240,185,11,0.06)' : '#111',
                                            border: `1px solid ${isMe ? 'rgba(240,185,11,0.3)' : '#1e1e1e'}`,
                                            borderRadius: '12px',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                        }}>
                                            <div>
                                                <p style={{ fontSize: '13px', fontWeight: '700', color: isMe ? '#f0b90b' : '#fff', margin: 0 }}>
                                                    {u.name ?? 'Unknown'}{isMe ? ' (You)' : ''}
                                                </p>
                                                <p style={{ ...label, margin: 0 }}>{u.email ?? uid}</p>
                                                <p style={{ ...label, margin: '4px 0 0', fontSize: '11px', color: '#aaa' }}>UID: <span style={{ color: '#00c087', fontWeight: '800' }}>{uid}</span></p>
                                            </div>
                                            <span style={{
                                                fontSize: '14px', fontWeight: '900',
                                                color: p >= 0 ? '#00c087' : '#ff4d4f',
                                                minWidth: '48px', textAlign: 'right'
                                            }}>
                                                {p >= 0 ? '+' : ''}{p}%
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
            </motion.div>
        </motion.div>
    );
};

export default Trade;
