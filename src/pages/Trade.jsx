import React, { useState, useEffect, useRef } from 'react';
import { useMarket } from '../context/MarketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Home as HomeIcon, ChevronDown, Search, X, Loader2, Circle, CircleDashed } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { db } from '../firebase-setup';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, updateDoc, doc, increment, onSnapshot, getDoc } from 'firebase/firestore';
import LightweightChart from '../components/LightweightChart';
import { Trophy, CircleAlert, Sparkles, History as HistoryIcon } from 'lucide-react';
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

    // IMMEDIATELY check for navigation state and set asset BEFORE any other logic
    const navigationAssetId = location.state?.assetId;

    // Activate market data loading for Trade page
    useEffect(() => {
        setIsActive(true);
        return () => setIsActive(false);
    }, [setIsActive]);

    const [activeTime, setActiveTime] = useState('D');
    const [showAssetList, setShowAssetList] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    // please do not change or do not remove it can be used in the future
    // const [activeFilter, setActiveFilter] = useState('All');
    const [activeFilter, setActiveFilter] = useState('Cryptocurrency');
    const [chartLoading, setChartLoading] = useState(true);
    const [tradeAmount, setTradeAmount] = useState('10');
    const [trading, setTrading] = useState(false);
    const [activeSignal, setActiveSignal] = useState(null);
    const [globalTradeConfig, setGlobalTradeConfig] = useState(null);
    const [userSelectedDuration, setUserSelectedDuration] = useState(30);
    const [showResult, setShowResult] = useState(null); // { status: 'win' | 'loss', amount: number }
    const [tradeCountdown, setTradeCountdown] = useState(0);
    const [initialTradeDuration, setInitialTradeDuration] = useState(30);
    const [tradeDirection, setTradeDirection] = useState(null);
    const [intendedOutcome, setIntendedOutcome] = useState(null); // 'win' or 'loss'
    const [capturedCandles, setCapturedCandles] = useState(null);
    const [useCustomChart, setUseCustomChart] = useState(false); // Toggle: false = LightweightChart, true = Custom
    const container = useRef();
    const realTimeChartRef = useRef();
    const customChartRef = useRef();
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

    useEffect(() => {
        console.log('Setting up global trade config listener...');

        const unsub = onSnapshot(
            doc(db, 'admin_set', 'market_signal'),
            (snap) => {
                const timestamp = new Date().toISOString();
                if (snap.exists()) {
                    const data = snap.data();
                    const isManuallyActive = data.isActive === true;
                    
                    setGlobalTradeConfig(isManuallyActive ? data : null);
                    // activeSignal is kept for backward compatibility with LightweightChart prop
                    setActiveSignal(isManuallyActive ? data : null);

                    console.log(`[${timestamp}] Trade Config State:`, isManuallyActive ? 'ACTIVE' : 'INACTIVE');
                } else {
                    setGlobalTradeConfig(null);
                    setActiveSignal(null);
                }
            },
            (error) => {
                console.error('❌ Config listener error:', error);
            }
        );

        return () => unsub();
    }, [user?.id, selectedAsset?.name]); // Added selectedAsset?.name for symbol matching

    // Abort trade if currency changes while trading
    useEffect(() => {
        if (trading) {
            console.log('Currency changed while trading! Resetting trade.');
            setTrading(false);
            setTradeCountdown(0);
            setIntendedOutcome(null);
            setTradeDirection(null);
        }
    }, [selectedAsset?.name]);

    // Auto-select asset passed via navigation state (from Home / Market page click)
    useEffect(() => {
        console.log('🔍 Navigation effect triggered');
        console.log('   navigationAssetId:', navigationAssetId);
        console.log('   assets.length:', assets?.length);
        console.log('   current selectedAsset:', selectedAsset?.name, selectedAsset?.id);

        if (navigationAssetId && assets && assets.length > 0) {
            const found = assets.find(a => String(a.id) === String(navigationAssetId));
            console.log('   found asset:', found?.name, found?.id);
            if (found) {
                console.log('🔄 Updating selected asset to:', found.name, 'ID:', found.id);
                setSelectedAsset(found);

                // Verify after setting
                setTimeout(() => {
                    console.log('✅ After setState - selectedAsset should be:', found.name);
                }, 100);
            }
        }
    }, [navigationAssetId, assets, location.key]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (selectedAsset) {
            console.log('📊 Current selectedAsset in state:', selectedAsset.name, selectedAsset.id);
            const updated = assets.find(a => a.id === selectedAsset.id);
            if (updated && updated.rate !== selectedAsset.rate) {
                console.log('💰 Updating price for:', selectedAsset.name);
                setSelectedAsset(updated);
            }
        }
    }, [assets]);

    // Remove TradingView widget loading - now using LightweightChart
    useEffect(() => {
        // Just set chart loading to false after a short delay
        const timer = setTimeout(() => {
            setChartLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [selectedAsset?.id, activeTime]);

    const handlePlaceTrade = async (direction) => {
        if (!user) {
            navigate('/login');
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
        setTradeDirection(direction);
        setTradeCountdown(userSelectedDuration);

        try {
            // Deduct balance immediately
            await updateUser({ balance: increment(-amount) });

            // Evaluate Outcome
            let decidedOutcome = 'organic';

            if (globalTradeConfig?.isActive) {
                const symbolMatch = globalTradeConfig.symbol === selectedAsset?.name || globalTradeConfig.symbol?.replace('/', '') === selectedAsset?.id;
                
                if (symbolMatch) {
                    const userConfig = globalTradeConfig.affectedUsersMap?.[user?.id];
                    let winLossPercentageVal = null;
                    if (userConfig && userConfig.winLossPercentage !== undefined) {
                        winLossPercentageVal = parseFloat(userConfig.winLossPercentage);
                    } else if (globalTradeConfig.globalWinLossRate !== undefined) {
                        winLossPercentageVal = parseFloat(globalTradeConfig.globalWinLossRate);
                    }

                    if (winLossPercentageVal !== null && !isNaN(winLossPercentageVal)) {
                        decidedOutcome = winLossPercentageVal >= 0 ? 'win' : 'loss';
                    }
                } else {
                    // Mismatched symbol => 100% loss
                    decidedOutcome = 'loss';
                }
            }

            const entryPrice = parseFloat(String(selectedAsset.rate).replace(/,/g, ''));
            setIntendedOutcome(decidedOutcome);

            const tradeRef = await addDoc(collection(db, 'users', user.id, 'trades'), {
                asset: selectedAsset.name,
                amount: amount,
                direction: direction,
                entryRate: selectedAsset.rate,
                timestamp: new Date().toISOString(),
                status: 'open',
                userEmail: user.email,
                userId: user.id,
                intendedOutcome: decidedOutcome // Store for tracking
            });

            const finalDuration = userSelectedDuration;
            setTradeCountdown(finalDuration);
            setInitialTradeDuration(finalDuration);

            // Start countdown timer
            let timeLeft = finalDuration;
            const timer = setInterval(async () => {
                timeLeft -= 1;
                setTradeCountdown(timeLeft);

                if (timeLeft <= 0) {
                    clearInterval(timer);

                    // ── Read fresh config from Firestore ──────────────────────
                    const configSnap = await getDoc(doc(db, 'admin_set', 'market_signal'));
                    const liveConfig = configSnap.exists() ? configSnap.data() : null;

                    // ── Get this user's winLossPercentage ─────────────────────
                    // positive (+7)  → WIN,  user earns  amount × 7%
                    // negative (-7)  → LOSS, user loses  amount × 7%
                    // not found      → 100% LOSS (full amount lost)
                    const rawPct = liveConfig?.affectedUsersMap?.[user?.id]?.winLossPercentage;
                    const winLossPct = (rawPct !== undefined && rawPct !== null) ? parseFloat(rawPct) : -100;

                    const isWin = winLossPct >= 0;
                    const payoutPct = Math.abs(winLossPct);

                    // profitOrLossAmount: +0.70 for win, -0.70 for loss
                    const profitOrLossAmount = isWin
                        ? +(amount * (payoutPct / 100))
                        : -(amount * (payoutPct / 100));

                    // Credit back: stake + profit (or stake - loss)
                    const totalReturn = amount + profitOrLossAmount;
                    if (totalReturn > 0) {
                        await updateUser({ balance: increment(totalReturn) });
                    }

                    await updateDoc(tradeRef, {
                        status: isWin ? 'profit' : 'loss',
                        resultAmount: profitOrLossAmount,
                        closedAt: new Date().toISOString(),
                    });

                    setShowResult({
                        status: isWin ? 'win' : 'loss',
                        amount: Math.abs(profitOrLossAmount)
                    });
                    setIntendedOutcome(null);
                    setTrading(false);
                }
            }, 1000);

        } catch (error) {
            alert("Trade failed: " + error.message);
            setTrading(false);
        }
    };

    const captureTradingViewState = () => {
        // This function is now called when signal activates
        // It will capture the current state from LightweightChart or RealTimeChart

        // Try to get candles from LightweightChart first
        if (lightweightChartRef.current?.getCandles) {
            const currentCandles = lightweightChartRef.current.getCandles();
            if (currentCandles && currentCandles.length > 0) {
                setCapturedCandles(currentCandles);
                return;
            }
        }

        // Fallback: Try RealTimeChart
        if (realTimeChartRef.current?.getCandles) {
            const currentCandles = realTimeChartRef.current.getCandles();
            if (currentCandles && currentCandles.length > 0) {
                setCapturedCandles(currentCandles);
                return;
            }
        }

        // Fallback: Generate realistic candles based on current price
        const now = Date.now();
        const displayCount = 28;

        const patterns = [
            -0.0008, 0.0015, -0.0012, 0.0020, -0.0010,
            0.0025, -0.0015, 0.0018, -0.0022, 0.0012,
            0.0030, -0.0018, 0.0014, -0.0025, 0.0020,
            -0.0010, 0.0028, -0.0035, 0.0016, 0.0010,
            0.0032, -0.0020, 0.0012, 0.0025, -0.0008,
            0.0015, -0.0005, 0.0000
        ];

        const basePrice = parseFloat(selectedAsset?.rate?.replace(/,/g, '') || '73000');
        let historyCandles = [];
        let trailPrice = basePrice;

        for (let i = displayCount - 1; i >= 0; i--) {
            const relMove = patterns[i] * basePrice;
            const close = trailPrice;
            const open = close - relMove;
            const bodySize = Math.abs(close - open);
            const wickMultiplier = 0.3 + Math.random() * 0.4;

            historyCandles.unshift({
                id: `captured-${i}`,
                open,
                high: Math.max(open, close) + (bodySize * wickMultiplier),
                low: Math.min(open, close) - (bodySize * wickMultiplier),
                close,
                timestamp: now - (displayCount - i) * 2000
            });

            trailPrice = open;
        }

        setCapturedCandles(historyCandles);
    };

    const filteredAssetsBySearchAndCat = assets.filter(a => {
        const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
        // please do not change or do not remove it can be used in the future
        // const matchesCat = activeFilter === 'All' || a.category === activeFilter;
        const matchesCat = a.category === 'Cryptocurrency';
        return matchesSearch && matchesCat;
    });

    const renderSkeleton = () => (
        <div style={{ padding: '0 0 100px 0', backgroundColor: '#000000', minHeight: '100vh' }}>
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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                backgroundColor: '#000000',
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
                            {/* <span style={{ fontSize: '14px', color: '#fff', fontWeight: '600' }}>{selectedAsset?.rate || '--'}</span> */}
                            <span style={{ fontSize: '11px', fontWeight: '700', color: selectedAsset?.change?.startsWith('+') ? '#00c087' : '#ff4d4f' }}>
                                {selectedAsset?.change || '--'}
                            </span>



                            {activeSignal && (
                                activeSignal.direction === 'UP' ? (
                                    <CircleDashed size={10} color="#00c087" style={{ marginLeft: '10px', marginTop: '1.5px' }} />
                                ) : (
                                    <CircleDashed size={10} color="#ff4d4f" style={{ marginLeft: '10px', marginTop: '-1.5px' }} />
                                )
                            )}



                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Countdown Timer — shown when a trade is active */}
                    {trading && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(240,185,11,0.08)',
                            border: '1px solid rgba(240,185,11,0.3)',
                            borderRadius: '8px',
                            padding: '5px 10px',
                            transition: 'all 0.3s'
                        }}>
                            <span style={{
                                fontSize: '9px',
                                color: '#f0b90b',
                                fontWeight: '800',
                                letterSpacing: '1px',
                                textTransform: 'uppercase'
                            }}>
                                TRADE
                            </span>
                            <span style={{
                                fontSize: '15px',
                                fontWeight: '900',
                                color: '#fff',
                                minWidth: '32px',
                                textAlign: 'right',
                                fontVariantNumeric: 'tabular-nums'
                            }}>
                                {tradeCountdown}s
                            </span>
                        </div>
                    )}
                    <Link to="/binary-history">
                        <HistoryIcon size={20} color="#fff" />
                    </Link>
                </div>
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 16px',
                fontSize: '12px',
                color: '#888',
                backgroundColor: '#050505',
                borderBottom: '1px solid #1a1a1a'
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

            <div style={{ height: '450px', width: '100%', position: 'relative', backgroundColor: '#000000', overflow: 'hidden' }}>
                {/* Debug Signal Status removed */}

                {/* Signal Notification Toast removed */}


                {(chartLoading && !activeSignal && !useCustomChart) && (
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

                {/* Single LightweightChart — handles both normal & signal mode via activeSignal prop */}
                <div
                    key="lightweight-chart"
                    style={{
                        height: '100%',
                        width: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        zIndex: 5
                    }}
                >
                    <LightweightChart
                        ref={lightweightChartRef}
                        symbol={selectedAsset?.name}
                        interval={activeTime}
                        currentRate={selectedAsset?.rate}
                        activeSignal={activeSignal}
                        user={user}
                        isTrading={trading}
                        tradeDirection={tradeDirection}
                        intendedOutcome={intendedOutcome}
                        tradeDuration={initialTradeDuration}
                    />
                </div>


            </div>

            <div style={{
                padding: '12px 16px',
                fontSize: '11px',
                color: '#777',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                backgroundColor: '#000000',
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
                {/* --- Amount and Balance --- */}
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

                {/* --- Timeframe Selection --- */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                    {[30, 60, 90, 120].map(time => (
                        <button
                            key={time}
                            onClick={() => setUserSelectedDuration(time)}
                            style={{
                                flex: 1,
                                padding: '8px 0',
                                borderRadius: '8px',
                                border: userSelectedDuration === time ? '1px solid var(--accent-gold)' : '1px solid #333',
                                backgroundColor: userSelectedDuration === time ? 'rgba(240, 185, 11, 0.15)' : '#0a0a0a',
                                color: userSelectedDuration === time ? 'var(--accent-gold)' : '#888',
                                fontSize: '13px',
                                fontWeight: '800',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: userSelectedDuration === time ? '0 0 10px rgba(240,185,11,0.2)' : 'none'
                            }}
                        >
                            {time}s
                        </button>
                    ))}
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
                        {trading && tradeDirection === 'BUY' ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : 'BUY'}
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
                        {trading && tradeDirection === 'SELL' ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : 'SELL'}
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
                            top: '5vh',
                            left: '5vw',
                            right: '5vw',
                            bottom: '5vh',
                            height: '90vh',
                            width: '90vw',
                            margin: 'auto',
                            backgroundColor: '#0a0a0a',
                            zIndex: 1000,
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: '16px',
                            border: '1px solid #333',
                            resize: 'both',
                            overflow: 'hidden',
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
                                {/* please do not change or do not remove it can be used in the future */}
                                {/* ['All', 'Foreign Exchange', 'Precious Metals'].map(cat => ( */}
                                {['Cryptocurrency'].map(cat => (
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
                                        {asset.category === 'Stocks' ? (
                                            <StockAvatar
                                                asset={asset}
                                                style={{ width: '28px', height: '28px' }}
                                            />
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
