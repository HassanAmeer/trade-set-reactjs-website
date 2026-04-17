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
    const [activeFilter, setActiveFilter] = useState('All');
    const [chartLoading, setChartLoading] = useState(true);
    const [tradeAmount, setTradeAmount] = useState('10');
    const [trading, setTrading] = useState(false);
    const [activeSignal, setActiveSignal] = useState(null);
    const [showResult, setShowResult] = useState(null); // { status: 'win' | 'loss', amount: number }
    const [tradeCountdown, setTradeCountdown] = useState(0);
    const [tradeDirection, setTradeDirection] = useState(null);
    const [intendedOutcome, setIntendedOutcome] = useState(null); // 'win' or 'loss'
    const [capturedCandles, setCapturedCandles] = useState(null);
    const [useCustomChart, setUseCustomChart] = useState(false); // Toggle: false = LightweightChart, true = Custom
    const container = useRef();
    const realTimeChartRef = useRef();
    const customChartRef = useRef();
    const lightweightChartRef = useRef();
    const [signalNotification, setSignalNotification] = useState(null);
    const lastSignalState = useRef(null);

    const timeframes = [
        { label: '1 min', value: '1' },
        { label: '5 min', value: '5' },
        { label: '15 min', value: '15' },
        { label: '30 min', value: '30' },
        { label: '1 hour', value: '60' },
        { label: '1 day', value: 'D' },
        { label: '1 week', value: 'W' }
    ];

    // Periodic expiration check (ensures UI stays synced even if Firestore doesn't update)
    useEffect(() => {
        const interval = setInterval(() => {
            if (activeSignal) {
                const now = new Date();
                const expiresAt = new Date(activeSignal.expiresAt);
                const isManuallyActive = activeSignal.isActive === true;
                if (expiresAt < now || !isManuallyActive) {
                    console.log('--- LOCAL SIGNAL EXPIRATION DETECTED ---');
                    setActiveSignal(null);
                    setSignalNotification({ type: 'stop' });
                    setTimeout(() => setSignalNotification(null), 5000);
                }
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [activeSignal]);

    useEffect(() => {
        console.log('Setting up robust signal listener...');

        const unsub = onSnapshot(
            doc(db, 'admin_set', 'market_signal'),
            (snap) => {
                const timestamp = new Date().toISOString();
                if (snap.exists()) {
                    const data = snap.data();
                    const now = new Date();
                    const expiresAt = new Date(data.expiresAt);
                    const isExpired = expiresAt < now;
                    const isManuallyActive = data.isActive === true;
                    // Fix: Check if current user is affected by this signal
                    const userAffected = data.affectedUsersMap?.[user?.id];
                    const isActive = isManuallyActive && !isExpired && !!userAffected;

                    console.log(`[${timestamp}] Signal State:`, isActive ? 'ACTIVE' : 'INACTIVE', data.direction);

                    // Detect changes for notification
                    if (isActive && lastSignalState.current !== 'ACTIVE') {
                        setSignalNotification({ type: 'start', direction: data.direction });
                        setTimeout(() => setSignalNotification(null), 5000);
                    } else if (!isActive && lastSignalState.current === 'ACTIVE') {
                        setSignalNotification({ type: 'stop' });
                        setTimeout(() => setSignalNotification(null), 5000);
                    }

                    lastSignalState.current = isActive ? 'ACTIVE' : 'INACTIVE';
                    setActiveSignal(isActive ? data : null);
                } else {
                    if (lastSignalState.current === 'ACTIVE') {
                        setSignalNotification({ type: 'stop' });
                        setTimeout(() => setSignalNotification(null), 5000);
                    }
                    lastSignalState.current = 'INACTIVE';
                    setActiveSignal(null);
                }
            },
            (error) => {
                console.error('❌ Signal listener error:', error);
            }
        );

        return () => unsub();
    }, [user?.id]); // Empty dependency array for stability

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
        setTradeCountdown(10); // 10 second trade for testing, can be 30 or 60

        try {
            // Deduct balance immediately
            await updateUser({ balance: increment(-amount) });

            // Pre-calculate outcome if signal is active
            const signalSnap = await getDoc(doc(db, 'admin_set', 'market_signal'));
            const signal = signalSnap.data();

            const isSignalActiveNow = !!(
                signal?.isActive &&
                new Date(signal?.expiresAt) > new Date() &&
                signal.symbol === selectedAsset.name
            );
            const userSignalConfig = isSignalActiveNow ? signal.affectedUsersMap?.[user?.id] : null;

            // DEBUG: open browser console to verify signal matching
            console.log('[Trade] Signal check →', {
                signalActive: signal?.isActive,
                signalSymbol: signal?.symbol,
                assetName: selectedAsset.name,
                symbolMatch: signal?.symbol === selectedAsset.name,
                userFound: !!userSignalConfig,
                userConfig: userSignalConfig,
                direction
            });

            let decidedOutcome;
            if (userSignalConfig) {
                const signalDir = signal.direction; // 'UP' or 'DOWN'
                const isMatchingAction = (signalDir === 'UP' && direction === 'BUY') ||
                    (signalDir === 'DOWN' && direction === 'SELL');
                const winRate = parseInt(userSignalConfig.winRate ?? 100, 10);
                const roll = Math.floor(Math.random() * 100) + 1; // 1–100
                console.log('[Trade] winRate:', winRate, 'roll:', roll, 'matching direction:', isMatchingAction);
                if (isMatchingAction) {
                    decidedOutcome = roll <= winRate ? 'win' : 'loss';
                } else {
                    decidedOutcome = 'loss'; // Went against signal
                }
            } else {
                decidedOutcome = Math.random() > 0.5 ? 'win' : 'loss'; // Organic
            }
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

            // Start countdown timer
            let timeLeft = 10;
            const timer = setInterval(async () => {
                timeLeft -= 1;
                setTradeCountdown(timeLeft);

                if (timeLeft <= 0) {
                    clearInterval(timer);

                    // Resolve trade based on pre-calculated outcome (use decidedOutcome directly to avoid stale state issues)
                    const isWin = decidedOutcome === 'win';
                    const payoutPct = userSignalConfig?.payoutRate || 85;
                    const totalReturn = isWin ? amount * (1 + (payoutPct / 100)) : 0;

                    if (isWin) {
                        await updateUser({ balance: increment(totalReturn) });
                    }

                    await updateDoc(tradeRef, {
                        status: isWin ? 'profit' : 'loss',
                        resultAmount: isWin ? (totalReturn - amount) : -amount,
                        closedAt: new Date().toISOString()
                    });

                    setShowResult({ status: isWin ? 'win' : 'loss', amount: isWin ? (totalReturn - amount) : amount });
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
        const matchesCat = activeFilter === 'All' || a.category === activeFilter;
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

                            {signalNotification && (
                                signalNotification.type === 'start' ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#888', marginTop: '1.5px' }}>
                                        <Circle size={10} color="#888" />
                                    </span>
                                ) : (
                                    <CircleDashed size={10} color="#f0b90b" style={{ marginTop: '1.5px' }} />
                                )
                            )}


                        </div>
                    </div>
                </div>
                <Link to="/binary-history">
                    <HistoryIcon size={20} color="#fff" />
                </Link>
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
                {/* Debug Signal Status */}
                {/* {activeSignal && (
                    <div style={{
                        position: 'absolute',
                        top: '50px',
                        left: '12px',
                        zIndex: 100,
                        padding: '8px 12px',
                        backgroundColor: 'rgba(240,185,11,0.9)',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#000',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#000', animation: 'pulse 1.5s infinite' }} />
                        SIGNAL: {activeSignal.direction} | Speed: {activeSignal.candleSpeed}s
                    </div>
                )} */}

                {/* Signal Notification Toast */}
                {/* <AnimatePresence>
                    {signalNotification && (
                        <motion.div
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 100, opacity: 0 }}
                            style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                zIndex: 1000,
                                padding: '12px 20px',
                                backgroundColor: signalNotification.type === 'start' ? 'rgba(0,192,135,0.95)' : 'rgba(240,185,11,0.95)',
                                color: signalNotification.type === 'start' ? '#fff' : '#000',
                                borderRadius: '12px',
                                fontSize: '13px',
                                fontWeight: '700',
                                boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                backdropFilter: 'blur(8px)'
                            }}
                        >
                            {signalNotification.type === 'start' ? (
                                <><Sparkles size={16} /> Forced Market Movement: {signalNotification.direction}</>
                            ) : (
                                <><CircleAlert size={16} /> Market Signal Ended</>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence> */}

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
                    />
                </div>

                {trading && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '25%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: 'rgba(17, 17, 17, 0.95)',
                            padding: '20px 35px',
                            borderRadius: '16px',
                            border: '1px solid #333',
                            textAlign: 'center',
                            zIndex: 20,
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
                        }}
                    >
                        <div style={{ fontSize: '11px', color: '#f0b90b', fontWeight: '800', marginBottom: '8px', letterSpacing: '1.5px' }}>MARKET RESOLVING</div>
                        <div style={{ fontSize: '36px', fontWeight: '900', color: '#fff' }}>
                            {tradeCountdown}s
                        </div>
                    </div>
                )}
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
                        {trading && tradeDirection === 'BUY' ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : 'BUY / LONG'}
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
                        {trading && tradeDirection === 'SELL' ? <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> : 'SELL / SHORT'}
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
