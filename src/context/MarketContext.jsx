import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchCryptoMarkets, fetchForexMarkets, fetchMetalMarkets, fetchCryptoByDynamicCodes } from '../services/api';
import { db } from '../firebase-setup';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const MarketContext = createContext();

// ─── Fallback Data ─────────────────────────────────────────────────────────
const FALLBACK_CRYPTO = [
    { id: 'BTCUSDT',  symbol: 'BTC',  name: 'BTC/USDT',  fullName: 'Bitcoin',       rate: '73,262.14', change: '+1.24%', flag: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',   category: 'Cryptocurrency', isLive: true },
    { id: 'ETHUSDT',  symbol: 'ETH',  name: 'ETH/USDT',  fullName: 'Ethereum',      rate: '3,842.15',  change: '+2.15%', flag: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', category: 'Cryptocurrency', isLive: true },
    { id: 'SOLUSDT',  symbol: 'SOL',  name: 'SOL/USDT',  fullName: 'Solana',        rate: '145.28',    change: '+4.80%', flag: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',  category: 'Cryptocurrency', isLive: true },
    { id: 'XRPUSDT',  symbol: 'XRP',  name: 'XRP/USDT',  fullName: 'XRP',           rate: '0.624100',  change: '+0.12%', flag: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png', category: 'Cryptocurrency', isLive: true },
    { id: 'AVAXUSDT', symbol: 'AVAX', name: 'AVAX/USDT', fullName: 'Avalanche',     rate: '35.40',     change: '+1.15%', flag: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png', category: 'Cryptocurrency', isLive: true },
    { id: 'LINKUSDT', symbol: 'LINK', name: 'LINK/USDT', fullName: 'Chainlink',     rate: '18.25',     change: '-0.40%', flag: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png', category: 'Cryptocurrency', isLive: true },
    { id: 'MATICUSDT',symbol: 'MATIC',name: 'MATIC/USDT',fullName: 'Polygon',       rate: '0.720000',  change: '-1.10%', flag: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png', category: 'Cryptocurrency', isLive: true },
    { id: 'SHIBUSDT', symbol: 'SHIB', name: 'SHIB/USDT', fullName: 'Shiba Inu',     rate: '0.000025',  change: '+5.10%', flag: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png',  category: 'Cryptocurrency', isLive: true },
    { id: 'TONUSDT',  symbol: 'TON',  name: 'TON/USDT',  fullName: 'Toncoin',       rate: '7.15',      change: '+3.45%', flag: 'https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png', category: 'Cryptocurrency', isLive: true },
    { id: 'NEARUSDT', symbol: 'NEAR', name: 'NEAR/USDT', fullName: 'NEAR Protocol', rate: '5.80',      change: '+0.25%', flag: 'https://assets.coingecko.com/coins/images/10365/small/near_icon.png', category: 'Cryptocurrency', isLive: true },
    { id: 'PEPEUSDT', symbol: 'PEPE', name: 'PEPE/USDT', fullName: 'Pepe',          rate: '0.000008',  change: '+12.40%',flag: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token-icon.png', category: 'Cryptocurrency', isLive: true },
    { id: 'SUIUSDT',  symbol: 'SUI',  name: 'SUI/USDT',  fullName: 'Sui',           rate: '1.05',      change: '-2.15%', flag: 'https://assets.coingecko.com/coins/images/26375/small/sui_logo.png', category: 'Cryptocurrency', isLive: true },
    { id: 'DOGEUSDT', symbol: 'DOGE', name: 'DOGE/USDT', fullName: 'Dogecoin',      rate: '0.162400',  change: '+5.40%', flag: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',   category: 'Cryptocurrency', isLive: true },
    { id: 'TRXUSDT',  symbol: 'TRX',  name: 'TRX/USDT',  fullName: 'TRON',          rate: '0.121500',  change: '+0.05%', flag: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png', category: 'Cryptocurrency', isLive: true },
    { id: 'DOTUSDT',  symbol: 'DOT',  name: 'DOT/USDT',  fullName: 'Polkadot',      rate: '7.20',      change: '-2.15%', flag: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png', category: 'Cryptocurrency', isLive: true },
    { id: 'LTCUSDT',  symbol: 'LTC',  name: 'LTC/USDT',  fullName: 'Litecoin',      rate: '85.40',     change: '+0.80%', flag: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png',   category: 'Cryptocurrency', isLive: true },
];

const FALLBACK_FOREX = [
    { id: 'fx-eur', name: 'EUR/USD', fullName: 'Euro / US Dollar',               rate: '1.085420', change: '+0.04%', flag: 'https://flagcdn.com/w40/eu.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-gbp', name: 'GBP/USD', fullName: 'British Pound / US Dollar',      rate: '1.267430', change: '-0.12%', flag: 'https://flagcdn.com/w40/gb.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-jpy', name: 'USD/JPY', fullName: 'US Dollar / Japanese Yen',       rate: '151.42',   change: '+0.25%', flag: 'https://flagcdn.com/w40/jp.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-cad', name: 'USD/CAD', fullName: 'US Dollar / Canadian Dollar',    rate: '1.352000', change: '+0.10%', flag: 'https://flagcdn.com/w40/ca.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-aud', name: 'AUD/USD', fullName: 'Australian Dollar / US Dollar',  rate: '0.654000', change: '-0.15%', flag: 'https://flagcdn.com/w40/au.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-nzd', name: 'NZD/USD', fullName: 'New Zealand Dollar / US Dollar', rate: '0.602000', change: '-0.05%', flag: 'https://flagcdn.com/w40/nz.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-chf', name: 'USD/CHF', fullName: 'US Dollar / Swiss Franc',        rate: '0.901500', change: '+0.08%', flag: 'https://flagcdn.com/w40/ch.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-eurgbp',name:'EUR/GBP',fullName: 'Euro / British Pound',           rate: '0.856000', change: '+0.02%', flag: 'https://flagcdn.com/w40/gb.png', category: 'Foreign Exchange', isLive: false },
];

const STATIC_METALS = [
    { id: 'metal-1',  name: 'XAU/USD',   fullName: 'Gold',        rate: '2,385.50', change: '+0.45%', flag: 'https://img.icons8.com/color/96/gold-bars.png',    category: 'Precious Metals', isLive: false },
    { id: 'metal-2',  name: 'XAG/USD',   fullName: 'Silver',      rate: '28.40',    change: '+1.20%', flag: 'https://img.icons8.com/color/96/silver-bars.png',  category: 'Precious Metals', isLive: false },
    { id: 'metal-3',  name: 'WTI/USD',   fullName: 'Crude Oil',   rate: '83.40',    change: '+0.15%', flag: 'https://img.icons8.com/color/96/oil-industry.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-4',  name: 'XPT/USD',   fullName: 'Platinum',    rate: '965.40',   change: '+0.15%', flag: 'https://img.icons8.com/color/96/silver-bars.png',  category: 'Precious Metals', isLive: false },
    { id: 'metal-5',  name: 'XPD/USD',   fullName: 'Palladium',   rate: '1,025.15', change: '-0.85%', flag: 'https://img.icons8.com/color/96/silver-bars.png',  category: 'Precious Metals', isLive: false },
    { id: 'metal-6',  name: 'XCU/USD',   fullName: 'Copper',      rate: '4.45',     change: '+0.20%', flag: 'https://img.icons8.com/color/96/copper-ingot.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-7',  name: 'ALU/USD',   fullName: 'Aluminum',    rate: '2,450.00', change: '-0.10%', flag: 'https://img.icons8.com/color/96/aluminum-ingot.png',category: 'Precious Metals', isLive: false },
    { id: 'metal-8',  name: 'NG/USD',    fullName: 'Natural Gas', rate: '1.95',     change: '+3.10%', flag: 'https://img.icons8.com/color/96/natural-gas.png',  category: 'Precious Metals', isLive: false },
    { id: 'metal-9',  name: 'ZNC/USD',   fullName: 'Zinc',        rate: '2,750.50', change: '+0.15%', flag: 'https://img.icons8.com/color/96/steel-ingot.png',  category: 'Precious Metals', isLive: false },
    { id: 'metal-10', name: 'NKL/USD',   fullName: 'Nickel',      rate: '17,850.00',change: '+1.15%', flag: 'https://img.icons8.com/color/96/steel-ingot.png',  category: 'Precious Metals', isLive: false },
    { id: 'metal-11', name: 'LD/USD',    fullName: 'Lead',        rate: '2,145.00', change: '-0.20%', flag: 'https://img.icons8.com/color/96/steel-ingot.png',  category: 'Precious Metals', isLive: false },
    { id: 'metal-12', name: 'BRENT/USD', fullName: 'Brent Oil',   rate: '87.20',    change: '-0.40%', flag: 'https://img.icons8.com/color/96/oil-industry.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-13', name: 'WHEAT/USD', fullName: 'Wheat',       rate: '565.40',   change: '+0.25%', flag: 'https://img.icons8.com/color/48/wheat.png',        category: 'Precious Metals', isLive: false },
    { id: 'metal-14', name: 'CORN/USD',  fullName: 'Corn',        rate: '430.15',   change: '-0.15%', flag: 'https://img.icons8.com/color/48/corn.png',         category: 'Precious Metals', isLive: false },
    { id: 'metal-15', name: 'COFFEE/USD',fullName: 'Coffee',      rate: '235.30',   change: '+1.40%', flag: 'https://img.icons8.com/color/48/coffee-beans.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-16', name: 'SUGAR/USD', fullName: 'Sugar',       rate: '19.85',    change: '-0.30%', flag: 'https://img.icons8.com/color/48/sugar-cube.png',   category: 'Precious Metals', isLive: false },
    { id: 'metal-17', name: 'COTTON/USD',fullName: 'Cotton',      rate: '81.50',    change: '+0.05%', flag: 'https://img.icons8.com/color/48/cotton.png',       category: 'Precious Metals', isLive: false },
];

// ─── Default config if DB has nothing ─────────────────────────────────────
const DEFAULT_TAB_CONFIG = {
    crypto: { useCustomPrice: false, syncIntervalSeconds: 300,   lastSyncedAt: 0 },
    forex:  { useCustomPrice: false, syncIntervalSeconds: 1800,  lastSyncedAt: 0 },
    metals: { useCustomPrice: false, syncIntervalSeconds: 21600, lastSyncedAt: 0 },
};

// ─── Helper: apply custom rates onto an asset array ──────────────────────
function applyCustomRatesToAssets(assets, customRatesMap) {
    if (!customRatesMap) return assets;
    return assets.map(asset => {
        const customRate = customRatesMap[asset.id];
        if (customRate !== undefined && customRate !== '') {
            return {
                ...asset,
                rate: parseFloat(customRate) > 100
                    ? parseFloat(customRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : parseFloat(customRate).toFixed(6),
                isLive: false, // custom price = not live API
            };
        }
        return asset;
    });
}

// ─── Helper: build crypto assets from raw cached livecoinwatch data ───────
function buildCryptoFromCachedRaw(rawArray) {
    if (!Array.isArray(rawArray)) return null;
    return rawArray.map(item => {
        if (item.id && item.rate && item.category) return item; // already shaped
        const rawName = item.code || item.symbol;
        if (!rawName) return null;
        const pct = item.delta && item.delta.day ? (item.delta.day - 1) * 100 : 0;
        const sign = pct >= 0 ? '+' : '';
        return {
            id: rawName + 'USDT',
            symbol: rawName,
            name: `${rawName}/USDT`,
            fullName: item.name || rawName,
            rate: parseFloat(item.rate) > 100
                ? parseFloat(item.rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : parseFloat(item.rate).toFixed(6),
            change: `${sign}${pct.toFixed(2)}%`,
            flag: item.png64 || item.png32 || `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${rawName.toLowerCase()}.png`,
            category: 'Cryptocurrency',
            volume24h: item.volume ? (parseFloat(item.volume) / 1000000).toFixed(1) + 'M' : '0M',
            high24h: 'N/A', low24h: 'N/A',
            isLive: true,
        };
    }).filter(Boolean);
}

// ─── Helper: build forex assets from raw exchangerate-api data ────────────
function buildForexFromCachedRaw(raw, extraForex = []) {
    if (!raw || !raw.rates) return null;
    const rates = raw.rates;
    const basePairs = [
        { id: 'fx-gbp', symbol: 'GBP/USD', flag: 'gb', rateKey: 'GBP' },
        { id: 'fx-eur', symbol: 'EUR/USD', flag: 'eu', rateKey: 'EUR' },
        { id: 'fx-aud', symbol: 'AUD/USD', flag: 'au', rateKey: 'AUD' },
        { id: 'fx-nzd', symbol: 'NZD/USD', flag: 'nz', rateKey: 'NZD' },
        { id: 'fx-jpy', symbol: 'USD/JPY', flag: 'jp', rateKey: 'JPY' },
        { id: 'fx-cad', symbol: 'USD/CAD', flag: 'ca', rateKey: 'CAD' },
        { id: 'fx-chf', symbol: 'USD/CHF', flag: 'ch', rateKey: 'CHF' },
        { id: 'fx-hkd', symbol: 'USD/HKD', flag: 'hk', rateKey: 'HKD' },
        { id: 'fx-inr', symbol: 'INR/USD', flag: 'in', rateKey: 'INR' },
        { id: 'fx-krw', symbol: 'USD/KRW', flag: 'kr', rateKey: 'KRW' },
        { id: 'fx-thb', symbol: 'USD/THB', flag: 'th', rateKey: 'THB' },
        { id: 'fx-aed', symbol: 'AED/USD', flag: 'ae', rateKey: 'AED' },
    ];

    const extraPairs = extraForex.map(code => {
        const upperCode = code.toUpperCase();
        return {
            id: `fx-${code.toLowerCase()}`,
            symbol: `${upperCode}/USD`,
            flag: code.slice(0, 2).toLowerCase(),
            rateKey: upperCode,
            isExtra: true
        };
    });

    const allPairs = [...basePairs, ...extraPairs];

    return allPairs.map(pair => {
        let rate = rates[pair.rateKey];
        if (!rate) return null;
        if (pair.symbol.endsWith('/USD')) rate = 1 / rate;
        return {
            id: pair.id, name: pair.symbol,
            rate: rate.toFixed(6),
            change: `${(Math.random() * 0.4 - 0.2).toFixed(2)}%`, // Mock change as free API doesn't provide it
            flag: `https://flagcdn.com/w40/${pair.flag}.png`,
            category: 'Foreign Exchange', isLive: true,
        };
    }).filter(Boolean);
}

// ─── Provider ─────────────────────────────────────────────────────────────
export const MarketProvider = ({ children }) => {
    const [assets, setAssets]               = useState([...FALLBACK_FOREX, ...FALLBACK_CRYPTO, ...STATIC_METALS]);
    const [loading, setLoading]             = useState(true);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [isActive, setIsActive]           = useState(false);

    // Set initial selected asset once loaded
    useEffect(() => {
        if (assets.length > 0 && !selectedAsset) {
            setSelectedAsset(assets.find(a => a.symbol === 'BTC') || assets[0]);
        }
    }, [assets]);

    // ── Core smart load ──────────────────────────────────────────────────
    const loadMarketData = useCallback(async (forceMetals = false) => {
        console.log('[Market] Starting smart market data load...');
        try {
            // ── Read admin config from Firestore ──────────────────────
            const [cfgSnap, ratesSnap, customRatesSnap, visSnap, listSnap] = await Promise.all([
                getDoc(doc(db, 'admin_set', 'coins_config')),
                getDoc(doc(db, 'admin_set', 'coins_rates')),
                getDoc(doc(db, 'admin_set', 'coins_custom_rates')),
                getDoc(doc(db, 'admin_set', 'coins_visibility')),
                getDoc(doc(db, 'admin_set', 'coins_list')),
            ]);

            const cfg = cfgSnap.exists()
                ? {
                    crypto: { ...DEFAULT_TAB_CONFIG.crypto, ...(cfgSnap.data().crypto || {}) },
                    forex:  { ...DEFAULT_TAB_CONFIG.forex,  ...(cfgSnap.data().forex  || {}) },
                    metals: { ...DEFAULT_TAB_CONFIG.metals, ...(cfgSnap.data().metals || {}) },
                  }
                : DEFAULT_TAB_CONFIG;

            const cachedRates    = ratesSnap.exists()    ? ratesSnap.data()    : {};
            const customRatesAll = customRatesSnap.exists() ? customRatesSnap.data() : {};
            const visibility     = visSnap.exists()      ? visSnap.data()      : {};
            
            let extraCrypto = [];
            let extraForex = [];
            let extraMetals = [];
            if (listSnap.exists()) {
                const listData = listSnap.data();
                extraCrypto = listData.crypto || listData.extraCoins || [];
                extraForex = listData.forex || [];
                extraMetals = listData.metals || [];
            }

            const now = Date.now();

            // ─────────────────────────────────────────────────────────
            // CRYPTO
            // ─────────────────────────────────────────────────────────
            let cryptoAssets = [...FALLBACK_CRYPTO];

            if (cfg.crypto.useCustomPrice) {
                // Custom mode: apply saved custom rates to cached/fallback data
                console.log('[Market][Crypto] Custom price mode ON — loading from DB');
                const baseCrypto = buildCryptoFromCachedRaw(cachedRates.crypto) || FALLBACK_CRYPTO;
                cryptoAssets = applyCustomRatesToAssets(baseCrypto, customRatesAll.crypto);
            } else {
                const timeSince = now - (cfg.crypto.lastSyncedAt || 0);
                const shouldSync = timeSince >= cfg.crypto.syncIntervalSeconds * 1000;

                if (shouldSync) {
                    console.log('[Market][Crypto] Sync time elapsed — fetching from API...');
                    const allCodes = [
                        'BTC','ETH','SOL','XRP','AVAX','LINK','MATIC','SHIB','TON','NEAR','PEPE','SUI','DOGE','TRX','DOT','LTC',
                        ...extraCrypto,
                    ].filter((v, i, a) => a.indexOf(v) === i); // unique

                    const freshData = await fetchCryptoByDynamicCodes(allCodes);
                    if (freshData && freshData.length > 0) {
                        cryptoAssets = freshData;
                        // Store raw API response to DB
                        const existingRates = ratesSnap.exists() ? ratesSnap.data() : {};
                        await setDoc(doc(db, 'admin_set', 'coins_rates'), {
                            ...existingRates,
                            crypto: freshData,
                            cryptoSyncedAt: now,
                        });
                        // Update lastSyncedAt
                        const newCfg = { ...cfg, crypto: { ...cfg.crypto, lastSyncedAt: now } };
                        await setDoc(doc(db, 'admin_set', 'coins_config'), newCfg);
                        console.log('[Market][Crypto] API data fetched & stored to DB');
                    }
                } else {
                    console.log('[Market][Crypto] Using cached DB data (sync not due yet)');
                    const builtFromCache = buildCryptoFromCachedRaw(cachedRates.crypto);
                    if (builtFromCache && builtFromCache.length > 0) {
                        cryptoAssets = builtFromCache;
                    }
                }
            }

            // ─────────────────────────────────────────────────────────
            // FOREX
            // ─────────────────────────────────────────────────────────
            let forexAssets = [...FALLBACK_FOREX];

            if (cfg.forex.useCustomPrice) {
                console.log('[Market][Forex] Custom price mode ON — loading from DB');
                const baseForex = buildForexFromCachedRaw(cachedRates.forex, extraForex) || FALLBACK_FOREX;
                forexAssets = applyCustomRatesToAssets(baseForex, customRatesAll.forex);
            } else {
                const timeSince = now - (cfg.forex.lastSyncedAt || 0);
                const shouldSync = timeSince >= cfg.forex.syncIntervalSeconds * 1000;

                if (shouldSync) {
                    console.log('[Market][Forex] Sync time elapsed — fetching from API...');
                    const freshForex = await fetchForexMarkets();
                    if (freshForex && freshForex.length > 0) {
                        forexAssets = freshForex;
                        // Fetch raw for cache
                        let rawData = null;
                        try {
                            const rawRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
                            rawData = rawRes.ok ? await rawRes.json() : null;
                            const existingRates = ratesSnap.exists() ? ratesSnap.data() : {};
                            await setDoc(doc(db, 'admin_set', 'coins_rates'), {
                                ...existingRates,
                                forex: rawData,
                                forexSyncedAt: now,
                            });
                        } catch (_) { /* non-critical */ }
                        const newCfg = { ...cfg, forex: { ...cfg.forex, lastSyncedAt: now } };
                        await setDoc(doc(db, 'admin_set', 'coins_config'), newCfg);
                        console.log('[Market][Forex] API data fetched & stored to DB');

                        const built = buildForexFromCachedRaw(rawData || cachedRates.forex, extraForex);
                        if (built && built.length > 0) {
                            forexAssets = built;
                        }
                    }
                } else {
                    console.log('[Market][Forex] Using cached DB data (sync not due yet)');
                    const builtFromCache = buildForexFromCachedRaw(cachedRates.forex, extraForex);
                    if (builtFromCache && builtFromCache.length > 0) {
                        forexAssets = builtFromCache;
                    }
                }
            }

            // ─────────────────────────────────────────────────────────
            // METALS
            // ─────────────────────────────────────────────────────────
            const extraMetalsList = extraMetals.map((str, idx) => {
                const parts = str.split('|');
                const symbol = parts[0]?.trim() || 'UNKNOWN/USD';
                const name = parts[1]?.trim() || symbol;
                return {
                    id: `metal-extra-${idx}`,
                    name: symbol,
                    fullName: name,
                    rate: '0.00', // default rate, admin should set custom rate
                    change: '0.00%',
                    flag: 'https://img.icons8.com/color/96/steel-ingot.png', // generic metal icon
                    category: 'Precious Metals',
                    isLive: false,
                };
            });
            const baseMetalsCombined = [...STATIC_METALS, ...extraMetalsList];
            let metalAssets = baseMetalsCombined;

            if (cfg.metals.useCustomPrice) {
                console.log('[Market][Metals] Custom price mode ON — loading from DB');
                metalAssets = applyCustomRatesToAssets(baseMetalsCombined, customRatesAll.metals);
            } else {
                const lastMetalFetch = localStorage.getItem('lastMetalFetch');
                const timeSince = now - (cfg.metals.lastSyncedAt || 0);
                const shouldSync = forceMetals
                    || timeSince >= cfg.metals.syncIntervalSeconds * 1000
                    || !lastMetalFetch
                    || (now - parseInt(lastMetalFetch) > 6 * 60 * 60 * 1000);

                if (shouldSync) {
                    console.log('[Market][Metals] Sync time elapsed — fetching from API...');
                    const metalData = await fetchMetalMarkets();
                    if (metalData) {
                        localStorage.setItem('lastMetalFetch', now.toString());
                        localStorage.setItem('cachedMetalData', JSON.stringify(metalData));
                        const newCfg = { ...cfg, metals: { ...cfg.metals, lastSyncedAt: now } };
                        await setDoc(doc(db, 'admin_set', 'coins_config'), newCfg);
                    }
                }

                // Always try to apply metal data (from API or localStorage cache)
                const cachedMetalData = JSON.parse(localStorage.getItem('cachedMetalData') || 'null');
                if (cachedMetalData) {
                    metalAssets = baseMetalsCombined.map(m => {
                        const nameLower = m.fullName.toLowerCase();
                        let price = null;
                        if (nameLower.includes('gold')      && cachedMetalData.gold)      price = cachedMetalData.gold;
                        else if (nameLower.includes('silver')    && cachedMetalData.silver)    price = cachedMetalData.silver;
                        else if (nameLower.includes('platinum')  && cachedMetalData.platinum)  price = cachedMetalData.platinum;
                        else if (nameLower.includes('palladium') && cachedMetalData.palladium) price = cachedMetalData.palladium;
                        else if (nameLower.includes('copper')    && cachedMetalData.copper)    price = cachedMetalData.copper;
                        else if (nameLower.includes('aluminum')  && cachedMetalData.aluminum)  price = cachedMetalData.aluminum;
                        else if (nameLower.includes('zinc')      && cachedMetalData.zinc)      price = cachedMetalData.zinc;
                        else if (nameLower.includes('nickel')    && cachedMetalData.nickel)    price = cachedMetalData.nickel;
                        else if (nameLower.includes('lead')      && cachedMetalData.lead)      price = cachedMetalData.lead;
                        if (price) {
                            return {
                                ...m,
                                rate: price > 100
                                    ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                    : price.toFixed(price < 1 ? 4 : 2),
                                isLive: true,
                            };
                        }
                        return m;
                    });
                }

                // Apply custom overrides on top if any
                if (customRatesAll.metals) {
                    metalAssets = applyCustomRatesToAssets(metalAssets, customRatesAll.metals);
                }
            }

            // ─────────────────────────────────────────────────────────
            // Merge + Apply visibility filter
            // ─────────────────────────────────────────────────────────
            let allAssets = [...forexAssets, ...cryptoAssets, ...metalAssets];

            // Hide coins that admin set to false in coins_visibility
            if (Object.keys(visibility).length > 0) {
                allAssets = allAssets.filter(a => visibility[a.id] !== false);
            }

            setAssets(allAssets);
            setLoading(false);
            console.log('[Market] Done. Total assets:', allAssets.length);
        } catch (error) {
            console.error('[Market] CRITICAL: Failed to load market data:', error);
            setLoading(false);
        }
    }, []);

    // ── Crypto-only live update (respects custom price mode) ─────────────
    const loadCryptoData = useCallback(async () => {
        try {
            // Quick config check — don't hit API if custom price is ON
            const cfgSnap = await getDoc(doc(db, 'admin_set', 'coins_config'));
            const cfg = cfgSnap.exists() ? cfgSnap.data() : DEFAULT_TAB_CONFIG;
            const cryptoCfg = { ...DEFAULT_TAB_CONFIG.crypto, ...(cfg.crypto || {}) };

            if (cryptoCfg.useCustomPrice) {
                // Custom mode ON: no live API call needed
                return;
            }

            const listSnap = await getDoc(doc(db, 'admin_set', 'coins_list'));
            let extraCrypto = [];
            if (listSnap.exists()) {
                const listData = listSnap.data();
                extraCrypto = listData.crypto || listData.extraCoins || [];
            }
            const allCodes = [
                'BTC','ETH','SOL','XRP','AVAX','LINK','MATIC','SHIB','TON','NEAR','PEPE','SUI','DOGE','TRX','DOT','LTC',
                ...extraCrypto,
            ].filter((v, i, a) => a.indexOf(v) === i);

            const cryptoData = await fetchCryptoByDynamicCodes(allCodes);
            if (cryptoData && cryptoData.length > 0) {
                setAssets(prev => {
                    const nonCrypto = prev.filter(a => a.category !== 'Cryptocurrency');
                    return [...nonCrypto, ...cryptoData];
                });
                setSelectedAsset(current => {
                    if (!current || current.category !== 'Cryptocurrency') return current;
                    const updated = cryptoData.find(a => a.id === current.id);
                    return updated || current;
                });
            }
        } catch (error) {
            console.error('[Market] Failed to load crypto live data:', error);
        }
    }, []);

    // ── Intervals & lifecycle ────────────────────────────────────────────
    useEffect(() => {
        if (!isActive) {
            setLoading(false);
            return;
        }

        // Initial load
        loadMarketData(true);

        // Full market refresh every 5 min (respects admin config)
        const apiInterval = setInterval(() => loadMarketData(false), 300_000);

        // Crypto live updates every 5 seconds
        const cryptoInterval = setInterval(() => loadCryptoData(), 5000);

        // Price simulation for live non-crypto assets (only when NOT in custom price mode)
        const simInterval = setInterval(async () => {
            // Check if metals custom mode is on before simulating
            let metalsCustom = false;
            let forexCustom  = false;
            try {
                const cfgSnap = await getDoc(doc(db, 'admin_set', 'coins_config'));
                if (cfgSnap.exists()) {
                    metalsCustom = !!cfgSnap.data()?.metals?.useCustomPrice;
                    forexCustom  = !!cfgSnap.data()?.forex?.useCustomPrice;
                }
            } catch (_) { /* ignore */ }

            setAssets(prev => {
                const newAssets = prev.map(asset => {
                    if (asset.isLive === false) return asset;
                    if (asset.category === 'Cryptocurrency') return asset;
                    if (asset.category === 'Precious Metals' && metalsCustom) return asset;
                    if (asset.category === 'Foreign Exchange' && forexCustom)  return asset;

                    const currentPrice = parseFloat(asset.rate.replace(/,/g, ''));
                    if (isNaN(currentPrice)) return asset;
                    const change = (Math.random() * 0.0004 - 0.0002) * currentPrice;
                    const newPrice = currentPrice + change;
                    return {
                        ...asset,
                        rate: newPrice > 100
                            ? newPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : newPrice.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 }),
                    };
                });

                setSelectedAsset(current => {
                    if (!current || current.category === 'Cryptocurrency') return current;
                    const updated = newAssets.find(a => a.id === current.id);
                    return updated || current;
                });

                return newAssets;
            });
        }, 3000);

        return () => {
            clearInterval(apiInterval);
            clearInterval(cryptoInterval);
            clearInterval(simInterval);
        };
    }, [loadMarketData, loadCryptoData, isActive]);

    return (
        <MarketContext.Provider value={{ assets, loading, refreshData: loadMarketData, selectedAsset, setSelectedAsset, setIsActive }}>
            {children}
        </MarketContext.Provider>
    );
};

export const useMarket = () => useContext(MarketContext);
