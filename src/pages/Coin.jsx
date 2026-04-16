import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet,
    ArrowRightLeft,
    Lock,
    Unlock,
    TrendingUp,
    ChevronRight,
    Search,
    X,
    AlertCircle,
    CheckCircle2,
    RefreshCw,
    Sparkles,
    ArrowBigDown,
    History,
    LucidePickaxe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';

import btcBg from '../assets/btc-bg.jpg';
import minerBot from '../assets/btc-mining.webp';
import { db } from '../firebase-setup';
import { collection, addDoc, increment } from 'firebase/firestore';

const Coin = () => {
    const { user, updateUser } = useAuth();
    const { assets, setIsActive } = useMarket();

    const [exchangeAmount, setExchangeAmount] = useState('');
    const [selectedAssetForExchange, setSelectedAssetForExchange] = useState(null);
    const [showAssetSelector, setShowAssetSelector] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [processing, setProcessing] = useState(false);
    const [notification, setNotification] = useState(null);
    const [showHistory, setShowHistory] = useState(false);

    // Activate market data when on this page
    useEffect(() => {
        setIsActive(true);
        return () => setIsActive(false);
    }, [setIsActive]);

    const showNotify = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleExchange = async () => {
        if (!user || !selectedAssetForExchange || !exchangeAmount) return;

        const amount = parseFloat(exchangeAmount);
        if (isNaN(amount) || amount <= 0) {
            showNotify('Please enter a valid amount', 'error');
            return;
        }

        if (user.balance < amount) {
            showNotify('Insufficient balance', 'error');
            return;
        }

        setProcessing(true);
        try {
            const assetRate = parseFloat(String(selectedAssetForExchange.rate).replace(/,/g, ''));
            const assetAmount = amount / assetRate;

            // Prepare holdings
            const currentHoldings = user.holdings || {};
            const existing = currentHoldings[selectedAssetForExchange.id] || { amount: 0, isFrozen: false };

            const newHoldings = {
                ...currentHoldings,
                [selectedAssetForExchange.id]: {
                    ...existing,
                    amount: (existing.amount || 0) + assetAmount,
                    symbol: selectedAssetForExchange.symbol || selectedAssetForExchange.name.split('/')[0],
                    name: selectedAssetForExchange.name,
                    icon: selectedAssetForExchange.flag
                }
            };

            const historyItem = {
                id: Date.now().toString(),
                type: 'buy',
                status: 'Completed',
                usdtAmount: parseFloat(exchangeAmount),
                assetAmount: assetAmount,
                symbol: selectedAssetForExchange.symbol || selectedAssetForExchange.name.split('/')[0],
                rate: assetRate,
                timestamp: new Date().toISOString()
            };

            await updateUser({
                balance: increment(-parseFloat(exchangeAmount)),
                holdings: newHoldings,
                miningHistory: [historyItem, ...(user.miningHistory || [])]
            });

            // Log to global trades collection
            await addDoc(collection(db, 'users', user.id, 'trades'), {
                ...historyItem,
                asset: selectedAssetForExchange.name,
                direction: 'SECURE',
                category: 'mining',
                userEmail: user.email,
                username: user.username || user.fullName || 'User',
                userId: user.id
            });

            showNotify(`Successfully exchanged ${amount} USDT to ${assetAmount.toFixed(6)} ${selectedAssetForExchange.symbol || selectedAssetForExchange.name.split('/')[0]}`);
            setExchangeAmount('');
            setSelectedAssetForExchange(null);
        } catch (error) {
            showNotify('Exchange failed: ' + error.message, 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleExchangeBack = async (assetId) => {
        if (!user || !user.holdings || !user.holdings[assetId]) return;

        const holding = user.holdings[assetId];
        if (holding.isFrozen) {
            showNotify('Cannot exchange frozen asset. Unfreeze it first.', 'error');
            return;
        }

        setProcessing(true);
        try {
            const asset = assets.find(a => a.id === assetId);
            if (!asset) {
                showNotify('Asset data not found', 'error');
                return;
            }

            const assetRate = parseFloat(String(asset.rate).replace(/,/g, ''));
            const refundAmount = holding.amount * assetRate;

            const newHoldings = { ...user.holdings };
            delete newHoldings[assetId];

            const historyItem = {
                id: Date.now().toString(),
                type: 'sell',
                status: 'Closed',
                usdtAmount: refundAmount,
                assetAmount: holding.amount,
                symbol: holding.symbol,
                rate: assetRate,
                timestamp: new Date().toISOString()
            };

            await updateUser({
                balance: increment(refundAmount),
                holdings: newHoldings,
                miningHistory: [historyItem, ...(user.miningHistory || [])]
            });

            // Log to global trades collection
            await addDoc(collection(db, 'users', user.id, 'trades'), {
                ...historyItem,
                asset: holding.symbol,
                direction: 'LIQUIDATE',
                category: 'mining',
                userEmail: user.email,
                username: user.username || user.fullName || 'User',
                userId: user.id
            });

            showNotify(`Exchanged back to ${refundAmount.toFixed(2)} USDT`);
        } catch (error) {
            showNotify('Exchange back failed', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const toggleFreeze = async (assetId) => {
        if (!user || !user.holdings || !user.holdings[assetId]) return;

        const holding = user.holdings[assetId];
        const newStatus = !holding.isFrozen;
        const asset = assets.find(a => a.id === assetId);
        const currentRate = asset ? parseFloat(String(asset.rate).replace(/,/g, '')) : 0;

        setProcessing(true);
        try {
            const entryRate = holding.frozenRate || currentRate;
            const frozenAt = holding.frozenAt || new Date().toISOString();

            const newHoldings = {
                ...user.holdings,
                [assetId]: {
                    ...holding,
                    isFrozen: newStatus,
                    frozenRate: newStatus ? currentRate : (holding.frozenRate || currentRate),
                    frozenAt: newStatus ? new Date().toISOString() : holding.frozenAt
                }
            };

            const historyItem = {
                id: Date.now().toString(),
                type: newStatus ? 'freeze' : 'release',
                status: 'Completed',
                assetAmount: holding.amount,
                symbol: holding.symbol,
                rate: currentRate,
                entryRate: entryRate,
                timestamp: new Date().toISOString(),
                frozenAt: newStatus ? null : frozenAt,
                usdtAmount: holding.amount * currentRate
            };

            await updateUser({
                holdings: newHoldings,
                miningHistory: [historyItem, ...(user.miningHistory || [])]
            });

            // Log to global trades collection
            await addDoc(collection(db, 'users', user.id, 'trades'), {
                ...historyItem,
                asset: holding.symbol,
                direction: newStatus ? 'FREEZE' : 'RELEASE',
                category: 'mining',
                userEmail: user.email,
                username: user.username || user.fullName || 'User',
                userId: user.id
            });

            showNotify(newStatus ? 'Asset frozen successfully' : 'Asset unfrozen successfully');
        } catch (error) {
            showNotify('Action failed', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const filteredAssets = assets.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.symbol && a.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const userHoldingsArray = user?.holdings ? Object.entries(user.holdings).map(([id, data]) => ({ id, ...data })) : [];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="app-container"
            style={{
                padding: '20px 16px 140px 16px',
                minHeight: '100vh',
                background: `linear-gradient(rgba(0, 0, 0, 0.82), rgba(0, 0, 0, 0.96)), url(${btcBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                color: '#fff',
                fontFamily: "'Outfit', sans-serif"
            }}
        >
            {/* Hero Section with Miner Mascot */}
            <div style={{ position: 'relative', marginBottom: '32px', padding: '10px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f0b90b', marginBottom: '6px' }}
                        >
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f0b90b', boxShadow: '0 0 10px #f0b90b' }}></div>
                            <span className="shimmer-icon" style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px' }}>Future Assets</span>
                        </motion.div>
                        <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>Future Mining & <br />Asset Hub</h1>
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '4px', maxWidth: '200px' }}>Swap your assets with live rates and freeze for increasing future Assets. </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '15px' }}>


                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, rotate: 10 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            style={{ position: 'relative', zIndex: 1, marginRight: '-10px' }}
                        >
                            <img className="shimmer-icon" src={minerBot} alt="Miner" style={{ width: '130px', height: 'auto', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))', opacity: 0.8 }} />
                        </motion.div>

                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowHistory(true)}
                            className='shimmer-icon'
                            style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: '#fff',
                                width: '110px',
                                height: '35px',
                                borderRadius: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'start',
                                cursor: 'pointer',
                                backdropFilter: 'blur(10px)'
                                , paddingLeft: '10px'
                                , paddingRight: '10px'
                                , paddingTop: '10px'
                                , paddingBottom: '10px'
                            }}
                        >
                            <LucidePickaxe size={18} className='pickaxe-swing' style={{ marginRight: '10px', marginTop: '-5px', }} />
                            <span style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '0.5px' }}>HISTORY</span>
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Glass Wallet Header */}
            <motion.div
                whileHover={{ scale: 1.02 }}
                style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '24px',
                    padding: '24px',
                    marginBottom: '24px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                    <Wallet size={16} />
                    <span style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px' }}>TOTAL LIQUID BALANCE</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <div style={{ fontSize: '38px', fontWeight: '900', color: '#fff', textShadow: '0 0 20px rgba(255,255,255,0.1)' }}>
                        {user?.balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                    </div>
                    <span style={{ fontSize: '18px', color: '#f0b90b', fontWeight: '800' }}>USDT</span>
                </div>
            </motion.div>

            {/* Premium Exchange Interaction Card */}
            <div style={{
                background: 'linear-gradient(165deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
                backdropFilter: 'blur(15px)',
                borderRadius: '32px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.05)',
                marginBottom: '40px',
                boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Visual Flair background pulse */}
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(240,185,11,0.1) 0%, transparent 70%)', pointerEvents: 'none' }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '10px', background: 'rgba(240,185,11,0.1)', borderRadius: '12px' }}>
                            <ArrowRightLeft size={18} color="#f0b90b" />
                        </div>
                        <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Instant Swap</h2>
                    </div>
                </div>

                {/* From Balance Field (Display only) */}
                <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '20px',
                    padding: '20px',
                    border: '1px solid rgba(255,255,255,0.03)',
                    marginBottom: '12px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#555', fontWeight: '700' }}>YOU SPEND</span>
                        <span style={{ fontSize: '11px', color: '#444' }}>Max: {user?.balance?.toFixed(2)} USDT</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={exchangeAmount}
                            onChange={(e) => setExchangeAmount(e.target.value)}
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                color: '#fff',
                                fontSize: '24px',
                                fontWeight: '900',
                                outline: 'none',
                                paddingRight: 0,
                            }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginLeft: '-30px' }}>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#00c087', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900' }}>$</div>
                            <span style={{ paddingLeft: '10px', fontSize: '14px', fontWeight: '800' }}>USDT</span>
                        </div>
                    </div>
                </div>

                {/* Flip Icon Decor */}
                <div style={{ display: 'flex', justifyContent: 'center', margin: '-10px 0', position: 'relative', zIndex: 2 }}>
                    <div style={{
                        width: '36px', height: '36px', background: '#0a0a0a', border: '2px solid #1a1a1a',
                        borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f0b90b'
                    }}>
                        <ArrowBigDown size={16} />
                    </div>
                </div>

                {/* To Asset Field */}
                <div
                    onClick={() => setShowAssetSelector(true)}
                    style={{
                        background: 'rgba(240,185,11,0.03)',
                        borderRadius: '20px',
                        padding: '20px',
                        border: '1px solid rgba(240,185,11,0.1)',
                        marginBottom: '24px',
                        marginTop: '12px',
                        cursor: 'pointer'
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#555', fontWeight: '700' }}>YOU RECEIVE</span>
                        {selectedAssetForExchange && (
                            <span style={{ fontSize: '11px', color: '#f0b90b' }}>Rate: 1 {selectedAssetForExchange.symbol} = {selectedAssetForExchange.rate} USDT</span>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {selectedAssetForExchange ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <img src={selectedAssetForExchange.flag} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                                <div>
                                    <div style={{ fontSize: '20px', fontWeight: '900' }}>
                                        {exchangeAmount ? (parseFloat(exchangeAmount) / parseFloat(String(selectedAssetForExchange.rate).replace(/,/g, ''))).toFixed(6) : '0.000'}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#555' }}>Approximate return</div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ fontSize: '16px', color: '#444', fontWeight: '700' }}>Tap to select asset</div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: selectedAssetForExchange ? 'rgba(240,185,11,0.1)' : 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '12px', border: '1px solid rgba(240,185,11,0.1)' }}>
                            {selectedAssetForExchange ? (
                                <>
                                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#f0b90b' }}>{selectedAssetForExchange.symbol}</span>
                                    <ChevronRight size={14} color="#f0b90b" />
                                </>
                            ) : (
                                <>
                                    <span style={{ fontSize: '14px', fontWeight: '800' }}>SELECT</span>
                                    <ChevronRight size={14} />
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handleExchange}
                    disabled={processing || !selectedAssetForExchange || !exchangeAmount}
                    style={{
                        width: '100%',
                        padding: '20px',
                        background: (processing || !selectedAssetForExchange || !exchangeAmount)
                            ? 'rgba(255,255,255,0.05)'
                            : 'linear-gradient(to right, #f0b90b, #d49a00)',
                        color: (processing || !selectedAssetForExchange || !exchangeAmount) ? '#333' : '#000',
                        borderRadius: '20px',
                        border: 'none',
                        fontWeight: '900',
                        fontSize: '16px',
                        cursor: 'pointer',
                        boxShadow: (processing || !selectedAssetForExchange || !exchangeAmount) ? 'none' : '0 15px 35px rgba(240,185,11,0.25)',
                        transition: 'all 0.3s'
                    }}
                >
                    {processing ? <RefreshCw className="animate-spin" size={24} /> : 'INJECT & SWAP'}
                </motion.button>
            </div>

            {/* Holdings Dashboard List */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px', maxWidth: '200px' }}>Unlimited Assets You Can Store </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '4px', height: '18px', background: '#f0b90b', borderRadius: '2px' }}></div>
                        <h2 style={{ fontSize: '20px', fontWeight: '900', margin: 0 }}>Assets Value</h2>

                    </div>

                    <div style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '12px', fontWeight: '800', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {userHoldingsArray.length} Assets
                    </div>
                </div>

                {userHoldingsArray.length === 0 ? (
                    <div style={{
                        padding: '60px 40px',
                        textAlign: 'center',
                        background: 'rgba(255,255,255,0.02)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '32px',
                        border: '1px dashed rgba(255,255,255,0.08)'
                    }}>
                        <div style={{
                            width: '60px', height: '60px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)',
                            margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Search size={32} color="#222" />
                        </div>
                        <p style={{ color: '#444', fontSize: '14px', fontWeight: '700', margin: 0 }}>Your vault is currently empty.</p>
                        <p style={{ color: '#222', fontSize: '12px', marginTop: '4px' }}>Use the swap tool above to start trading.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {userHoldingsArray.map((holding, idx) => (
                            <motion.div
                                key={holding.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                style={{
                                    background: 'rgba(26, 26, 26, 0.4)',
                                    backdropFilter: 'blur(20px)',
                                    borderRadius: '24px',
                                    padding: '24px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {holding.isFrozen && (
                                    <div style={{
                                        position: 'absolute', top: 0, right: 0, padding: '8px 16px',
                                        background: 'linear-gradient(270deg, rgba(255,77,79,0.2) 0%, transparent 100%)',
                                        borderBottomLeftRadius: '16px', display: 'flex', alignItems: 'center', gap: '6px'
                                    }}>
                                        <Lock size={12} color="#ff4d4f" />
                                        <span style={{ fontSize: '10px', fontWeight: '900', color: '#ff4d4f', letterSpacing: '1px' }}>LOCKED</span>
                                    </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{
                                            width: '48px', height: '48px', borderRadius: '16px',
                                            background: 'rgba(255,255,255,0.03)', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            <img src={holding.icon} alt="" style={{ width: '28px', height: '28px' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '900', fontSize: '17px' }}>{holding.symbol}</div>
                                            <div style={{ fontSize: '12px', color: '#555' }}>{holding.name}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: '900', fontSize: '18px', color: '#fff' }}>{holding.amount.toFixed(6)}</div>
                                        <div style={{ fontSize: '12px', color: '#f0b90b', fontWeight: '700' }}>
                                            ~ {(holding.amount * parseFloat(String(assets.find(a => a.id === holding.id)?.rate || 0).replace(/,/g, ''))).toFixed(2)} USDT
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => toggleFreeze(holding.id)}
                                        disabled={processing}
                                        style={{
                                            flex: 1,
                                            padding: '14px',
                                            borderRadius: '16px',
                                            background: holding.isFrozen ? 'rgba(255,77,79,0.1)' : 'rgba(255,255,255,0.04)',
                                            border: `1px solid ${holding.isFrozen ? 'rgba(255,77,79,0.2)' : 'rgba(255,255,255,0.05)'}`,
                                            color: holding.isFrozen ? '#ff4d4f' : '#888',
                                            fontSize: '12px',
                                            fontWeight: '800',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {holding.isFrozen ? <Unlock size={14} /> : <Lock size={14} />}
                                        {holding.isFrozen ? 'RELEASE' : 'FREEZE'}
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: holding.isFrozen ? 1 : 0.95 }}
                                        onClick={() => handleExchangeBack(holding.id)}
                                        disabled={processing || holding.isFrozen}
                                        style={{
                                            flex: 1.6,
                                            padding: '14px',
                                            borderRadius: '16px',
                                            background: holding.isFrozen ? 'rgba(255,255,255,0.02)' : '#fff',
                                            border: 'none',
                                            color: holding.isFrozen ? '#333' : '#000',
                                            fontSize: '12px',
                                            fontWeight: '800',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            cursor: holding.isFrozen ? 'not-allowed' : 'pointer',
                                            opacity: holding.isFrozen ? 0.3 : 1
                                        }}
                                    >
                                        <ArrowRightLeft size={14} />
                                        LIQUIDATE TO USDT
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Premium Toast Notification System */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        style={{
                            position: 'fixed',
                            bottom: '100px',
                            left: '16px',
                            right: '16px',
                            zIndex: 5000,
                            padding: '18px 24px',
                            background: notification.type === 'error'
                                ? 'linear-gradient(to right, #ff4d4f, #d4380d)'
                                : 'linear-gradient(to right, #00c087, #009c6d)',
                            borderRadius: '20px',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                            fontWeight: '800'
                        }}
                    >
                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '10px' }}>
                            {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                        </div>
                        <span style={{ fontSize: '14px' }}>{notification.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Improved Asset Selector Modal */}
            <AnimatePresence>
                {showAssetSelector && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: '#040404',
                            zIndex: 6000,
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <div style={{ padding: '30px 20px', borderBottom: '1px solid #111' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ padding: '8px', background: 'rgba(240,185,11,0.1)', borderRadius: '10px' }}>
                                        <Sparkles size={18} color="#f0b90b" />
                                    </div>
                                    <h3 style={{ fontSize: '20px', fontWeight: '900', margin: 0 }}>Select Asset</h3>
                                </div>
                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowAssetSelector(false)}
                                    style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid #222' }}
                                >
                                    <X size={20} />
                                </motion.div>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Search size={20} color="#333" style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="text"
                                    placeholder="Search market assets..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        width: '100%',
                                        background: '#0a0a0a',
                                        border: '1px solid #1a1a1a',
                                        borderRadius: '20px',
                                        padding: '18px 20px 18px 54px',
                                        color: '#fff',
                                        fontSize: '16px',
                                        outline: 'none',
                                        fontWeight: '600'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
                            {filteredAssets.length > 0 ? filteredAssets.map((asset, aidx) => (
                                <motion.div
                                    key={asset.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: aidx * 0.02 }}
                                    onClick={() => {
                                        setSelectedAssetForExchange(asset);
                                        setShowAssetSelector(false);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '20px',
                                        borderBottom: '1px solid rgba(255,255,255,0.02)',
                                        backgroundColor: selectedAssetForExchange?.id === asset.id ? 'rgba(240,185,11,0.05)' : 'transparent'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #1a1a1a' }}>
                                            <img src={asset.flag} alt="" style={{ width: '26px', height: '26px' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '900', fontSize: '16px', color: '#fff' }}>{asset.symbol || asset.name.split('/')[0]}</div>
                                            <div style={{ fontSize: '11px', color: '#555', fontWeight: '700' }}>{asset.fullName}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: '900', fontSize: '15px', color: '#fff' }}>{asset.rate}</div>
                                        <div style={{
                                            fontSize: '11px', fontWeight: '800',
                                            color: asset.change?.startsWith('+') ? '#00c087' : '#ff4d4f',
                                            display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end'
                                        }}>
                                            {asset.change?.startsWith('+') ? <TrendingUp size={10} /> : <ArrowRightLeft size={10} style={{ transform: 'rotate(90deg)' }} />}
                                            {asset.change}
                                        </div>
                                    </div>
                                </motion.div>
                            )) : (
                                <div style={{ padding: '60px 40px', textAlign: 'center', color: '#222' }}>
                                    <AlertCircle size={40} style={{ marginBottom: '16px', opacity: 0.1 }} />
                                    <p style={{ fontWeight: '700' }}>No assets found matching "{searchQuery}"</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* History Modal */}
            <AnimatePresence>
                {showHistory && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.95)',
                            backdropFilter: 'blur(20px)',
                            zIndex: 7000,
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <div style={{ padding: '30px 20px', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ padding: '8px', background: 'rgba(240,185,11,0.1)', borderRadius: '10px' }}>
                                    <History size={20} color="#f0b90b" />
                                </div>
                                <h3 style={{ fontSize: '22px', fontWeight: '900', margin: 0 }}>Mining History</h3>
                            </div>
                            <motion.div
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setShowHistory(false)}
                                style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </motion.div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                            {(!user?.miningHistory || user.miningHistory.length === 0) ? (
                                <div style={{ padding: '100px 40px', textAlign: 'center' }}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <History size={40} color="#222" />
                                    </div>
                                    <p style={{ color: '#444', fontWeight: '600' }}>No transaction history found.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {user.miningHistory.map((item, idx) => {
                                        const currentAsset = assets.find(a => a.symbol === item.symbol || a.name.startsWith(item.symbol));
                                        const currentRate = currentAsset ? parseFloat(String(currentAsset.rate).replace(/,/g, '')) : item.rate;

                                        // Calculate profit
                                        let profit = 0;
                                        let profitPercentage = 0;

                                        if (item.type === 'buy') {
                                            profit = (currentRate - item.rate) * item.assetAmount;
                                            profitPercentage = ((currentRate - item.rate) / item.rate) * 100;
                                        } else if (item.type === 'release') {
                                            const entryRate = item.entryRate || item.rate;
                                            profit = (item.rate - entryRate) * item.assetAmount;
                                            profitPercentage = ((item.rate - entryRate) / entryRate) * 100;
                                        } else if (item.type === 'freeze') {
                                            profit = (currentRate - item.rate) * item.assetAmount;
                                            profitPercentage = ((currentRate - item.rate) / item.rate) * 100;
                                        }

                                        const getTypeLabel = (type) => {
                                            if (type === 'buy') return 'Mining Purchase';
                                            if (type === 'sell') return 'Asset Liquidated';
                                            if (type === 'freeze') return 'Security Locked';
                                            if (type === 'release') return 'Asset Released';
                                            return type;
                                        };

                                        const getStatusBadge = (type) => {
                                            if (type === 'freeze' || type === 'buy') return 'FROZEN';
                                            return 'RELEASED';
                                        };

                                        const getTypeColor = (type) => {
                                            if (type === 'buy' || type === 'release') return '#00c087';
                                            if (type === 'sell' || type === 'freeze') return '#f0b90b';
                                            return '#fff';
                                        };

                                        return (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                style={{
                                                    background: 'rgba(255, 255, 255, 0.02)',
                                                    borderRadius: '24px',
                                                    padding: '24px',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    position: 'relative',
                                                    marginBottom: '16px'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                                    <div style={{ display: 'flex', gap: '15px' }}>
                                                        <div style={{
                                                            width: '50px',
                                                            height: '50px',
                                                            borderRadius: '16px',
                                                            background: `${getTypeColor(item.type)}15`,
                                                            color: getTypeColor(item.type),
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            boxShadow: `0 4px 15px ${getTypeColor(item.type)}20`
                                                        }}>
                                                            {item.type === 'buy' ? <ArrowBigDown size={24} /> :
                                                                item.type === 'sell' ? <RefreshCw size={24} /> :
                                                                    item.type === 'freeze' ? <Lock size={24} /> : <Unlock size={24} />}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '16px', fontWeight: '900', color: '#fff', letterSpacing: '0.5px' }}>{getTypeLabel(item.type)}</div>
                                                            <div style={{ fontSize: '11px', color: '#555', marginTop: '2px', fontWeight: '700' }}>
                                                                {new Date(item.timestamp).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{
                                                        padding: '6px 14px',
                                                        borderRadius: '100px',
                                                        fontSize: '10px',
                                                        fontWeight: '900',
                                                        background: getStatusBadge(item.type) === 'STILL ACTIVE' ? 'rgba(0,192,135,0.1)' : 'rgba(255,255,255,0.05)',
                                                        color: getStatusBadge(item.type) === 'STILL ACTIVE' ? '#00c087' : '#888',
                                                        border: `1px solid ${getStatusBadge(item.type) === 'STILL ACTIVE' ? 'rgba(0,192,135,0.2)' : 'rgba(255,255,255,0.1)'}`,
                                                        letterSpacing: '1px'
                                                    }}>
                                                        {getStatusBadge(item.type)}
                                                    </div>
                                                </div>

                                                <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                        <div>
                                                            <div style={{ fontSize: '10px', color: '#444', fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase' }}>ENTRY VALUE</div>
                                                            <div style={{ fontSize: '15px', fontWeight: '900', color: '#fff' }}>
                                                                {(item.assetAmount * item.rate).toFixed(2)} <span style={{ color: 'var(--accent-gold)', fontSize: '12px' }}>{item.symbol}</span>
                                                            </div>
                                                            <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
                                                                ${(item.entryRate || item.rate).toLocaleString()} / unit
                                                            </div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: '10px', color: '#444', fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase' }}>CURRENT VALUE</div>
                                                            <div style={{ fontSize: '15px', fontWeight: '900', color: profit >= 0 ? '#00c087' : '#ff4d4f' }}>
                                                                {(item.assetAmount * currentRate).toFixed(2)} <span style={{ fontSize: '12px' }}>{item.symbol}</span>
                                                            </div>
                                                            <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
                                                                ${currentRate.toLocaleString()} / unit
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <div style={{ fontSize: '10px', color: '#444', fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase' }}>
                                                                {item.type === 'freeze' || item.type === 'buy' ? 'Unrealized Result' : 'Realized Result'}
                                                            </div>
                                                            <div style={{ fontSize: '18px', fontWeight: '900', color: profit >= 0 ? '#00c087' : '#ff4d4f' }}>
                                                                {profit >= 0 ? '+' : ''}{profit.toFixed(2)} USDT
                                                            </div>
                                                        </div>
                                                        <div style={{
                                                            padding: '8px 15px',
                                                            borderRadius: '12px',
                                                            background: `${profit >= 0 ? '#00c087' : '#ff4d4f'}15`,
                                                            color: profit >= 0 ? '#00c087' : '#ff4d4f',
                                                            fontSize: '14px',
                                                            fontWeight: '900'
                                                        }}>
                                                            {profit >= 0 ? '+' : ''}{profitPercentage.toFixed(2)}%
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @keyframes pulse-glow {
                    0% { box-shadow: 0 0 5px rgba(240,185,11,0.2); }
                    50% { box-shadow: 0 0 20px rgba(240,185,11,0.4); }
                    100% { box-shadow: 0 0 5px rgba(240,185,11,0.2); }
                }
                .animate-spin {
                    animation: spin 1.5s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes pickaxe-swing {
                    0% { transform: rotate(-30deg); transform-translate: -100px;}
                    50% { transform: rotate(70deg); }
                    70% { transform: rotate(50deg); }
                    80% { transform: rotate(70deg); }
                    100% { transform: rotate(-30deg); }
                }
                .pickaxe-swing {
                    animation: pickaxe-swing 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                    transform-origin: 20% 80%;
                }
                *::-webkit-scrollbar {
                    width: 3px;
                }
                *::-webkit-scrollbar-track {
                    background: transparent;
                }
                *::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.05);
                    border-radius: 10px;
                }
            `}</style>
        </motion.div>
    );
};

export default Coin;
