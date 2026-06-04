import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase-setup';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    RefreshCw, Save, Loader2, ToggleLeft, ToggleRight,
    Clock, DollarSign, Eye, EyeOff, Plus, Trash2,
    CheckCircle2, AlertCircle, Bitcoin, TrendingUp, Gem, ChevronDown
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
        { id: 'metal-3',  label: 'WTI/USD (Crude Oil)',icon: 'https://img.icons8.com/color/96/oil-industry.png' },
        { id: 'metal-4',  label: 'XPT/USD (Platinum)', icon: 'https://img.icons8.com/color/96/silver-bars.png' },
        { id: 'metal-5',  label: 'XPD/USD (Palladium)',icon: 'https://img.icons8.com/color/96/silver-bars.png' },
        { id: 'metal-6',  label: 'XCU/USD (Copper)',   icon: 'https://img.icons8.com/color/96/copper-ingot.png' },
        { id: 'metal-7',  label: 'ALU/USD (Aluminum)', icon: 'https://img.icons8.com/color/96/aluminum-ingot.png' },
        { id: 'metal-8',  label: 'NG/USD (Nat Gas)',   icon: 'https://img.icons8.com/color/96/natural-gas.png' },
        { id: 'metal-9',  label: 'ZNC/USD (Zinc)',     icon: 'https://img.icons8.com/color/96/steel-ingot.png' },
        { id: 'metal-10', label: 'NKL/USD (Nickel)',   icon: 'https://img.icons8.com/color/96/steel-ingot.png' },
        { id: 'metal-11', label: 'LD/USD (Lead)',      icon: 'https://img.icons8.com/color/96/steel-ingot.png' },
        { id: 'metal-12', label: 'BRENT/USD (Brent)',  icon: 'https://img.icons8.com/color/96/oil-industry.png' },
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
        background: checked ? `rgba(${hexToRgb(accentColor)}, 0.06)` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${checked ? `rgba(${hexToRgb(accentColor)}, 0.25)` : '#1e1e1e'}`,
        borderRadius: '14px',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        userSelect: 'none',
    }} onClick={onChange}>
        <div>
            <div style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>{label}</div>
            {description && <div style={{ color: '#555', fontSize: '11px', marginTop: '3px' }}>{description}</div>}
        </div>
        <div style={{
            width: '50px', height: '26px', borderRadius: '13px',
            background: checked ? accentColor : '#2a2a2a',
            position: 'relative', transition: 'background 0.3s',
            flexShrink: 0, border: `1px solid ${checked ? accentColor : '#333'}`,
        }}>
            <div style={{
                position: 'absolute', top: '3px',
                left: checked ? '26px' : '3px',
                width: '18px', height: '18px', borderRadius: '50%',
                background: '#fff', transition: 'left 0.3s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
            }} />
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
    const [extraCoins, setExtraCoins]         = useState({ crypto: [], forex: [], metals: [] });
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

    const tabInfo = TABS.find(t => t.id === activeTab);
    const accentColor = tabInfo?.color || '#00c087';

    // ── Fetch all data ──────────────────────────────────────────────────
    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [cfgSnap, ratesSnap, visSnap, listSnap, liveRatesSnap] = await Promise.all([
                getDoc(doc(db, 'admin_set', 'coins_config')),
                getDoc(doc(db, 'admin_set', 'coins_custom_rates')),
                getDoc(doc(db, 'admin_set', 'coins_visibility')),
                getDoc(doc(db, 'admin_set', 'coins_list')),
                getDoc(doc(db, 'admin_set', 'coins_rates')),
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
            if (liveRatesSnap.exists()) setLiveRates(liveRatesSnap.data());
            if (listSnap.exists()) {
                const d = listSnap.data();
                setExtraCoins({
                    crypto: d.crypto || d.extraCoins || [],
                    forex: d.forex || [],
                    metals: d.metals || [],
                });
            } else {
                setExtraCoins({ crypto: [], forex: [], metals: [] });
            }
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
                const res = await fetch('https://api.livecoinwatch.com/coins/map', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json', 'x-api-key': LIVECOINWATCH_KEY },
                    body: JSON.stringify({ codes, currency: 'USD', sort: 'rank', order: 'ascending', offset: 0, limit: 0, meta: true }),
                });
                if (!res.ok) throw new Error('LiveCoinWatch API error: ' + res.status);
                freshData = await res.json();
            } else if (tab === 'forex') {
                const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
                if (!res.ok) throw new Error('ExchangeRate API error');
                freshData = await res.json();
            } else if (tab === 'metals') {
                freshData = { synced: true, note: 'Metals data synced from cache' };
            }

            // Store to DB
            const cachedSnap = await getDoc(doc(db, 'admin_set', 'coins_rates'));
            const existing = cachedSnap.exists() ? cachedSnap.data() : {};
            const nextLiveRates = {
                ...existing,
                [tab]: freshData,
                [`${tab}SyncedAt`]: now,
            };
            await setDoc(doc(db, 'admin_set', 'coins_rates'), nextLiveRates);
            setLiveRates(nextLiveRates);

            // Update lastSyncedAt in config
            const newCfg = { ...config, [tab]: { ...config[tab], lastSyncedAt: now } };
            await setDoc(doc(db, 'admin_set', 'coins_config'), newCfg);
            setConfig(newCfg);

            showToast('success', `${tabInfo?.label} synced successfully!`);
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
                // Verify with LiveCoinWatch
                const res = await fetch('https://api.livecoinwatch.com/coins/map', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json', 'x-api-key': LIVECOINWATCH_KEY },
                    body: JSON.stringify({ codes: [code], currency: 'USD', sort: 'rank', order: 'ascending', offset: 0, limit: 0, meta: true }),
                });
                const data = await res.json();
                if (!Array.isArray(data) || data.length === 0) {
                    throw new Error(`Coin "${code}" not found on LiveCoinWatch.`);
                }
                const updatedCrypto = [...(extraCoins.crypto || []), code];
                const updatedList = {
                    ...extraCoins,
                    crypto: updatedCrypto,
                    extraCoins: updatedCrypto, // backward compatibility
                };
                await setDoc(doc(db, 'admin_set', 'coins_list'), updatedList);
                setExtraCoins(updatedList);
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
                // Verify with ExchangeRate API
                const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
                if (!res.ok) throw new Error('Failed to verify with ExchangeRate API');
                const data = await res.json();
                if (!data.rates || !data.rates[code]) {
                    throw new Error(`Currency code "${code}" not supported by API.`);
                }
                const updatedForex = [...(extraCoins.forex || []), code];
                const updatedList = {
                    ...extraCoins,
                    forex: updatedForex,
                };
                await setDoc(doc(db, 'admin_set', 'coins_list'), updatedList);
                setExtraCoins(updatedList);
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
                const updatedList = {
                    ...extraCoins,
                    metals: updatedMetals,
                };
                await setDoc(doc(db, 'admin_set', 'coins_list'), updatedList);
                setExtraCoins(updatedList);
                setNewCoinCode('');
                showToast('success', `${symbol} added successfully!`);
            }
        } catch (err) {
            showToast('error', err.message);
        } finally {
            setAddingCoin(false);
        }
    };

    // ── Remove extra coin ────────────────────────────────────────────────
    const removeCoin = async (itemToRemove) => {
        let updatedList = { ...extraCoins };
        if (activeTab === 'crypto') {
            const updatedCrypto = (extraCoins.crypto || []).filter(c => c !== itemToRemove);
            updatedList.crypto = updatedCrypto;
            updatedList.extraCoins = updatedCrypto; // backward compatibility
        } else if (activeTab === 'forex') {
            updatedList.forex = (extraCoins.forex || []).filter(c => c !== itemToRemove);
        } else if (activeTab === 'metals') {
            updatedList.metals = (extraCoins.metals || []).filter(c => c !== itemToRemove);
        }

        try {
            await setDoc(doc(db, 'admin_set', 'coins_list'), updatedList);
            setExtraCoins(updatedList);
            showToast('success', 'Removed successfully');
        } catch (err) {
            showToast('error', 'Failed: ' + err.message);
        }
    };

    // ── Get all coins for current tab ────────────────────────────────────
    const getCoinsForTab = (tab) => {
        const base = DEFAULT_COINS[tab] || [];
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
            const found = rawCrypto.find(c => c.id === coin.id);
            if (found && found.rate) {
                return found.rate;
            }
        } else if (tab === 'forex') {
            const ratesObj = liveRates.forex?.rates;
            if (ratesObj) {
                const currency = coin.code || coin.id.replace('fx-', '').toUpperCase();
                let rate = ratesObj[currency];
                if (rate) {
                    if (coin.label && coin.label.endsWith('/USD')) {
                        rate = 1 / rate;
                    }
                    return rate.toFixed(6);
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
            <div style={{ marginBottom: '28px' }}>
                <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', margin: '0 0 6px' }}>
                    Coins API Settings
                </h2>
                <p style={{ color: '#555', fontSize: '13px', margin: 0 }}>
                    Manage price sources, sync intervals, custom rates and coin visibility per market category.
                </p>
            </div>

            {/* Tab Switcher */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' }}>
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setExpandRates(false); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '10px 18px', borderRadius: '12px',
                                fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                                background: isActive ? `rgba(${hexToRgb(tab.color)},0.15)` : 'rgba(255,255,255,0.04)',
                                color: isActive ? tab.color : '#555',
                                border: `1px solid ${isActive ? `rgba(${hexToRgb(tab.color)},0.4)` : '#1a1a1a'}`,
                                transition: 'all 0.25s ease',
                            }}
                        >
                            <Icon size={15} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ── SECTION 1: Price Source Toggle ── */}
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
                            marginTop: '12px',
                            padding: '12px 16px',
                            background: `rgba(${hexToRgb(accentColor)}, 0.06)`,
                            borderRadius: '10px',
                            border: `1px solid rgba(${hexToRgb(accentColor)}, 0.15)`,
                            fontSize: '12px', color: '#888',
                            display: 'flex', alignItems: 'center', gap: '8px',
                        }}
                    >
                        <AlertCircle size={14} color={accentColor} />
                        API sync is disabled. Even if sync time has passed, only DB custom rates will be shown to clients.
                    </motion.div>
                )}
            </SectionCard>

            {/* ── SECTION 2: Sync Interval ── */}
            <SectionCard title="Sync Interval" accentColor={accentColor} style={{ opacity: isCustomOn ? 0.5 : 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'end' }}>
                    <div>
                        <label style={labelStyle}>Sync Every (seconds)</label>
                        <div style={{ position: 'relative' }}>
                            <Clock size={14} color="#555" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="number"
                                min="60"
                                value={localIntervals[activeTab] ?? tabConfig.syncIntervalSeconds}
                                onChange={e => setLocalIntervals(prev => ({ ...prev, [activeTab]: e.target.value }))}
                                disabled={isCustomOn}
                                style={{ ...inputStyle, paddingLeft: '36px', fontFamily: 'monospace' }}
                                placeholder="e.g. 1800"
                            />
                        </div>
                        <div style={{ fontSize: '11px', color: '#555', marginTop: '6px' }}>
                            = <span style={{ color: '#888', fontWeight: '700' }}>{secondsToHuman(localIntervals[activeTab] || tabConfig.syncIntervalSeconds)}</span>
                            &nbsp;|&nbsp; Minimum: 60s
                            &nbsp;|&nbsp; Last sync: <span style={{ color: accentColor, fontWeight: '700' }}>{timeAgo(tabConfig.lastSyncedAt)}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => saveTabConfig(activeTab)}
                        disabled={saving === activeTab || isCustomOn}
                        style={{ ...actionBtnStyle, background: accentColor, color: '#000', minWidth: '90px' }}
                    >
                        {saving === activeTab ? <Loader2 size={15} className="animate-spin" /> : <><Save size={14} /> Save</>}
                    </button>
                </div>

                {/* Force Sync */}
                <div style={{
                    marginTop: '16px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 16px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '12px', border: '1px solid #1e1e1e',
                }}>
                    <div>
                        <div style={{ color: '#fff', fontSize: '13px', fontWeight: '700' }}>Force Sync Now</div>
                        <div style={{ color: '#555', fontSize: '11px', marginTop: '2px' }}>
                            Bypass time check — immediately fetch from API &amp; store to DB
                        </div>
                    </div>
                    <button
                        onClick={() => forceSyncNow(activeTab)}
                        disabled={syncing === activeTab || isCustomOn}
                        style={{ ...actionBtnStyle, background: 'rgba(255,255,255,0.05)', color: '#aaa', border: '1px solid #2a2a2a' }}
                    >
                        {syncing === activeTab
                            ? <><Loader2 size={14} className="animate-spin" /> Syncing</>
                            : <><RefreshCw size={14} /> Sync</>
                        }
                    </button>
                </div>
            </SectionCard>

            {/* ── SECTION 3: Custom Rates ── */}
            <AnimatePresence>
                {isCustomOn && (
                    <motion.div
                        key="custom-rates"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <SectionCard
                            title={`Custom Rates (${tabInfo?.label})`}
                            accentColor={accentColor}
                            headerRight={
                                <button
                                    onClick={() => setExpandRates(p => !p)}
                                    style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                                >
                                    {expandRates ? 'Collapse' : 'Expand All'}
                                    <ChevronDown size={14} style={{ transform: expandRates ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                </button>
                            }
                        >
                            <p style={{ fontSize: '12px', color: '#555', marginBottom: '16px', marginTop: 0 }}>
                                Set custom rates for each coin. These will override API data while custom mode is ON.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {(expandRates ? allCoins : allCoins.slice(0, 6)).map(coin => {
                                    const savedRate = customRates[activeTab]?.[coin.id] || '';
                                    const localRate = localRates[coin.id] !== undefined ? localRates[coin.id] : savedRate;
                                    const isSaving = saving === coin.id;
                                    return (
                                        <div key={coin.id} style={{
                                            display: 'grid', gridTemplateColumns: '1fr 140px auto',
                                            gap: '8px', alignItems: 'center',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <img
                                                    src={coin.icon}
                                                    alt={coin.label}
                                                    style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                                                    onError={e => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/25/25254.png'; }}
                                                />
                                                <div>
                                                    <div style={{ color: '#fff', fontSize: '13px', fontWeight: '700' }}>{coin.label}</div>
                                                    <div style={{ display: 'flex', gap: '8px', fontSize: '10px', marginTop: '1px' }}>
                                                        {savedRate && <span style={{ color: '#555' }}>Saved: <strong style={{ color: accentColor }}>{savedRate}</strong></span>}
                                                        <span style={{ color: '#444' }}>Live API: <strong style={{ color: '#777' }}>{getLiveRateForCoin(activeTab, coin) || 'N/A'}</strong></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ position: 'relative' }}>
                                                <DollarSign size={11} color="#444" style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)' }} />
                                                <input
                                                    type="number"
                                                    step="any"
                                                    value={localRate}
                                                    onChange={e => setLocalRates(prev => ({ ...prev, [coin.id]: e.target.value }))}
                                                    placeholder="0.00"
                                                    style={{ ...inputStyle, paddingLeft: '24px', fontSize: '13px', height: '38px' }}
                                                />
                                            </div>
                                            <button
                                                onClick={() => saveCustomRate(activeTab, coin.id)}
                                                disabled={isSaving}
                                                style={{ ...actionBtnStyle, background: `rgba(${hexToRgb(accentColor)},0.15)`, color: accentColor, height: '38px', padding: '0 12px' }}
                                            >
                                                {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                            </button>
                                        </div>
                                    );
                                })}
                                {!expandRates && allCoins.length > 6 && (
                                    <button
                                        onClick={() => setExpandRates(true)}
                                        style={{ background: 'none', border: '1px dashed #2a2a2a', borderRadius: '10px', padding: '10px', color: '#555', cursor: 'pointer', fontSize: '12px' }}
                                    >
                                        + Show {allCoins.length - 6} more coins
                                    </button>
                                )}
                            </div>
                        </SectionCard>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── SECTION 4: Coins Management ── */}
            <SectionCard title="Coins Management" accentColor={accentColor}>
                {/* Guidance panel */}
                <div style={{
                    marginBottom: '20px',
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid #222',
                }}>
                    <div style={{ color: '#fff', fontSize: '13px', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertCircle size={14} color={accentColor} />
                        {activeTab === 'crypto' && 'How to add Cryptocurrency:'}
                        {activeTab === 'forex' && 'How to add Foreign Exchange Currency:'}
                        {activeTab === 'metals' && 'How to add Precious Metal/Commodity:'}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', color: '#888', fontSize: '12px', lineHeight: '1.6' }}>
                        {activeTab === 'crypto' && (
                            <>
                                <li>Go to <a href="https://livecoinwatch.com" target="_blank" rel="noreferrer" style={{ color: accentColor, textDecoration: 'underline' }}>livecoinwatch.com</a>.</li>
                                <li>Search for your target coin (e.g. <strong>BNB</strong>, <strong>FET</strong>, <strong>RENDER</strong>).</li>
                                <li>Copy the bold ticker code and enter it below (e.g. <code>BNB</code>).</li>
                                <li style={{ color: '#555' }}>Note: System automatically fetches its live icon and rate.</li>
                            </>
                        )}
                        {activeTab === 'forex' && (
                            <>
                                <li>Use standard <strong>ISO 4217</strong> 3-letter currency codes.</li>
                                <li>E.g., <code>SGD</code> (Singapore Dollar), <code>MXN</code> (Mexican Peso), <code>ZAR</code> (South African Rand).</li>
                                <li>Check codes at <a href="https://xe.com" target="_blank" rel="noreferrer" style={{ color: accentColor, textDecoration: 'underline' }}>xe.com</a> if needed.</li>
                                <li style={{ color: '#555' }}>Note: Rates are verified against the ExchangeRate API.</li>
                            </>
                        )}
                        {activeTab === 'metals' && (
                            <>
                                <li>Enter the symbol and display name separated by <code>|</code>.</li>
                                <li>Format: <code>SYMBOL|Full Name</code> (e.g. <code>IRON/USD|Iron Ore</code> or <code>TIN/USD|Tin</code>).</li>
                                <li style={{ color: '#555' }}>Note: Since there is no auto-fetch for custom commodities, you must set their Custom Rates manually.</li>
                            </>
                        )}
                    </ul>
                </div>

                {/* Add Input section */}
                <div style={{ marginBottom: '24px' }}>
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
                            style={inputStyle}
                        />
                        <button
                            onClick={addCoin}
                            disabled={addingCoin}
                            style={{ ...actionBtnStyle, background: accentColor, color: '#000', padding: '0 18px' }}
                        >
                            {addingCoin ? <Loader2 size={15} className="animate-spin" /> : <><Plus size={14} /> Add</>}
                        </button>
                    </div>
                </div>

                {/* Added custom assets list */}
                {(() => {
                    const currentExtras =
                        activeTab === 'crypto'
                            ? (extraCoins.crypto || [])
                            : activeTab === 'forex'
                            ? (extraCoins.forex || [])
                            : (extraCoins.metals || []);

                    if (currentExtras.length === 0) return null;

                    return (
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ fontSize: '11px', color: '#555', marginBottom: '8px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Added Custom Assets ({currentExtras.length})
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {currentExtras.map(item => {
                                    const displayLabel = activeTab === 'metals' ? item.split('|')[0] : item;
                                    const titleTip = activeTab === 'metals' ? item.split('|')[1] : '';
                                    return (
                                        <div key={item} title={titleTip} style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            padding: '6px 10px', background: 'rgba(255,255,255,0.04)',
                                            borderRadius: '8px', border: '1px solid #222',
                                        }}>
                                            <span style={{ color: '#fff', fontSize: '13px', fontWeight: '700' }}>
                                                {displayLabel}
                                                {titleTip && <span style={{ color: '#555', fontWeight: 'normal', fontSize: '11px', marginLeft: '4px' }}>({titleTip})</span>}
                                            </span>
                                            <button
                                                onClick={() => removeCoin(item)}
                                                style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', display: 'flex', padding: '0' }}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

                {/* Show/Hide Coins */}
                <div>
                    <label style={labelStyle}>Show / Hide Assets on Client</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                        {allCoins.map(coin => {
                            const isVisible = visibility[coin.id] !== false;
                            return (
                                <div key={coin.id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '12px 14px',
                                    background: isVisible ? 'rgba(255,255,255,0.02)' : 'rgba(255,77,79,0.04)',
                                    borderRadius: '12px',
                                    border: `1px solid ${isVisible ? '#1e1e1e' : 'rgba(255,77,79,0.15)'}`,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <img
                                            src={coin.icon}
                                            alt={coin.label}
                                            style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                                            onError={e => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/25/25254.png'; }}
                                        />
                                        <div>
                                            <div style={{ color: isVisible ? '#fff' : '#555', fontSize: '13px', fontWeight: '700' }}>{coin.label}</div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '1px' }}>
                                                <span style={{ fontSize: '10px', color: isVisible ? '#00c087' : '#ff4d4f', fontWeight: '600' }}>
                                                    {isVisible ? 'Visible to clients' : 'Hidden from clients'}
                                                </span>
                                                <span style={{ fontSize: '10px', color: '#555' }}>
                                                    Rate: <strong style={{ color: '#777' }}>${getLiveRateForCoin(activeTab, coin) || 'N/A'}</strong>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleVisibility(coin.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            padding: '7px 14px', borderRadius: '8px', border: 'none',
                                            background: isVisible ? 'rgba(0,192,135,0.1)' : 'rgba(255,77,79,0.1)',
                                            color: isVisible ? '#00c087' : '#ff4d4f',
                                            cursor: 'pointer', fontWeight: '700', fontSize: '12px',
                                        }}
                                    >
                                        {isVisible ? <><Eye size={13} /> Show</> : <><EyeOff size={13} /> Hidden</>}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </SectionCard>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        key="toast"
                        initial={{ y: 60, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 60, opacity: 0 }}
                        style={{
                            position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
                            background: toast.type === 'success' ? '#00c087' : '#ff4d4f',
                            color: '#fff', padding: '12px 22px', borderRadius: '30px',
                            fontWeight: '700', fontSize: '13px',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
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
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid #1a1a1a',
        borderRadius: '18px',
        padding: '22px',
        marginBottom: '18px',
        ...style,
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{
                color: accentColor,
                fontSize: '13px', fontWeight: '900',
                textTransform: 'uppercase', letterSpacing: '0.8px',
                margin: 0,
            }}>
                {title}
            </h3>
            {headerRight}
        </div>
        {children}
    </div>
);

// ─── Styles ────────────────────────────────────────────────────────────────
const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    backgroundColor: '#111',
    border: '1px solid #222',
    borderRadius: '10px',
    color: '#fff',
    outline: 'none',
    fontSize: '14px',
    boxSizing: 'border-box',
};

const labelStyle = {
    display: 'block',
    fontSize: '11px', color: '#555',
    fontWeight: '800', textTransform: 'uppercase',
    marginBottom: '8px', letterSpacing: '0.5px',
};

const actionBtnStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    padding: '10px 16px', border: 'none', borderRadius: '10px',
    fontWeight: '700', fontSize: '13px', cursor: 'pointer',
    transition: 'all 0.2s ease', whiteSpace: 'nowrap',
};

export default AdminCoinsSettings;
