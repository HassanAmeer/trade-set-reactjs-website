import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase-setup';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    RefreshCw, Save, Loader2, ToggleLeft, ToggleRight,
    Clock, DollarSign, Eye, EyeOff, Plus, Trash2,
    CheckCircle2, AlertCircle, Bitcoin, TrendingUp, Gem, ChevronDown,
    Pencil, X
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = [
    { id: 'crypto',  label: 'Cryptocurrency',   icon: Bitcoin,     color: '#f7931a' },
    { id: 'forex',   label: 'Foreign Exchange',  icon: TrendingUp,  color: '#00c087' },
    { id: 'metals',  label: 'Precious Metals',   icon: Gem,         color: '#f0b90b' },
];

const DEFAULT_CONFIG = {
    crypto: { useCustomPrice: false, syncIntervalSeconds: 300,   lastSyncedAt: 0 },
    forex:  { useCustomPrice: false, syncIntervalSeconds: 1800,  lastSyncedAt: 0 },
    metals: { useCustomPrice: false, syncIntervalSeconds: 21600, lastSyncedAt: 0 },
};

const LIVECOINWATCH_KEY = '20c87391-6c37-4e83-a9cb-ad52ab7a3da2';

// Default coins per tab (used for custom rate rows)
const DEFAULT_COINS = {
    crypto: [
        { id: 'BTCUSDT',  label: 'BTC/USDT',  icon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
        { id: 'ETHUSDT',  label: 'ETH/USDT',  icon: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
        { id: 'SOLUSDT',  label: 'SOL/USDT',  icon: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
        { id: 'XRPUSDT',  label: 'XRP/USDT',  icon: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png' },
        { id: 'AVAXUSDT', label: 'AVAX/USDT', icon: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png' },
        { id: 'LINKUSDT', label: 'LINK/USDT', icon: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png' },
        { id: 'MATICUSDT',label: 'MATIC/USDT',icon: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png' },
        { id: 'SHIBUSDT', label: 'SHIB/USDT', icon: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png' },
        { id: 'TONUSDT',  label: 'TON/USDT',  icon: 'https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png' },
        { id: 'NEARUSDT', label: 'NEAR/USDT', icon: 'https://assets.coingecko.com/coins/images/10365/small/near_icon.png' },
        { id: 'PEPEUSDT', label: 'PEPE/USDT', icon: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token-icon.png' },
        { id: 'SUIUSDT',  label: 'SUI/USDT',  icon: 'https://assets.coingecko.com/coins/images/26375/small/sui_logo.png' },
        { id: 'DOGEUSDT', label: 'DOGE/USDT', icon: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png' },
        { id: 'TRXUSDT',  label: 'TRX/USDT',  icon: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png' },
        { id: 'DOTUSDT',  label: 'DOT/USDT',  icon: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png' },
        { id: 'LTCUSDT',  label: 'LTC/USDT',  icon: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png' },
    ],
    forex: [
        { id: 'fx-gbp', label: 'GBP/USD', icon: 'https://flagcdn.com/w40/gb.png' },
        { id: 'fx-eur', label: 'EUR/USD', icon: 'https://flagcdn.com/w40/eu.png' },
        { id: 'fx-aud', label: 'AUD/USD', icon: 'https://flagcdn.com/w40/au.png' },
        { id: 'fx-nzd', label: 'NZD/USD', icon: 'https://flagcdn.com/w40/nz.png' },
        { id: 'fx-jpy', label: 'USD/JPY', icon: 'https://flagcdn.com/w40/jp.png' },
        { id: 'fx-cad', label: 'USD/CAD', icon: 'https://flagcdn.com/w40/ca.png' },
        { id: 'fx-chf', label: 'USD/CHF', icon: 'https://flagcdn.com/w40/ch.png' },
        { id: 'fx-hkd', label: 'USD/HKD', icon: 'https://flagcdn.com/w40/hk.png' },
        { id: 'fx-inr', label: 'INR/USD', icon: 'https://flagcdn.com/w40/in.png' },
        { id: 'fx-krw', label: 'USD/KRW', icon: 'https://flagcdn.com/w40/kr.png' },
        { id: 'fx-thb', label: 'USD/THB', icon: 'https://flagcdn.com/w40/th.png' },
        { id: 'fx-aed', label: 'AED/USD', icon: 'https://flagcdn.com/w40/ae.png' },
    ],
    metals: [
        { id: 'metal-1',  label: 'XAU/USD (Gold)',     icon: 'https://img.icons8.com/color/96/gold-bars.png' },
        { id: 'metal-2',  label: 'XAG/USD (Silver)',   icon: 'https://img.icons8.com/color/96/silver-bars.png' },
        { id: 'metal-4',  label: 'XPT/USD (Platinum)', icon: 'https://img.icons8.com/color/96/silver-bars.png' },
        { id: 'metal-5',  label: 'XPD/USD (Palladium)',icon: 'https://img.icons8.com/color/96/silver-bars.png' },
        { id: 'metal-6',  label: 'XCU/USD (Copper)',   icon: 'https://img.icons8.com/color/96/copper-ingot.png' },
        { id: 'metal-7',  label: 'ALU/USD (Aluminum)', icon: 'https://img.icons8.com/color/96/aluminum-ingot.png' },
        { id: 'metal-9',  label: 'ZNC/USD (Zinc)',     icon: 'https://img.icons8.com/color/96/steel-ingot.png' },
        { id: 'metal-10', label: 'NKL/USD (Nickel)',   icon: 'https://img.icons8.com/color/96/steel-ingot.png' },
        { id: 'metal-11', label: 'LD/USD (Lead)',      icon: 'https://img.icons8.com/color/96/steel-ingot.png' },
    ],
};

// ─── Helper ────────────────────────────────────────────────────────────────
function timeAgo(ms) {
    if (!ms) return 'Never';
    const diff = Date.now() - ms;
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function secondsToHuman(sec) {
    if (sec < 60)   return `${sec}s`;
    if (sec < 3600) return `${Math.round(sec / 60)}m`;
    if (sec < 86400)return `${(sec / 3600).toFixed(1)}h`;
    return `${(sec / 86400).toFixed(1)}d`;
}

// ─── Toggle Component ──────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, label, description, accentColor = '#00c087' }) => (
    <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '18px 20px',
        background: checked ? `rgba(${hexToRgb(accentColor)}, 0.04)` : 'rgba(255,255,255,0.01)',
        border: `1px solid ${checked ? `rgba(${hexToRgb(accentColor)}, 0.2)` : 'rgba(255,255,255,0.05)'}`,
        borderRadius: '14px',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        userSelect: 'none',
        boxShadow: checked ? `inset 0 0 12px rgba(${hexToRgb(accentColor)}, 0.05)` : 'none',
    }} onClick={onChange}>
        <div>
            <div style={{ color: '#fff', fontWeight: '700', fontSize: '14px', letterSpacing: '0.3px' }}>{label}</div>
            {description && <div style={{ color: '#666', fontSize: '11px', marginTop: '4px', lineHeight: '1.4' }}>{description}</div>}
        </div>
        <div style={{
            width: '52px', height: '28px', borderRadius: '14px',
            background: checked ? accentColor : 'rgba(255,255,255,0.05)',
            position: 'relative', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            flexShrink: 0, border: `1px solid ${checked ? accentColor : 'rgba(255,255,255,0.1)'}`,
            boxShadow: checked ? `0 0 10px rgba(${hexToRgb(accentColor)}, 0.3)` : 'none',
        }}>
            <motion.div 
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                style={{
                    position: 'absolute', top: '3px',
                    left: checked ? '27px' : '3px',
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: '#fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                }} 
            />
        </div>
    </div>
);

function hexToRgb(hex) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : '0,192,135';
}

// ─── Main Component ───────────────────────────────────────────────────────
const AdminCoinsSettings = () => {
    const [activeTab, setActiveTab]           = useState('crypto');
    const [config, setConfig]                 = useState(DEFAULT_CONFIG);
    const [customRates, setCustomRates]       = useState({ crypto: {}, forex: {}, metals: {} });
    const [visibility, setVisibility]         = useState({});
    const [extraCoins, setExtraCoins]         = useState({
        crypto: [],
        forex: [],
        metals: [],
        deletedCoins: {
            crypto: [],
            forex: [],
            metals: [],
        }
    });
    const [liveRates, setLiveRates]           = useState({ crypto: [], forex: {}, metals: {} });
    const [loading, setLoading]               = useState(true);
    const [saving, setSaving]                 = useState('');
    const [syncing, setSyncing]               = useState('');
    const [toast, setToast]                   = useState(null);
    const [newCoinCode, setNewCoinCode]       = useState('');
    const [addingCoin, setAddingCoin]         = useState(false);
    const [localIntervals, setLocalIntervals] = useState({});
    const [localRates, setLocalRates]         = useState({});
    const [expandRates, setExpandRates]       = useState(false);
    const [focusedInputId, setFocusedInputId] = useState(null);
    const [customNames, setCustomNames]       = useState({ crypto: {}, forex: {}, metals: {} });
    const [editingNameId, setEditingNameId]   = useState(null);
    const [tempName, setTempName]             = useState('');

    const tabInfo = TABS.find(t => t.id === activeTab);
    const accentColor = tabInfo?.color || '#00c087';

    // ── Fetch all data ──────────────────────────────────────────────────
    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [
                cfgSnap, ratesSnap, visSnap, listSnap,
                cryptoListSnap, forexListSnap, metalsListSnap,
                cryptoRatesSnap, forexRatesSnap, metalsRatesSnap
            ] = await Promise.all([
                getDoc(doc(db, 'admin_set', 'coins_config')),
                getDoc(doc(db, 'admin_set', 'coins_custom_rates')),
                getDoc(doc(db, 'admin_set', 'coins_visibility')),
                getDoc(doc(db, 'admin_set', 'coins_list')),
                getDoc(doc(db, 'coins_list_crypto', 'latest')),
                getDoc(doc(db, 'coins_list_forex', 'latest')),
                getDoc(doc(db, 'coins_list_metals', 'latest')),
                getDoc(doc(db, 'coins_rates_crypto', 'latest')),
                getDoc(doc(db, 'coins_rates_forex', 'latest')),
                getDoc(doc(db, 'coins_rates_metals', 'latest')),
            ]);

            const cfgData = cfgSnap.exists() ? cfgSnap.data() : DEFAULT_CONFIG;
            const merged = {
                crypto: { ...DEFAULT_CONFIG.crypto, ...(cfgData.crypto || {}) },
                forex:  { ...DEFAULT_CONFIG.forex,  ...(cfgData.forex  || {}) },
                metals: { ...DEFAULT_CONFIG.metals, ...(cfgData.metals || {}) },
            };
            setConfig(merged);
            setLocalIntervals({
                crypto: merged.crypto.syncIntervalSeconds,
                forex:  merged.forex.syncIntervalSeconds,
                metals: merged.metals.syncIntervalSeconds,
            });

            if (ratesSnap.exists()) setCustomRates(ratesSnap.data());
            if (visSnap.exists())   setVisibility(visSnap.data());

            const mergedRates = {
                crypto: cryptoRatesSnap.exists() ? cryptoRatesSnap.data().rates : [],
                forex: forexRatesSnap.exists() ? forexRatesSnap.data() : {},
                metals: metalsRatesSnap.exists() ? metalsRatesSnap.data().rates : {},
            };
            setLiveRates(mergedRates);

            let finalExtraCoins = {
                crypto: [],
                forex: [],
                metals: [],
                deletedCoins: {
                    crypto: [],
                    forex: [],
                    metals: [],
                }
            };

            const hasNewLists = cryptoListSnap.exists() || forexListSnap.exists() || metalsListSnap.exists();
            const loadedCustomNames = { crypto: {}, forex: {}, metals: {} };

            if (hasNewLists) {
                if (cryptoListSnap.exists()) {
                    const d = cryptoListSnap.data();
                    finalExtraCoins.crypto = d.crypto || [];
                    finalExtraCoins.deletedCoins.crypto = d.deletedCoins || [];
                    loadedCustomNames.crypto = d.customNames || {};
                }
                if (forexListSnap.exists()) {
                    const d = forexListSnap.data();
                    finalExtraCoins.forex = d.forex || [];
                    finalExtraCoins.deletedCoins.forex = d.deletedCoins || [];
                    loadedCustomNames.forex = d.customNames || {};
                }
                if (metalsListSnap.exists()) {
                    const d = metalsListSnap.data();
                    finalExtraCoins.metals = d.metals || [];
                    finalExtraCoins.deletedCoins.metals = d.deletedCoins || [];
                    loadedCustomNames.metals = d.customNames || {};
                }
            } else if (listSnap.exists()) {
                // Perform silent database migration
                console.log('[Migration] Migrating legacy coins_list to separate collection documents...');
                const legacy = listSnap.data();
                const legacyCrypto = legacy.crypto || legacy.extraCoins || [];
                const legacyForex = legacy.forex || [];
                const legacyMetals = legacy.metals || [];
                const legacyDeleted = legacy.deletedCoins || [];

                const splitDeletedCrypto = legacyDeleted.filter(id => !id.startsWith('fx-') && !id.startsWith('metal-'));
                const splitDeletedForex = legacyDeleted.filter(id => id.startsWith('fx-'));
                const splitDeletedMetals = legacyDeleted.filter(id => id.startsWith('metal-'));

                finalExtraCoins = {
                    crypto: legacyCrypto,
                    forex: legacyForex,
                    metals: legacyMetals,
                    deletedCoins: {
                        crypto: splitDeletedCrypto,
                        forex: splitDeletedForex,
                        metals: splitDeletedMetals,
                    }
                };

                // Write migrated documents to database in background
                try {
                    await Promise.all([
                        setDoc(doc(db, 'coins_list_crypto', 'latest'), {
                            crypto: legacyCrypto,
                            deletedCoins: splitDeletedCrypto,
                        }),
                        setDoc(doc(db, 'coins_list_forex', 'latest'), {
                            forex: legacyForex,
                            deletedCoins: splitDeletedForex,
                        }),
                        setDoc(doc(db, 'coins_list_metals', 'latest'), {
                            metals: legacyMetals,
                            deletedCoins: splitDeletedMetals,
                        }),
                    ]);
                    console.log('[Migration] Migration successful.');
                } catch (migrationError) {
                    console.error('[Migration] Failed to save migrated documents:', migrationError);
                }
            }

            setExtraCoins(finalExtraCoins);
            setCustomNames(loadedCustomNames);
        } catch (err) {
            showToast('error', 'Failed to load settings: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ── Toast helper ────────────────────────────────────────────────────
    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3000);
    };

    // ── Save tab config (toggle + interval) ─────────────────────────────
    const saveTabConfig = async (tab) => {
        setSaving(tab);
        try {
            const interval = Math.max(60, parseInt(localIntervals[tab]) || DEFAULT_CONFIG[tab].syncIntervalSeconds);
            const newCfg = {
                ...config,
                [tab]: { ...config[tab], syncIntervalSeconds: interval },
            };
            await setDoc(doc(db, 'admin_set', 'coins_config'), newCfg);
            setConfig(newCfg);
            showToast('success', 'Settings saved!');
        } catch (err) {
            showToast('error', 'Save failed: ' + err.message);
        } finally {
            setSaving('');
        }
    };

    // ── Toggle custom price ──────────────────────────────────────────────
    const toggleCustomPrice = async (tab) => {
        const newVal = !config[tab].useCustomPrice;
        const newCfg = { ...config, [tab]: { ...config[tab], useCustomPrice: newVal } };
        setConfig(newCfg);
        try {
            await setDoc(doc(db, 'admin_set', 'coins_config'), newCfg);
            showToast('success', newVal ? 'Custom price mode ON' : 'API mode ON');
        } catch (err) {
            setConfig(config); // revert
            showToast('error', 'Failed: ' + err.message);
        }
    };

    // ── Save single custom rate ──────────────────────────────────────────
    const saveCustomRate = async (tab, coinId) => {
        const rateVal = localRates[coinId];
        if (!rateVal) return showToast('error', 'Rate cannot be empty');
        setSaving(coinId);
        try {
            const newRates = {
                ...customRates,
                [tab]: { ...(customRates[tab] || {}), [coinId]: rateVal },
            };
            await setDoc(doc(db, 'admin_set', 'coins_custom_rates'), newRates);
            setCustomRates(newRates);
            showToast('success', 'Rate saved!');
        } catch (err) {
            showToast('error', 'Failed: ' + err.message);
        } finally {
            setSaving('');
        }
    };

    // ── Force sync (call API + store to DB) ──────────────────────────────
    const forceSyncNow = async (tab) => {
        setSyncing(tab);
        try {
            let freshData = null;
            const now = Date.now();

            if (tab === 'crypto') {
                const codes = [
                    'BTC','ETH','SOL','XRP','AVAX','LINK','MATIC','SHIB','TON','NEAR','PEPE','SUI','DOGE','TRX','DOT','LTC',
                    ...(extraCoins.crypto || [])
                ].filter(Boolean);
                const mappedCodes = codes.map(c => {
                    const upper = c.toUpperCase();
                    if (upper === 'SUI') return '_SUI';
                    if (upper === 'PEPE') return '____PEPE';
                    if (upper === 'TON') return 'TONCOIN';
                    return c;
                });
                const res = await fetch('https://api.livecoinwatch.com/coins/map', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json', 'x-api-key': LIVECOINWATCH_KEY },
                    body: JSON.stringify({ codes: mappedCodes, currency: 'USD', sort: 'rank', order: 'ascending', offset: 0, limit: 0, meta: true }),
                });
                if (!res.ok) throw new Error('LiveCoinWatch API error: ' + res.status);
                const rawData = await res.json();
                console.log('[AdminCoins][Crypto] API response fetched from LiveCoinWatch:', rawData);
                freshData = rawData.map(item => {
                    let rawName = item.code;
                    if (rawName === '_SUI') rawName = 'SUI';
                    else if (rawName === '____PEPE') rawName = 'PEPE';
                    else if (rawName === 'TONCOIN') rawName = 'TON';

                    const pct = item.delta && item.delta.day ? (item.delta.day - 1) * 100 : 0;
                    const sign = pct >= 0 ? '+' : '';
                    return {
                        id: rawName + 'USDT',
                        symbol: rawName,
                        name: `${rawName}/USDT`,
                        fullName: item.name || rawName,
                        rate: (item.rate !== null && item.rate !== undefined && !isNaN(parseFloat(item.rate))) ? (
                            parseFloat(item.rate) > 100 ?
                                parseFloat(item.rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) :
                                parseFloat(item.rate).toFixed(6)
                        ) : '0.00',
                        change: `${sign}${pct.toFixed(2)}%`,
                        flag: item.png64 || item.png32 || `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${rawName.toLowerCase()}.png`,
                        category: 'Cryptocurrency',
                        volume24h: item.volume ? (parseFloat(item.volume) / 1000000).toFixed(1) + 'M' : '0M',
                        high24h: 'N/A',
                        low24h: 'N/A',
                        isLive: true
                    };
                });
            } else if (tab === 'forex' || tab === 'metals') {
                const url = 'https://api.metals.dev/v1/latest?api_key=DCU40FCSUKCJAJ3WJVJI9823WJVJI&currency=USD&unit=toz';
                const res = await fetch(url, {
                    headers: { 'Accept': 'application/json' }
                });
                if (!res.ok) throw new Error(`Metals.dev API error: ${res.status}`);
                const result = await res.json();
                console.log('[AdminCoins][Forex/Metals] API response fetched from metals.dev:', result);
                if (result.status === 'success') {
                    let updatedForex = null;
                    let updatedMetals = null;

                    if (result.currencies) {
                        updatedForex = {
                            provider: 'metals.dev',
                            rates: result.currencies,
                            syncedAt: now,
                        };
                        await setDoc(doc(db, 'coins_rates_forex', 'latest'), updatedForex);
                    }

                    if (result.metals) {
                        updatedMetals = result.metals;
                        await setDoc(doc(db, 'coins_rates_metals', 'latest'), {
                            rates: updatedMetals,
                            syncedAt: now,
                        });
                    }

                    setLiveRates(prev => ({
                        ...prev,
                        ...(updatedForex ? { forex: updatedForex } : {}),
                        ...(updatedMetals ? { metals: updatedMetals } : {}),
                    }));

                    const newCfg = {
                        ...config,
                        forex: { ...config.forex, lastSyncedAt: now },
                        metals: { ...config.metals, lastSyncedAt: now },
                    };
                    await setDoc(doc(db, 'admin_set', 'coins_config'), newCfg);
                    setConfig(newCfg);

                    showToast('success', `Forex and Metals synced successfully!`);
                } else {
                    throw new Error('Metals.dev API returned invalid structure');
                }
            }
        } catch (err) {
            showToast('error', 'Sync failed: ' + err.message);
        } finally {
            setSyncing('');
        }
    };

    // ── Toggle coin visibility ───────────────────────────────────────────
    const toggleVisibility = async (coinId) => {
        const current = visibility[coinId] !== false;
        const newVis = { ...visibility, [coinId]: !current };
        setVisibility(newVis);
        try {
            await setDoc(doc(db, 'admin_set', 'coins_visibility'), newVis);
        } catch (err) {
            setVisibility(visibility);
            showToast('error', 'Failed: ' + err.message);
        }
    };

    // ── Add coin ────────────────────────────────────────────────────────
    const addCoin = async () => {
        const inputVal = newCoinCode.trim();
        if (!inputVal) return showToast('error', 'Please enter a value');

        setAddingCoin(true);
        try {
            if (activeTab === 'crypto') {
                const code = inputVal.toUpperCase();
                if ((extraCoins.crypto || []).includes(code)) {
                    return showToast('error', 'Coin already added');
                }
                const lcwCode = code === 'SUI' ? '_SUI' : (code === 'PEPE' ? '____PEPE' : (code === 'TON' ? 'TONCOIN' : code));
                // Verify with LiveCoinWatch
                const res = await fetch('https://api.livecoinwatch.com/coins/map', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json', 'x-api-key': LIVECOINWATCH_KEY },
                    body: JSON.stringify({ codes: [lcwCode], currency: 'USD', sort: 'rank', order: 'ascending', offset: 0, limit: 0, meta: true }),
                });
                const data = await res.json();
                if (!Array.isArray(data) || data.length === 0) {
                    throw new Error(`Coin "${code}" not found on LiveCoinWatch.`);
                }
                const updatedCrypto = [...(extraCoins.crypto || []), code];
                const newDocData = {
                    crypto: updatedCrypto,
                    deletedCoins: extraCoins.deletedCoins.crypto || [],
                };
                await setDoc(doc(db, 'coins_list_crypto', 'latest'), newDocData);
                setExtraCoins(prev => ({
                    ...prev,
                    crypto: updatedCrypto,
                }));
                setNewCoinCode('');
                showToast('success', `${code} added successfully!`);
            } else if (activeTab === 'forex') {
                const code = inputVal.toUpperCase();
                if ((extraCoins.forex || []).includes(code)) {
                    return showToast('error', 'Currency already added');
                }
                if (code.length !== 3) {
                    return showToast('error', 'Forex code must be a 3-letter ISO code');
                }
                // Verify with metals.dev API
                const url = 'https://api.metals.dev/v1/latest?api_key=DCU40FCSUKCJAJ3WJVJI9823WJVJI&currency=USD&unit=toz';
                const res = await fetch(url);
                if (!res.ok) throw new Error('Failed to verify currency code with Metals API');
                const data = await res.json();
                console.log('[AdminCoins][AddCoin Verification] API response fetched from metals.dev:', data);
                if (data.status !== 'success' || !data.currencies || !data.currencies[code]) {
                    throw new Error(`Currency code "${code}" not supported by API.`);
                }
                const updatedForex = [...(extraCoins.forex || []), code];
                const newDocData = {
                    forex: updatedForex,
                    deletedCoins: extraCoins.deletedCoins.forex || [],
                };
                await setDoc(doc(db, 'coins_list_forex', 'latest'), newDocData);
                setExtraCoins(prev => ({
                    ...prev,
                    forex: updatedForex,
                }));
                setNewCoinCode('');
                showToast('success', `${code} added successfully!`);
            } else if (activeTab === 'metals') {
                if (!inputVal.includes('|')) {
                    throw new Error('Metals format must be SYMBOL|Full Name (e.g., IRON/USD|Iron Ore)');
                }
                const parts = inputVal.split('|');
                const symbol = parts[0].trim().toUpperCase();
                const name = parts[1].trim();
                if (!symbol || !name) {
                    throw new Error('Both symbol and name are required.');
                }
                const formatVal = `${symbol}|${name}`;
                if ((extraCoins.metals || []).includes(formatVal)) {
                    return showToast('error', 'Metal already added');
                }
                const updatedMetals = [...(extraCoins.metals || []), formatVal];
                const newDocData = {
                    metals: updatedMetals,
                    deletedCoins: extraCoins.deletedCoins.metals || [],
                };
                await setDoc(doc(db, 'coins_list_metals', 'latest'), newDocData);
                setExtraCoins(prev => ({
                    ...prev,
                    metals: updatedMetals,
                }));
                setNewCoinCode('');
                showToast('success', `${symbol} added successfully!`);
            }
        } catch (err) {
            showToast('error', err.message);
        } finally {
            setAddingCoin(false);
        }
    };

    // ─── Remove/Delete coin ────────────────────────────────────────────────
    const removeCoin = async (itemToRemoveOrCoin) => {
        const isDefaultObject = typeof itemToRemoveOrCoin === 'object' && itemToRemoveOrCoin !== null && !itemToRemoveOrCoin.isExtra;
        const isDefaultId = typeof itemToRemoveOrCoin === 'string' && (
            itemToRemoveOrCoin.endsWith('USDT') || 
            itemToRemoveOrCoin.startsWith('fx-') || 
            itemToRemoveOrCoin.startsWith('metal-')
        ) && !itemToRemoveOrCoin.includes('|'); // metals extra coins contain '|'

        let updatedTabExtra = [...(extraCoins[activeTab] || [])];
        let updatedTabDeleted = [...(extraCoins.deletedCoins[activeTab] || [])];

        if (isDefaultObject || isDefaultId) {
            const coinId = isDefaultObject ? itemToRemoveOrCoin.id : itemToRemoveOrCoin;
            if (!updatedTabDeleted.includes(coinId)) {
                updatedTabDeleted = [...updatedTabDeleted, coinId];
            }
        } else {
            // It is an extra/custom coin identifier string
            const stringIdentifier = typeof itemToRemoveOrCoin === 'object' 
                ? (activeTab === 'metals' ? itemToRemoveOrCoin.rawString : itemToRemoveOrCoin.code)
                : itemToRemoveOrCoin;

            updatedTabExtra = updatedTabExtra.filter(c => c !== stringIdentifier);
        }

        // Firestore updates
        const collectionName = `coins_list_${activeTab}`;
        const docData = {
            [activeTab]: updatedTabExtra,
            deletedCoins: updatedTabDeleted,
        };

        try {
            await setDoc(doc(db, collectionName, 'latest'), docData);
            setExtraCoins(prev => ({
                ...prev,
                [activeTab]: updatedTabExtra,
                deletedCoins: {
                    ...prev.deletedCoins,
                    [activeTab]: updatedTabDeleted,
                }
            }));
            showToast('success', 'Removed successfully');
        } catch (err) {
            showToast('error', 'Failed: ' + err.message);
        }
    };

    // ─── Restore default coin ──────────────────────────────────────────────
    const restoreCoin = async (coinId) => {
        const currentDeleted = extraCoins.deletedCoins[activeTab] || [];
        const updatedDeleted = currentDeleted.filter(id => id !== coinId);

        // Firestore updates
        const collectionName = `coins_list_${activeTab}`;
        const docData = {
            [activeTab]: extraCoins[activeTab] || [],
            deletedCoins: updatedDeleted,
        };

        try {
            await setDoc(doc(db, collectionName, 'latest'), docData);
            setExtraCoins(prev => ({
                ...prev,
                deletedCoins: {
                    ...prev.deletedCoins,
                    [activeTab]: updatedDeleted,
                }
            }));
            showToast('success', 'Restored successfully');
        } catch (err) {
            showToast('error', 'Restore failed: ' + err.message);
        }
    };

    // ─── Save custom display name ──────────────────────────────────────────
    const saveCustomName = async (coinId, newName, tab) => {
        const trimmed = newName.trim();
        const collectionName = `coins_list_${tab}`;

        // Build new customNames map for this tab
        const updatedTabNames = { ...(customNames[tab] || {}) };
        if (trimmed) {
            updatedTabNames[coinId] = trimmed;
        } else {
            delete updatedTabNames[coinId]; // Remove override → revert to default name
        }

        try {
            // Merge into existing document (use setDoc with merge)
            await setDoc(doc(db, collectionName, 'latest'), { customNames: updatedTabNames }, { merge: true });
            setCustomNames(prev => ({ ...prev, [tab]: updatedTabNames }));
            setEditingNameId(null);
            setTempName('');
            showToast('success', trimmed ? `Name saved: "${trimmed}"` : 'Custom name cleared — showing default');
        } catch (err) {
            showToast('error', 'Failed to save name: ' + err.message);
        }
    };

    // ── Get all coins for current tab ────────────────────────────────────
    const getCoinsForTab = (tab) => {
        let base = DEFAULT_COINS[tab] || [];
        const deletedList = extraCoins.deletedCoins[tab] || [];
        base = base.filter(c => !deletedList.includes(c.id));

        if (tab === 'crypto') {
            const extra = (extraCoins.crypto || []).map(code => ({
                id: code + 'USDT',
                label: `${code}/USDT`,
                icon: `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${code.toLowerCase()}.png`,
                isExtra: true,
                code,
            }));
            return [...base, ...extra];
        } else if (tab === 'forex') {
            const extra = (extraCoins.forex || []).map(code => ({
                id: `fx-${code.toLowerCase()}`,
                label: `${code.toUpperCase()}/USD`,
                icon: `https://flagcdn.com/w40/${code.slice(0, 2).toLowerCase()}.png`,
                isExtra: true,
                code,
            }));
            return [...base, ...extra];
        } else if (tab === 'metals') {
            const extra = (extraCoins.metals || []).map((str, idx) => {
                const parts = str.split('|');
                const symbol = parts[0]?.trim() || 'UNKNOWN/USD';
                const name = parts[1]?.trim() || symbol;
                return {
                    id: `metal-extra-${idx}`,
                    label: `${symbol} (${name})`,
                    icon: 'https://img.icons8.com/color/96/steel-ingot.png',
                    isExtra: true,
                    rawString: str,
                };
            });
            return [...base, ...extra];
        }
        return base;
    };

    // ── Get live rate for coin/asset ────────────────────────────────────
    const getLiveRateForCoin = (tab, coin) => {
        if (!liveRates || !liveRates[tab]) return null;

        if (tab === 'crypto') {
            const rawCrypto = liveRates.crypto || [];
            const coinCode = coin.code || coin.symbol || coin.id.replace('USDT', '').toUpperCase();
            const found = rawCrypto.find(c => {
                if (!c) return false;
                const cId = (c.id || '').toUpperCase();
                const cCode = (c.code || c.symbol || '').toUpperCase();
                
                if (cId && cId === coin.id.toUpperCase()) return true;
                if (cCode && cCode === coinCode) return true;
                
                const normLcwCode = cCode === '_SUI' ? 'SUI' : (cCode === '____PEPE' ? 'PEPE' : (cCode === 'TONCOIN' ? 'TON' : cCode));
                if (normLcwCode === coinCode) return true;
                
                return false;
            });

            if (found && found.rate !== undefined && found.rate !== null) {
                const rateVal = found.rate;
                if (typeof rateVal === 'number') {
                    return rateVal > 100
                        ? rateVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : rateVal.toFixed(6);
                } else if (typeof rateVal === 'string') {
                    if (rateVal.includes(',')) {
                        return rateVal;
                    }
                    const parsed = parseFloat(rateVal);
                    if (!isNaN(parsed)) {
                        return parsed > 100
                            ? parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : parsed.toFixed(6);
                    }
                    return rateVal;
                }
            }
        } else if (tab === 'forex') {
            const forexDoc = liveRates.forex;
            if (forexDoc) {
                const isMetalsApi = forexDoc.provider === 'metals.dev';
                const ratesObj = isMetalsApi ? forexDoc.rates : forexDoc.rates?.rates;
                if (ratesObj) {
                    const currency = coin.code || coin.id.replace('fx-', '').toUpperCase();
                    let rate = parseFloat(ratesObj[currency]);
                    if (rate && !isNaN(rate)) {
                        if (isMetalsApi) {
                            if (!coin.label || !coin.label.endsWith('/USD')) {
                                rate = 1 / rate;
                            }
                        } else {
                            if (coin.label && coin.label.endsWith('/USD')) {
                                rate = 1 / rate;
                            }
                        }
                        return rate.toFixed(6);
                    }
                }
            }
        } else if (tab === 'metals') {
            const labelLower = coin.label.toLowerCase();
            const cachedMetal = liveRates.metals || {};
            let price = null;
            if (labelLower.includes('gold') && cachedMetal.gold) price = cachedMetal.gold;
            else if (labelLower.includes('silver') && cachedMetal.silver) price = cachedMetal.silver;
            else if (labelLower.includes('platinum') && cachedMetal.platinum) price = cachedMetal.platinum;
            else if (labelLower.includes('palladium') && cachedMetal.palladium) price = cachedMetal.palladium;
            else if (labelLower.includes('copper') && cachedMetal.copper) price = cachedMetal.copper;
            else if (labelLower.includes('aluminum') && cachedMetal.aluminum) price = cachedMetal.aluminum;
            else if (labelLower.includes('zinc') && cachedMetal.zinc) price = cachedMetal.zinc;
            else if (labelLower.includes('nickel') && cachedMetal.nickel) price = cachedMetal.nickel;
            else if (labelLower.includes('lead') && cachedMetal.lead) price = cachedMetal.lead;

            if (!price) {
                // Try dynamic symbol lookup for custom metals (e.g. LME_COPPER/USD -> lme_copper)
                const cleanSymbol = coin.label.split('(')[0]?.trim()?.toLowerCase()?.replace('/usd', '');
                if (cleanSymbol && cachedMetal[cleanSymbol]) {
                    price = cachedMetal[cleanSymbol];
                }
            }

            if (price) {
                return price > 100
                    ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : price.toFixed(2);
            }
        }
        return null;
    };

    // ── Render ──────────────────────────────────────────────────────────
    if (loading) return (
        <div style={{ padding: '0 20px' }}>
            <div className="skeleton-loader" style={{ width: '280px', height: '35px', marginBottom: '30px' }} />
            <div style={{ display: 'flex', gap: '12px', marginBottom: '30px' }}>
                {[1,2,3].map(i => <div key={i} className="skeleton-loader" style={{ width: '140px', height: '44px', borderRadius: '12px' }} />)}
            </div>
            {[1,2,3].map(i => <div key={i} className="skeleton-loader" style={{ width: '100%', height: '80px', borderRadius: '14px', marginBottom: '14px' }} />)}
        </div>
    );

    const tabConfig = config[activeTab];
    const allCoins = getCoinsForTab(activeTab);
    const isCustomOn = tabConfig.useCustomPrice;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ width: '100%', padding: '0 20px', paddingBottom: '60px' }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h2 style={{
                        background: 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.75) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: '28px', fontWeight: '900', margin: '0 0 6px',
                        letterSpacing: '-0.5px'
                    }}>
                        Coins API Settings
                    </h2>
                    <p style={{ color: '#8a8a93', fontSize: '13px', margin: 0, fontWeight: '500' }}>
                        Manage price sources, sync intervals, custom rates and coin visibility per market category.
                    </p>
                </div>
                {/* Status Indicator */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 18px', borderRadius: '30px',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    fontSize: '12px', fontWeight: '800', color: '#fff',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <motion.span
                        animate={{ opacity: [1, 0.4, 1], scale: [1, 1.15, 1] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            backgroundColor: isCustomOn ? '#f0b90b' : '#00c087',
                            boxShadow: `0 0 12px ${isCustomOn ? '#f0b90b' : '#00c087'}`,
                            display: 'inline-block'
                        }}
                    />
                    {isCustomOn ? 'Custom Price Override' : 'API Sync Active'}
                </div>
            </div>

            {/* Tab Switcher */}
            <div style={{
                display: 'inline-flex',
                gap: '6px',
                marginBottom: '36px',
                flexWrap: 'wrap',
                background: 'rgba(255,255,255,0.02)',
                padding: '5px',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.04)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                width: 'fit-content'
            }}>
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <motion.button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setExpandRates(false); }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '11px 22px', borderRadius: '12px',
                                fontWeight: '800', fontSize: '13px', cursor: 'pointer',
                                background: isActive ? `linear-gradient(135deg, rgba(${hexToRgb(tab.color)}, 0.15) 0%, rgba(${hexToRgb(tab.color)}, 0.04) 100%)` : 'transparent',
                                color: isActive ? tab.color : '#8a8a93',
                                border: isActive ? `1px solid rgba(${hexToRgb(tab.color)}, 0.25)` : '1px solid transparent',
                                transition: 'all 0.2s ease',
                                boxShadow: isActive ? `0 4px 15px rgba(${hexToRgb(tab.color)}, 0.12)` : 'none',
                            }}
                        >
                            <Icon size={15} style={{ filter: isActive ? `drop-shadow(0 0 4px ${tab.color})` : 'none' }} />
                            {tab.label}
                        </motion.button>
                    );
                })}
            </div>

            {/* Two-Column Responsive Layout Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
                gap: '24px',
                alignItems: 'start'
            }}>
                {/* ── LEFT COLUMN: Configuration & Adding Assets ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Price Source Card */}
                    <SectionCard title="Price Source" accentColor={accentColor}>
                        <Toggle
                            checked={isCustomOn}
                            onChange={() => toggleCustomPrice(activeTab)}
                            accentColor={accentColor}
                            label="Use Custom Price"
                            description={
                                isCustomOn
                                    ? '✅ Custom mode ON — rates are served from database only, no API calls'
                                    : '🌐 API mode ON — rates are fetched from live API based on sync interval'
                            }
                        />
                        {isCustomOn && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    marginTop: '14px',
                                    padding: '14px 18px',
                                    background: `linear-gradient(135deg, rgba(${hexToRgb(accentColor)}, 0.08) 0%, rgba(${hexToRgb(accentColor)}, 0.02) 100%)`,
                                    borderRadius: '12px',
                                    border: `1px solid rgba(${hexToRgb(accentColor)}, 0.15)`,
                                    fontSize: '12px', color: '#a0a0ab',
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    boxShadow: `0 4px 20px rgba(${hexToRgb(accentColor)}, 0.05)`,
                                }}
                            >
                                <AlertCircle size={15} color={accentColor} style={{ flexShrink: 0 }} />
                                <span>API sync is disabled. Even if sync time has passed, only DB custom rates will be shown to clients.</span>
                            </motion.div>
                        )}
                    </SectionCard>

                    {/* Sync Interval Card */}
                    <SectionCard title="Sync Interval" accentColor={accentColor} style={{ opacity: isCustomOn ? 0.4 : 1 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'end' }}>
                            <div>
                                <label style={labelStyle}>Sync Every (seconds)</label>
                                <div style={{ position: 'relative' }}>
                                    <Clock size={14} color="#666" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                    <input
                                        type="number"
                                        min="60"
                                        value={localIntervals[activeTab] ?? tabConfig.syncIntervalSeconds}
                                        onChange={e => setLocalIntervals(prev => ({ ...prev, [activeTab]: e.target.value }))}
                                        disabled={isCustomOn}
                                        style={{
                                            ...inputStyle,
                                            paddingLeft: '36px',
                                            fontFamily: 'monospace',
                                            borderColor: focusedInputId === 'interval' ? accentColor : 'rgba(255,255,255,0.05)',
                                            boxShadow: focusedInputId === 'interval' ? `0 0 14px rgba(${hexToRgb(accentColor)}, 0.2)` : 'none',
                                            background: focusedInputId === 'interval' ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.20)',
                                        }}
                                        onFocus={() => setFocusedInputId('interval')}
                                        onBlur={() => setFocusedInputId(null)}
                                        placeholder="e.g. 1800"
                                    />
                                </div>
                                <div style={{ fontSize: '11px', color: '#777', marginTop: '8px' }}>
                                    = <span style={{ color: '#fff', fontWeight: '800' }}>{secondsToHuman(localIntervals[activeTab] || tabConfig.syncIntervalSeconds)}</span>
                                    &nbsp;|&nbsp; Minimum: 60s
                                    &nbsp;|&nbsp; Last sync: <span style={{ color: accentColor, fontWeight: '800' }}>{timeAgo(tabConfig.lastSyncedAt)}</span>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => saveTabConfig(activeTab)}
                                disabled={saving === activeTab || isCustomOn}
                                style={{
                                    ...actionBtnStyle,
                                    background: isCustomOn ? 'rgba(255,255,255,0.02)' : `linear-gradient(135deg, ${accentColor} 0%, rgba(${hexToRgb(accentColor)}, 0.8) 100%)`,
                                    color: '#000',
                                    fontWeight: '800',
                                    boxShadow: isCustomOn ? 'none' : `0 4px 15px rgba(${hexToRgb(accentColor)}, 0.3)`,
                                    minWidth: '90px'
                                }}
                            >
                                {saving === activeTab ? <Loader2 size={15} className="animate-spin" /> : <><Save size={14} /> Save</>}
                            </motion.button>
                        </div>

                        {/* Force Sync */}
                        <div style={{
                            marginTop: '20px',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '14px 18px',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)',
                            borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)',
                        }}>
                            <div>
                                <div style={{ color: '#fff', fontSize: '13px', fontWeight: '800' }}>Force Sync Now</div>
                                <div style={{ color: '#888', fontSize: '11px', marginTop: '2px' }}>
                                    Bypass time check — immediately fetch from API &amp; store to DB
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => forceSyncNow(activeTab)}
                                disabled={syncing === activeTab || isCustomOn}
                                style={{ ...actionBtnStyle, background: 'rgba(255,255,255,0.04)', color: '#ccc', border: '1px solid rgba(255,255,255,0.08)' }}
                            >
                                {syncing === activeTab
                                    ? <><Loader2 size={14} className="animate-spin" /> Syncing</>
                                    : <><RefreshCw size={14} /> Sync</>
                                }
                            </motion.button>
                        </div>
                    </SectionCard>

                    {/* Add Custom Asset Card */}
                    <SectionCard title="Add Custom Asset" accentColor={accentColor}>
                        {/* Guidance panel */}
                        <div style={{
                            marginBottom: '20px',
                            padding: '16px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)',
                            border: '1px solid rgba(255,255,255,0.04)',
                            borderLeft: `3px solid ${accentColor}`,
                        }}>
                            <div style={{ color: '#fff', fontSize: '13px', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <AlertCircle size={14} color={accentColor} />
                                {activeTab === 'crypto' && 'How to add Cryptocurrency:'}
                                {activeTab === 'forex' && 'How to add Foreign Exchange Currency:'}
                                {activeTab === 'metals' && 'How to add Precious Metal/Commodity:'}
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '18px', color: '#a0a0ab', fontSize: '12px', lineHeight: '1.7' }}>
                                {activeTab === 'crypto' && (
                                    <>
                                        <li>Go to <a href="https://livecoinwatch.com" target="_blank" rel="noreferrer" style={{ color: accentColor, textDecoration: 'underline', fontWeight: '700' }}>livecoinwatch.com</a>.</li>
                                        <li>Search for your target coin (e.g. <strong>BNB</strong>, <strong>FET</strong>, <strong>RENDER</strong>).</li>
                                        <li>Copy the bold ticker code and enter it below (e.g. <code>BNB</code>).</li>
                                        <li style={{ color: '#777' }}>Note: System automatically fetches its live icon and rate.</li>
                                    </>
                                )}
                                {activeTab === 'forex' && (
                                    <>
                                        <li>Use standard <strong>ISO 4217</strong> 3-letter currency codes (e.g. <code>SGD</code>, <code>MXN</code>, <code>CAD</code>).</li>
                                        <li>Check codes at <a href="https://xe.com" target="_blank" rel="noreferrer" style={{ color: accentColor, textDecoration: 'underline', fontWeight: '700' }}>xe.com</a> if needed.</li>
                                        <li><strong>API &amp; Rates Documentation</strong>:
                                            <ul style={{ paddingLeft: '15px', marginTop: '6px', color: '#888' }}>
                                                <li>Rates are fetched and synced from the <a href="https://metals.dev" target="_blank" rel="noreferrer" style={{ color: accentColor, fontWeight: 'bold' }}>metals.dev</a> API.</li>
                                                <li><strong>Inversion Math Rules</strong>:
                                                    <ul style={{ paddingLeft: '12px', marginTop: '4px' }}>
                                                        <li>For pairs ending with <code>/USD</code> (e.g., <code>GBP/USD</code>, <code>EUR/USD</code>), the API rate is used directly.</li>
                                                        <li>For pairs starting with <code>USD/</code> (e.g., <code>USD/JPY</code>, <code>USD/CAD</code>), the system automatically uses the inverted formula: <code>1 / rate</code>.</li>
                                                    </ul>
                                                </li>
                                                <li>This ensures client-side prices render exactly in standard market formats (e.g., 1 GBP = $1.34 USD, 1 USD = 159.87 JPY).</li>
                                            </ul>
                                        </li>
                                    </>
                                )}
                                {activeTab === 'metals' && (
                                    <>
                                        <li>Enter the symbol and display name separated by <code>|</code>.</li>
                                        <li>Format: <code>SYMBOL|Full Name</code> (e.g. <code>LME_COPPER/USD|LME Copper</code> or <code>LBMA_GOLD_AM/USD|LBMA Gold AM</code>).</li>
                                        <li>You can check supported live metal codes at <a href="https://metals.dev" target="_blank" rel="noreferrer" style={{ color: accentColor, textDecoration: 'underline', fontWeight: '700' }}>metals.dev</a>.</li>
                                        <li>Valid auto-syncing symbols: <code>gold</code>, <code>silver</code>, <code>platinum</code>, <code>palladium</code>, <code>copper</code>, <code>aluminum</code>, <code>lead</code>, <code>nickel</code>, <code>zinc</code>, <code>lme_copper</code>, <code>lme_aluminum</code>, <code>lme_lead</code>, <code>lme_nickel</code>, <code>lme_zinc</code>, <code>lbma_gold_am</code>, <code>lbma_gold_pm</code>, etc.</li>
                                        <li style={{ color: '#777' }}>Note: Custom commodities not supported by the API will default to 0.00 until you specify a Custom Rate.</li>
                                    </>
                                )}
                            </ul>
                        </div>

                        {/* Add Input section */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={labelStyle}>Add New Asset</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
                                <input
                                    type="text"
                                    value={newCoinCode}
                                    onChange={e => setNewCoinCode(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addCoin()}
                                    placeholder={
                                        activeTab === 'crypto'
                                            ? "e.g. BNB, FET, RENDER"
                                            : activeTab === 'forex'
                                            ? "e.g. SGD, MXN, ZAR"
                                            : "e.g. IRON/USD|Iron Ore"
                                    }
                                    style={{
                                        ...inputStyle,
                                        borderColor: focusedInputId === 'add-asset' ? accentColor : 'rgba(255,255,255,0.05)',
                                        boxShadow: focusedInputId === 'add-asset' ? `0 0 14px rgba(${hexToRgb(accentColor)}, 0.2)` : 'none',
                                        background: focusedInputId === 'add-asset' ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.20)',
                                    }}
                                    onFocus={() => setFocusedInputId('add-asset')}
                                    onBlur={() => setFocusedInputId(null)}
                                />
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={addCoin}
                                    disabled={addingCoin}
                                    style={{
                                        ...actionBtnStyle,
                                        background: `linear-gradient(135deg, ${accentColor} 0%, rgba(${hexToRgb(accentColor)}, 0.8) 100%)`,
                                        color: '#000',
                                        fontWeight: '800',
                                        boxShadow: `0 4px 15px rgba(${hexToRgb(accentColor)}, 0.25)`,
                                        padding: '0 20px'
                                    }}
                                >
                                    {addingCoin ? <Loader2 size={15} className="animate-spin" /> : <><Plus size={14} /> Add</>}
                                </motion.button>
                            </div>
                        </div>

                        {/* Added custom assets badges list */}
                        {(() => {
                            const currentExtras =
                                activeTab === 'crypto'
                                    ? (extraCoins.crypto || [])
                                    : activeTab === 'forex'
                                    ? (extraCoins.forex || [])
                                    : (extraCoins.metals || []);

                            if (currentExtras.length === 0) return null;

                            return (
                                <div>
                                    <div style={{ fontSize: '11px', color: '#8a8a93', marginBottom: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                        Added Custom Assets ({currentExtras.length})
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {currentExtras.map(item => {
                                            const displayLabel = activeTab === 'metals' ? item.split('|')[0] : item;
                                            const titleTip = activeTab === 'metals' ? item.split('|')[1] : '';
                                            return (
                                                <motion.div
                                                    key={item}
                                                    title={titleTip}
                                                    whileHover={{ scale: 1.03 }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '8px',
                                                        padding: '8px 14px',
                                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                                                        borderRadius: '12px',
                                                        border: '1px solid rgba(255,255,255,0.05)',
                                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                                                        transition: 'border-color 0.2s',
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.borderColor = `rgba(${hexToRgb(accentColor)}, 0.3)`; }}
                                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
                                                >
                                                    <span style={{ color: '#fff', fontSize: '13px', fontWeight: '700' }}>
                                                        {displayLabel}
                                                        {titleTip && <span style={{ color: '#777', fontWeight: 'normal', fontSize: '11px', marginLeft: '6px' }}>({titleTip})</span>}
                                                    </span>
                                                    <button
                                                        onClick={() => removeCoin(item)}
                                                        style={{
                                                            background: 'none', border: 'none', color: '#ff4d4f',
                                                            cursor: 'pointer', display: 'flex', padding: '0',
                                                            opacity: 0.7, transition: 'opacity 0.2s'
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.opacity = 1; }}
                                                        onMouseLeave={e => { e.currentTarget.style.opacity = 0.7; }}
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}
                    </SectionCard>
                </div>

                {/* ── RIGHT COLUMN: Price Customization & Visibility Manager ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Custom Rates Editor (Visible only when toggle ON) */}
                    <AnimatePresence>
                        {isCustomOn && (
                            <motion.div
                                key="custom-rates"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 15 }}
                                style={{ width: '100%' }}
                            >
                                <SectionCard
                                    title={`Custom Rates (${tabInfo?.label})`}
                                    accentColor={accentColor}
                                    headerRight={
                                        <button
                                            onClick={() => setExpandRates(p => !p)}
                                            style={{
                                                background: 'rgba(255,255,255,0.02)',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                borderRadius: '8px',
                                                padding: '6px 12px',
                                                color: '#8a8a93',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '12px',
                                                fontWeight: '700',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                                e.currentTarget.style.color = '#fff';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                                e.currentTarget.style.color = '#8a8a93';
                                            }}
                                        >
                                            {expandRates ? 'Collapse' : 'Expand All'}
                                            <ChevronDown size={14} style={{ transform: expandRates ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                        </button>
                                    }
                                >
                                    <p style={{ fontSize: '12px', color: '#8a8a93', marginBottom: '20px', marginTop: 0, fontWeight: '500' }}>
                                        Set custom rates for each coin. These will override API data while custom mode is ON.
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                                        {(expandRates ? allCoins : allCoins.slice(0, 6)).map(coin => {
                                            const savedRate = customRates[activeTab]?.[coin.id] || '';
                                            const localRate = localRates[coin.id] !== undefined ? localRates[coin.id] : savedRate;
                                            const isSaving = saving === coin.id;
                                            return (
                                                <div key={coin.id} style={{
                                                    display: 'grid', gridTemplateColumns: '1fr 140px auto',
                                                    gap: '12px', alignItems: 'center',
                                                    padding: '10px 14px',
                                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.015) 0%, rgba(255,255,255,0.005) 100%)',
                                                    border: '1px solid rgba(255,255,255,0.03)',
                                                    borderRadius: '12px',
                                                    transition: 'border-color 0.2s',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)'; }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ position: 'relative', display: 'flex' }}>
                                                            <img
                                                                src={coin.icon}
                                                                alt={coin.label}
                                                                style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)' }}
                                                                onError={e => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/25/25254.png'; }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div style={{ color: '#fff', fontSize: '13px', fontWeight: '800' }}>{coin.label}</div>
                                                            <div style={{ display: 'flex', gap: '8px', fontSize: '10px', marginTop: '3px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                                {savedRate && (
                                                                    <span style={{
                                                                        padding: '2px 6px',
                                                                        borderRadius: '4px',
                                                                        background: `rgba(${hexToRgb(accentColor)}, 0.1)`,
                                                                        border: `1px solid rgba(${hexToRgb(accentColor)}, 0.15)`,
                                                                        color: accentColor,
                                                                        fontWeight: '700'
                                                                    }}>
                                                                        Saved: {savedRate}
                                                                    </span>
                                                                )}
                                                                <span style={{ color: '#666', fontWeight: '500' }}>
                                                                    API: <strong style={{ color: '#aaa' }}>${getLiveRateForCoin(activeTab, coin) || 'N/A'}</strong>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ position: 'relative' }}>
                                                        <DollarSign size={11} color="#666" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            value={localRate}
                                                            onChange={e => setLocalRates(prev => ({ ...prev, [coin.id]: e.target.value }))}
                                                            placeholder="0.00"
                                                            style={{
                                                                ...inputStyle,
                                                                paddingLeft: '24px',
                                                                fontSize: '13px',
                                                                height: '38px',
                                                                borderColor: focusedInputId === coin.id ? accentColor : 'rgba(255,255,255,0.05)',
                                                                boxShadow: focusedInputId === coin.id ? `0 0 10px rgba(${hexToRgb(accentColor)}, 0.15)` : 'none',
                                                                background: focusedInputId === coin.id ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.20)',
                                                            }}
                                                            onFocus={() => setFocusedInputId(coin.id)}
                                                            onBlur={() => setFocusedInputId(null)}
                                                        />
                                                    </div>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => saveCustomRate(activeTab, coin.id)}
                                                        disabled={isSaving}
                                                        style={{
                                                            ...actionBtnStyle,
                                                            background: `linear-gradient(135deg, rgba(${hexToRgb(accentColor)}, 0.15) 0%, rgba(${hexToRgb(accentColor)}, 0.05) 100%)`,
                                                            border: `1px solid rgba(${hexToRgb(accentColor)}, 0.25)`,
                                                            color: accentColor,
                                                            height: '38px',
                                                            padding: '0 14px',
                                                            boxShadow: `0 2px 8px rgba(${hexToRgb(accentColor)}, 0.08)`
                                                        }}
                                                    >
                                                        {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                                    </motion.button>
                                                </div>
                                            );
                                        })}
                                        {!expandRates && allCoins.length > 6 && (
                                            <button
                                                onClick={() => setExpandRates(true)}
                                                style={{
                                                    background: 'rgba(255,255,255,0.01)',
                                                    border: '1px dashed rgba(255,255,255,0.08)',
                                                    borderRadius: '12px',
                                                    padding: '12px',
                                                    color: '#8a8a93',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    fontWeight: '700',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.borderColor = `rgba(${hexToRgb(accentColor)}, 0.3)`;
                                                    e.currentTarget.style.color = '#fff';
                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                                    e.currentTarget.style.color = '#8a8a93';
                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
                                                }}
                                            >
                                                + Show {allCoins.length - 6} more coins
                                            </button>
                                        )}
                                    </div>
                                </SectionCard>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Assets Visibility Manager */}
                    <SectionCard title="Assets Visibility" accentColor={accentColor}>
                        <label style={labelStyle}>Show / Hide Assets on Client</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '550px', overflowY: 'auto', paddingRight: '4px' }}>
                            {allCoins.map(coin => {
                                const isVisible = visibility[coin.id] !== false;
                                return (
                                    <div key={coin.id} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '14px 18px',
                                        background: isVisible 
                                            ? 'linear-gradient(135deg, rgba(255,255,255,0.015) 0%, rgba(255,255,255,0.005) 100%)' 
                                            : 'linear-gradient(135deg, rgba(255, 77, 79, 0.03) 0%, rgba(255, 77, 79, 0.008) 100%)',
                                        borderRadius: '14px',
                                        border: `1px solid ${isVisible ? 'rgba(255,255,255,0.03)' : 'rgba(255, 77, 79, 0.12)'}`,
                                        transition: 'border-color 0.2s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = isVisible ? 'rgba(255,255,255,0.08)' : 'rgba(255, 77, 79, 0.2)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = isVisible ? 'rgba(255,255,255,0.03)' : 'rgba(255, 77, 79, 0.12)'; }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                                            <img
                                                src={coin.icon}
                                                alt={coin.label}
                                                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}
                                                onError={e => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/25/25254.png'; }}
                                            />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                {editingNameId === coin.id ? (
                                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            value={tempName}
                                                            onChange={e => setTempName(e.target.value)}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter') saveCustomName(coin.id, tempName, activeTab);
                                                                if (e.key === 'Escape') { setEditingNameId(null); setTempName(''); }
                                                            }}
                                                            placeholder={coin.label}
                                                            style={{
                                                                background: 'rgba(0,0,0,0.35)',
                                                                border: `1px solid rgba(${hexToRgb(accentColor)},0.4)`,
                                                                borderRadius: '8px',
                                                                padding: '5px 10px',
                                                                color: '#fff',
                                                                fontSize: '13px',
                                                                fontWeight: '700',
                                                                outline: 'none',
                                                                width: '160px',
                                                                boxShadow: `0 0 8px rgba(${hexToRgb(accentColor)},0.15)`,
                                                            }}
                                                        />
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                            onClick={() => saveCustomName(coin.id, tempName, activeTab)}
                                                            title="Save name"
                                                            style={{
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                width: '30px', height: '30px', borderRadius: '8px',
                                                                background: `rgba(${hexToRgb(accentColor)},0.15)`,
                                                                border: `1px solid rgba(${hexToRgb(accentColor)},0.3)`,
                                                                color: accentColor, cursor: 'pointer',
                                                            }}
                                                        ><Save size={13} /></motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                            onClick={() => { setEditingNameId(null); setTempName(''); }}
                                                            title="Cancel"
                                                            style={{
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                width: '30px', height: '30px', borderRadius: '8px',
                                                                background: 'rgba(255,77,79,0.1)',
                                                                border: '1px solid rgba(255,77,79,0.2)',
                                                                color: '#ff4d4f', cursor: 'pointer',
                                                            }}
                                                        ><X size={13} /></motion.button>
                                                        {customNames[activeTab]?.[coin.id] && (
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                                onClick={() => saveCustomName(coin.id, '', activeTab)}
                                                                title="Reset to default name"
                                                                style={{
                                                                    fontSize: '10px', padding: '4px 8px', borderRadius: '6px',
                                                                    background: 'rgba(255,255,255,0.04)',
                                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                                    color: '#888', cursor: 'pointer', fontWeight: '700',
                                                                }}
                                                            >Reset</motion.button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <div style={{ color: isVisible ? '#fff' : '#666', fontSize: '13px', fontWeight: '800' }}>
                                                            {customNames[activeTab]?.[coin.id] || coin.label}
                                                        </div>
                                                        {customNames[activeTab]?.[coin.id] && (
                                                            <span style={{
                                                                fontSize: '9px', padding: '1px 5px', borderRadius: '4px',
                                                                background: `rgba(${hexToRgb(accentColor)},0.12)`,
                                                                border: `1px solid rgba(${hexToRgb(accentColor)},0.2)`,
                                                                color: accentColor, fontWeight: '700',
                                                            }}>custom</span>
                                                        )}
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                                            onClick={() => { setEditingNameId(coin.id); setTempName(customNames[activeTab]?.[coin.id] || ''); }}
                                                            title="Edit display name"
                                                            style={{
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                width: '22px', height: '22px', borderRadius: '6px',
                                                                background: 'rgba(255,255,255,0.04)',
                                                                border: '1px solid rgba(255,255,255,0.08)',
                                                                color: '#777', cursor: 'pointer',
                                                                padding: 0,
                                                            }}
                                                        ><Pencil size={11} /></motion.button>
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '3px' }}>
                                                    <span style={{
                                                        fontSize: '10px',
                                                        color: isVisible ? '#00c087' : '#ff4d4f',
                                                        fontWeight: '700',
                                                        background: isVisible ? 'rgba(0,192,135,0.08)' : 'rgba(255,77,79,0.08)',
                                                        padding: '1px 6px',
                                                        borderRadius: '4px',
                                                        border: `1px solid ${isVisible ? 'rgba(0,192,135,0.12)' : 'rgba(255,77,79,0.12)'}`
                                                    }}>
                                                        {isVisible ? 'Visible to clients' : 'Hidden from clients'}
                                                    </span>
                                                    <span style={{ fontSize: '10px', color: '#555', fontWeight: '500' }}>
                                                        Rate: <strong style={{ color: '#aaa' }}>${getLiveRateForCoin(activeTab, coin) || 'N/A'}</strong>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <motion.button
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => toggleVisibility(coin.id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    padding: '8px 16px', borderRadius: '10px',
                                                    background: isVisible 
                                                        ? 'linear-gradient(135deg, rgba(0, 192, 135, 0.15) 0%, rgba(0, 192, 135, 0.05) 100%)'
                                                        : 'linear-gradient(135deg, rgba(255, 77, 79, 0.15) 0%, rgba(255, 77, 79, 0.05) 100%)',
                                                    border: `1px solid ${isVisible ? 'rgba(0, 192, 135, 0.25)' : 'rgba(255, 77, 79, 0.25)'}`,
                                                    color: isVisible ? '#00c087' : '#ff4d4f',
                                                    cursor: 'pointer', fontWeight: '800', fontSize: '12px',
                                                    boxShadow: `0 2px 8px ${isVisible ? 'rgba(0, 192, 135, 0.05)' : 'rgba(255, 77, 79, 0.05)'}`,
                                                }}
                                            >
                                                {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                                                <span>{isVisible ? 'Show' : 'Hide'}</span>
                                            </motion.button>

                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => removeCoin(coin)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    width: '34px', height: '34px', borderRadius: '10px',
                                                    background: 'linear-gradient(135deg, rgba(255, 77, 79, 0.15) 0%, rgba(255, 77, 79, 0.05) 100%)',
                                                    border: '1px solid rgba(255, 77, 79, 0.25)',
                                                    color: '#ff4d4f',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 2px 8px rgba(255, 77, 79, 0.05)',
                                                }}
                                                title="Delete asset"
                                            >
                                                <Trash2 size={14} />
                                            </motion.button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Deleted Default Assets restore section */}
                        {(() => {
                            const tabDefaults = DEFAULT_COINS[activeTab] || [];
                            const tabDeletedCoins = (extraCoins.deletedCoins[activeTab] || [])
                                .filter(coinId => tabDefaults.some(c => c.id === coinId));

                            if (tabDeletedCoins.length === 0) return null;

                            return (
                                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: '11px', color: '#777', marginBottom: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                        Deleted Default Assets ({tabDeletedCoins.length})
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {tabDeletedCoins.map(coinId => {
                                            const found = tabDefaults.find(c => c.id === coinId);
                                            const label = found ? found.label : coinId;
                                            return (
                                                <div key={coinId} style={{
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    padding: '8px 12px', background: 'rgba(255,77,79,0.02)',
                                                    borderRadius: '10px', border: '1px dashed rgba(255,77,79,0.15)'
                                                }}>
                                                    <span style={{ color: '#888', fontSize: '13px', fontWeight: '700' }}>{label}</span>
                                                    <motion.button
                                                        whileHover={{ scale: 1.03 }}
                                                        whileTap={{ scale: 0.97 }}
                                                        onClick={() => restoreCoin(coinId)}
                                                        style={{
                                                            padding: '6px 12px', borderRadius: '8px', border: 'none',
                                                            background: `linear-gradient(135deg, rgba(${hexToRgb(accentColor)}, 0.15) 0%, rgba(${hexToRgb(accentColor)}, 0.05) 100%)`,
                                                            color: accentColor, fontWeight: '800', fontSize: '11px', cursor: 'pointer'
                                                        }}
                                                    >
                                                        Restore
                                                    </motion.button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}
                    </SectionCard>
                </div>
            </div>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        key="toast"
                        initial={{ y: 60, opacity: 0, x: '-50%' }}
                        animate={{ y: 0, opacity: 1, x: '-50%' }}
                        exit={{ y: 60, opacity: 0, x: '-50%' }}
                        style={{
                            position: 'fixed', bottom: '80px', left: '50%',
                            background: toast.type === 'success' 
                                ? 'linear-gradient(135deg, rgba(0, 192, 135, 0.9) 0%, rgba(0, 160, 110, 0.9) 100%)' 
                                : 'linear-gradient(135deg, rgba(255, 77, 79, 0.9) 0%, rgba(230, 50, 50, 0.9) 100%)',
                            border: `1px solid ${toast.type === 'success' ? 'rgba(0, 192, 135, 0.2)' : 'rgba(255, 77, 79, 0.2)'}`,
                            color: '#fff', padding: '14px 24px', borderRadius: '30px',
                            fontWeight: '800', fontSize: '13px',
                            display: 'flex', alignItems: 'center', gap: '10px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(8px)',
                            zIndex: 9999, whiteSpace: 'nowrap',
                        }}
                    >
                        {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ─── Section Card Wrapper ──────────────────────────────────────────────────
const SectionCard = ({ title, children, accentColor = '#00c087', style = {}, headerRight }) => (
    <div style={{
        background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.4) 0%, rgba(10, 10, 10, 0.2) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.04)',
        borderTop: `3px solid ${accentColor}`,
        borderRadius: '20px',
        padding: '24px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        marginBottom: '20px',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        ...style,
    }}>
        {/* Subtle backing glow */}
        <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: accentColor,
            filter: 'blur(50px)',
            opacity: 0.08,
            pointerEvents: 'none',
        }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
            <h3 style={{
                color: '#fff',
                fontSize: '14px', fontWeight: '800',
                textTransform: 'uppercase', letterSpacing: '0.8px',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: accentColor }} />
                {title}
            </h3>
            {headerRight}
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
            {children}
        </div>
    </div>
);

// ─── Styles ────────────────────────────────────────────────────────────────
const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    color: '#fff',
    outline: 'none',
    fontSize: '14px',
    boxSizing: 'border-box',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
};

const labelStyle = {
    display: 'block',
    fontSize: '11px', color: '#8a8a93',
    fontWeight: '800', textTransform: 'uppercase',
    marginBottom: '8px', letterSpacing: '0.8px',
};

const actionBtnStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    padding: '10px 18px', border: 'none', borderRadius: '12px',
    fontWeight: '700', fontSize: '13px', cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', whiteSpace: 'nowrap',
};

export default AdminCoinsSettings;
