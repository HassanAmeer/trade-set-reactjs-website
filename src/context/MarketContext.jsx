import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchCryptoMarkets, fetchMetalMarkets, fetchCryptoByDynamicCodes } from '../services/api';
import { db } from '../firebase-setup';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const MarketContext = createContext();

// ─── Fallback Data ─────────────────────────────────────────────────────────
const FALLBACK_CRYPTO = [
    { id: 'BTCUSDT', symbol: 'BTC', name: 'BTC/USDT', fullName: 'Bitcoin', rate: '73,262.14', change: '+1.24%', flag: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', category: 'Cryptocurrency', isLive: true },
    { id: 'ETHUSDT', symbol: 'ETH', name: 'ETH/USDT', fullName: 'Ethereum', rate: '3,842.15', change: '+2.15%', flag: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', category: 'Cryptocurrency', isLive: true },
    { id: 'SOLUSDT', symbol: 'SOL', name: 'SOL/USDT', fullName: 'Solana', rate: '145.28', change: '+4.80%', flag: 'https://assets.coingecko.com/coins/images/4128/small/solana.png', category: 'Cryptocurrency', isLive: true },
    { id: 'XRPUSDT', symbol: 'XRP', name: 'XRP/USDT', fullName: 'XRP', rate: '0.624100', change: '+0.12%', flag: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png', category: 'Cryptocurrency', isLive: true },
    { id: 'AVAXUSDT', symbol: 'AVAX', name: 'AVAX/USDT', fullName: 'Avalanche', rate: '35.40', change: '+1.15%', flag: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png', category: 'Cryptocurrency', isLive: true },
    { id: 'LINKUSDT', symbol: 'LINK', name: 'LINK/USDT', fullName: 'Chainlink', rate: '18.25', change: '-0.40%', flag: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png', category: 'Cryptocurrency', isLive: true },
    { id: 'MATICUSDT', symbol: 'MATIC', name: 'MATIC/USDT', fullName: 'Polygon', rate: '0.720000', change: '-1.10%', flag: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png', category: 'Cryptocurrency', isLive: true },
    { id: 'SHIBUSDT', symbol: 'SHIB', name: 'SHIB/USDT', fullName: 'Shiba Inu', rate: '0.000025', change: '+5.10%', flag: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png', category: 'Cryptocurrency', isLive: true },
    { id: 'TONUSDT', symbol: 'TON', name: 'TON/USDT', fullName: 'Toncoin', rate: '7.15', change: '+3.45%', flag: 'https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png', category: 'Cryptocurrency', isLive: true },
    { id: 'NEARUSDT', symbol: 'NEAR', name: 'NEAR/USDT', fullName: 'NEAR Protocol', rate: '5.80', change: '+0.25%', flag: 'https://assets.coingecko.com/coins/images/10365/small/near_icon.png', category: 'Cryptocurrency', isLive: true },
    { id: 'PEPEUSDT', symbol: 'PEPE', name: 'PEPE/USDT', fullName: 'Pepe', rate: '0.000008', change: '+12.40%', flag: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token-icon.png', category: 'Cryptocurrency', isLive: true },
    { id: 'SUIUSDT', symbol: 'SUI', name: 'SUI/USDT', fullName: 'Sui', rate: '1.05', change: '-2.15%', flag: 'https://assets.coingecko.com/coins/images/26375/small/sui_logo.png', category: 'Cryptocurrency', isLive: true },
    { id: 'DOGEUSDT', symbol: 'DOGE', name: 'DOGE/USDT', fullName: 'Dogecoin', rate: '0.162400', change: '+5.40%', flag: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png', category: 'Cryptocurrency', isLive: true },
    { id: 'TRXUSDT', symbol: 'TRX', name: 'TRX/USDT', fullName: 'TRON', rate: '0.121500', change: '+0.05%', flag: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png', category: 'Cryptocurrency', isLive: true },
    { id: 'DOTUSDT', symbol: 'DOT', name: 'DOT/USDT', fullName: 'Polkadot', rate: '7.20', change: '-2.15%', flag: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png', category: 'Cryptocurrency', isLive: true },
    { id: 'LTCUSDT', symbol: 'LTC', name: 'LTC/USDT', fullName: 'Litecoin', rate: '85.40', change: '+0.80%', flag: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png', category: 'Cryptocurrency', isLive: true },
];

const FALLBACK_FOREX = [
    { id: 'fx-gbp', name: 'GBP/USD', fullName: 'British Pound / US Dollar', rate: '1.267430', change: '-0.12%', flag: 'https://flagcdn.com/w40/gb.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-eur', name: 'EUR/USD', fullName: 'Euro / US Dollar', rate: '1.085420', change: '+0.04%', flag: 'https://flagcdn.com/w40/eu.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-aud', name: 'AUD/USD', fullName: 'Australian Dollar / US Dollar', rate: '0.654000', change: '-0.15%', flag: 'https://flagcdn.com/w40/au.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-nzd', name: 'NZD/USD', fullName: 'New Zealand Dollar / US Dollar', rate: '0.602000', change: '-0.05%', flag: 'https://flagcdn.com/w40/nz.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-jpy', name: 'USD/JPY', fullName: 'US Dollar / Japanese Yen', rate: '151.42', change: '+0.25%', flag: 'https://flagcdn.com/w40/jp.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-cad', name: 'USD/CAD', fullName: 'US Dollar / Canadian Dollar', rate: '1.352000', change: '+0.10%', flag: 'https://flagcdn.com/w40/ca.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-chf', name: 'USD/CHF', fullName: 'US Dollar / Swiss Franc', rate: '0.901500', change: '+0.08%', flag: 'https://flagcdn.com/w40/ch.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-hkd', name: 'USD/HKD', fullName: 'US Dollar / Hong Kong Dollar', rate: '7.824500', change: '+0.01%', flag: 'https://flagcdn.com/w40/hk.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-inr', name: 'INR/USD', fullName: 'Indian Rupee / US Dollar', rate: '0.012000', change: '-0.05%', flag: 'https://flagcdn.com/w40/in.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-krw', name: 'USD/KRW', fullName: 'US Dollar / South Korean Won', rate: '1354.20', change: '+0.15%', flag: 'https://flagcdn.com/w40/kr.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-thb', name: 'USD/THB', fullName: 'US Dollar / Thai Baht', rate: '36.4500', change: '+0.12%', flag: 'https://flagcdn.com/w40/th.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-aed', name: 'AED/USD', fullName: 'UAE Dirham / US Dollar', rate: '0.272300', change: '+0.00%', flag: 'https://flagcdn.com/w40/ae.png', category: 'Foreign Exchange', isLive: false },
];

const STATIC_METALS = [
    { id: 'metal-1', name: 'XAU/USD', fullName: 'Gold', rate: '2,385.50', change: '+0.45%', flag: 'https://img.icons8.com/color/96/gold-bars.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-2', name: 'XAG/USD', fullName: 'Silver', rate: '28.40', change: '+1.20%', flag: 'https://img.icons8.com/color/96/silver-bars.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-4', name: 'XPT/USD', fullName: 'Platinum', rate: '965.40', change: '+0.15%', flag: 'https://img.icons8.com/color/96/silver-bars.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-5', name: 'XPD/USD', fullName: 'Palladium', rate: '1,025.15', change: '-0.85%', flag: 'https://img.icons8.com/color/96/silver-bars.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-6', name: 'XCU/USD', fullName: 'Copper', rate: '4.45', change: '+0.20%', flag: 'https://img.icons8.com/color/96/copper-ingot.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-7', name: 'ALU/USD', fullName: 'Aluminum', rate: '2,450.00', change: '-0.10%', flag: 'https://img.icons8.com/color/96/aluminum-ingot.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-9', name: 'ZNC/USD', fullName: 'Zinc', rate: '2,750.50', change: '+0.15%', flag: 'https://img.icons8.com/color/96/steel-ingot.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-10', name: 'NKL/USD', fullName: 'Nickel', rate: '17,850.00', change: '+1.15%', flag: 'https://img.icons8.com/color/96/steel-ingot.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-11', name: 'LD/USD', fullName: 'Lead', rate: '2,145.00', change: '-0.20%', flag: 'https://img.icons8.com/color/96/steel-ingot.png', category: 'Precious Metals', isLive: false },
];

// ─── Default config if DB has nothing ─────────────────────────────────────
const DEFAULT_TAB_CONFIG = {
    crypto: { useCustomPrice: false, syncIntervalSeconds: 300, lastSyncedAt: 0 },
    forex: { useCustomPrice: false, syncIntervalSeconds: 1800, lastSyncedAt: 0 },
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
        if (item.id && item.rate && item.category) {
            // Already shaped, check if symbol/id needs normalization
            let norm = item.symbol;
            if (norm === '_SUI') norm = 'SUI';
            else if (norm === '____PEPE') norm = 'PEPE';
            else if (norm === 'TONCOIN') norm = 'TON';

            if (norm !== item.symbol) {
                return {
                    ...item,
                    id: norm + 'USDT',
                    symbol: norm,
                    name: `${norm}/USDT`
                };
            }
            return item;
        }

        let lcwCode = item.code || item.symbol;
        if (!lcwCode) return null;

        let normalizedCode = lcwCode;
        if (lcwCode === '_SUI') normalizedCode = 'SUI';
        else if (lcwCode === '____PEPE') normalizedCode = 'PEPE';
        else if (lcwCode === 'TONCOIN') normalizedCode = 'TON';

        const pct = item.delta && item.delta.day ? (item.delta.day - 1) * 100 : 0;
        const sign = pct >= 0 ? '+' : '';
        return {
            id: normalizedCode + 'USDT',
            symbol: normalizedCode,
            name: `${normalizedCode}/USDT`,
            fullName: item.name || normalizedCode,
            rate: (item.rate !== null && item.rate !== undefined && !isNaN(parseFloat(item.rate))) ? (
                parseFloat(item.rate) > 100
                    ? parseFloat(item.rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : parseFloat(item.rate).toFixed(6)
            ) : '0.00',
            change: `${sign}${pct.toFixed(2)}%`,
            flag: item.png64 || item.png32 || `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${normalizedCode.toLowerCase()}.png`,
            category: 'Cryptocurrency',
            volume24h: item.volume ? (parseFloat(item.volume) / 1000000).toFixed(1) + 'M' : '0M',
            high24h: 'N/A', low24h: 'N/A',
            isLive: true,
        };
    }).filter(Boolean);
}

// ─── Helper: build forex assets from raw exchangerate-api or metals.dev data ────────────
function buildForexFromCachedRaw(raw, extraForex = []) {
    if (!raw) return null;

    let rates = null;
    let isMetalsApi = false;

    if (raw.provider === 'metals.dev') {
        rates = raw.rates;
        isMetalsApi = true;
    } else {
        rates = raw.rates?.rates || raw.rates;
    }

    if (!rates) return null;
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

    const fullNameMap = {
        'fx-gbp': 'British Pound / US Dollar',
        'fx-eur': 'Euro / US Dollar',
        'fx-aud': 'Australian Dollar / US Dollar',
        'fx-nzd': 'New Zealand Dollar / US Dollar',
        'fx-jpy': 'US Dollar / Japanese Yen',
        'fx-cad': 'US Dollar / Canadian Dollar',
        'fx-chf': 'US Dollar / Swiss Franc',
        'fx-hkd': 'US Dollar / Hong Kong Dollar',
        'fx-inr': 'Indian Rupee / US Dollar',
        'fx-krw': 'US Dollar / South Korean Won',
        'fx-thb': 'US Dollar / Thai Baht',
        'fx-aed': 'UAE Dirham / US Dollar',
    };

    return allPairs.map(pair => {
        let rate = rates[pair.rateKey];
        if (!rate) return null;
        if (isMetalsApi) {
            // metals.dev gives rate in USD (e.g. GBP = 1.27 USD).
            // If symbol ends with /USD (e.g. GBP/USD), rate is already correct.
            // If symbol does not end with /USD (e.g. USD/JPY), we want USD/JPY, which is 1 / rate.
            if (!pair.symbol.endsWith('/USD')) {
                rate = 1 / rate;
            }
        } else {
            if (pair.symbol.endsWith('/USD')) rate = 1 / rate;
        }
        return {
            id: pair.id,
            name: pair.symbol,
            fullName: fullNameMap[pair.id] || `${pair.rateKey} / US Dollar`,
            rate: rate.toFixed(6),
            change: `${(Math.random() * 0.4 - 0.2).toFixed(2)}%`, // Mock change as free API doesn't provide it
            flag: `https://flagcdn.com/w40/${pair.flag}.png`,
            category: 'Foreign Exchange',
            isLive: false,
        };
    }).filter(Boolean);
}

// ─── Helper: build metals assets from raw cached metals.dev data ────────────
function buildMetalsFromCachedRaw(cachedMetalData, extraMetals = []) {
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

    if (!cachedMetalData) return baseMetalsCombined;

    return baseMetalsCombined.map(m => {
        const nameLower = m.fullName.toLowerCase();
        let price = null;
        if (nameLower.includes('gold') && cachedMetalData.gold) price = cachedMetalData.gold;
        else if (nameLower.includes('silver') && cachedMetalData.silver) price = cachedMetalData.silver;
        else if (nameLower.includes('platinum') && cachedMetalData.platinum) price = cachedMetalData.platinum;
        else if (nameLower.includes('palladium') && cachedMetalData.palladium) price = cachedMetalData.palladium;
        else if (nameLower.includes('copper') && cachedMetalData.copper) price = cachedMetalData.copper;
        else if (nameLower.includes('aluminum') && cachedMetalData.aluminum) price = cachedMetalData.aluminum;
        else if (nameLower.includes('zinc') && cachedMetalData.zinc) price = cachedMetalData.zinc;
        else if (nameLower.includes('nickel') && cachedMetalData.nickel) price = cachedMetalData.nickel;
        else if (nameLower.includes('lead') && cachedMetalData.lead) price = cachedMetalData.lead;

        if (!price) {
            // Try dynamic symbol lookup for custom metals (e.g. LME_COPPER/USD -> lme_copper)
            const cleanSymbol = m.name.toLowerCase().split('/')[0];
            if (cleanSymbol && cachedMetalData[cleanSymbol]) {
                price = cachedMetalData[cleanSymbol];
            }
        }

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

const getCachedVisibilityAndFilter = (baseAssets) => {
    try {
        const visStr = localStorage.getItem('cached_visibility');
        const delStr = localStorage.getItem('cached_deleted_coins');
        const visibility = visStr ? JSON.parse(visStr) : {};
        const deletedCoins = delStr ? JSON.parse(delStr) : [];

        const namesCrypto = JSON.parse(localStorage.getItem('cached_custom_names_crypto') || '{}');
        const namesForex = JSON.parse(localStorage.getItem('cached_custom_names_forex') || '{}');
        const namesMetals = JSON.parse(localStorage.getItem('cached_custom_names_metals') || '{}');

        return baseAssets.map(a => {
            let nameOverride = null;
            if (a.category === 'Cryptocurrency') nameOverride = namesCrypto[a.id];
            else if (a.category === 'Foreign Exchange') nameOverride = namesForex[a.id];
            else if (a.category === 'Precious Metals') nameOverride = namesMetals[a.id];

            if (nameOverride) {
                return { ...a, fullName: nameOverride };
            }
            return a;
        }).filter(a => {
            const isDeleted = deletedCoins.includes(a.id);
            const isHidden = visibility[a.id] === false;
            return !isDeleted && !isHidden;
        });
    } catch (_) {
        return baseAssets;
    }
};

// ─── Provider ─────────────────────────────────────────────────────────────
export const MarketProvider = ({ children }) => {
    const [assets, setAssets] = useState(() => getCachedVisibilityAndFilter([...FALLBACK_FOREX, ...FALLBACK_CRYPTO, ...STATIC_METALS]));
    const [loading, setLoading] = useState(true);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [isActive, setIsActive] = useState(false);
    const [syncConfig, setSyncConfig] = useState(DEFAULT_TAB_CONFIG);

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
            const [cfgSnap, customRatesSnap, visSnap, listSnap, cryptoListSnap, forexListSnap, metalsListSnap, cryptoRatesSnap, forexRatesSnap, metalsRatesSnap] = await Promise.all([
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

            const cfg = cfgSnap.exists()
                ? {
                    crypto: { ...DEFAULT_TAB_CONFIG.crypto, ...(cfgSnap.data().crypto || {}) },
                    forex: { ...DEFAULT_TAB_CONFIG.forex, ...(cfgSnap.data().forex || {}) },
                    metals: { ...DEFAULT_TAB_CONFIG.metals, ...(cfgSnap.data().metals || {}) },
                }
                : DEFAULT_TAB_CONFIG;

            setSyncConfig(cfg);

            const cachedRates = {
                crypto: cryptoRatesSnap.exists() ? cryptoRatesSnap.data().rates : null,
                forex: forexRatesSnap.exists() ? forexRatesSnap.data() : null,
                metals: metalsRatesSnap.exists() ? metalsRatesSnap.data().rates : null,
            };
            const customRatesAll = customRatesSnap.exists() ? customRatesSnap.data() : {};
            const visibility = visSnap.exists() ? visSnap.data() : {};

            let extraCrypto = [];
            let deletedCrypto = [];
            let customNamesCrypto = {};
            let extraForex = [];
            let deletedForex = [];
            let customNamesForex = {};
            let extraMetals = [];
            let deletedMetals = [];
            let customNamesMetals = {};

            if (cryptoListSnap.exists()) {
                const d = cryptoListSnap.data();
                extraCrypto = d.crypto || [];
                deletedCrypto = d.deletedCoins || [];
                customNamesCrypto = d.customNames || {};
            }
            if (forexListSnap.exists()) {
                const d = forexListSnap.data();
                extraForex = d.forex || [];
                deletedForex = d.deletedCoins || [];
                customNamesForex = d.customNames || {};
            }
            if (metalsListSnap.exists()) {
                const d = metalsListSnap.data();
                extraMetals = d.metals || [];
                deletedMetals = d.deletedCoins || [];
                customNamesMetals = d.customNames || {};
            }

            // Fallback to legacy document if new documents don't exist yet
            if (!cryptoListSnap.exists() && !forexListSnap.exists() && !metalsListSnap.exists() && listSnap.exists()) {
                const legacyData = listSnap.data();
                extraCrypto = legacyData.crypto || legacyData.extraCoins || [];
                extraForex = legacyData.forex || [];
                extraMetals = legacyData.metals || [];

                const deletedAll = legacyData.deletedCoins || [];
                deletedCrypto = deletedAll.filter(id => !id.startsWith('fx-') && !id.startsWith('metal-'));
                deletedForex = deletedAll.filter(id => id.startsWith('fx-'));
                deletedMetals = deletedAll.filter(id => id.startsWith('metal-'));
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

                    // Default crypto codes (base list)
                    const DEFAULT_CRYPTO_CODES = [
                        'BTC', 'ETH', 'SOL', 'XRP', 'AVAX', 'LINK', 'MATIC', 'SHIB',
                        'TON', 'NEAR', 'PEPE', 'SUI', 'DOGE', 'TRX', 'DOT', 'LTC',
                    ];

                    // Only include defaults that admin has NOT deleted (deletedCrypto stores IDs like 'BTCUSDT')
                    const activeDefaultCodes = DEFAULT_CRYPTO_CODES.filter(
                        code => !deletedCrypto.includes(code + 'USDT')
                    );

                    // Merge with admin-added extra coins, remove duplicates
                    const allCodes = [...activeDefaultCodes, ...extraCrypto]
                        .filter((v, i, a) => a.indexOf(v) === i);

                    console.log('[Market][Crypto] Fetching codes from LCW:', allCodes);

                    const freshData = await fetchCryptoByDynamicCodes(allCodes);
                    if (freshData && freshData.length > 0) {
                        console.log('[MarketContext][Crypto] API response fetched from LiveCoinWatch:', freshData);
                        cryptoAssets = freshData;
                        // Store raw API response to DB
                        await setDoc(doc(db, 'coins_rates_crypto', 'latest'), {
                            rates: freshData,
                            syncedAt: now,
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
            let forexAssets = buildForexFromCachedRaw(cachedRates.forex, extraForex) || [...FALLBACK_FOREX];

            if (cfg.forex.useCustomPrice) {
                console.log('[Market][Forex] Custom price mode ON — loading from DB');
                forexAssets = applyCustomRatesToAssets(forexAssets, customRatesAll.forex);
            } else {
                const timeSince = now - (cfg.forex.lastSyncedAt || 0);
                const shouldSync = timeSince >= cfg.forex.syncIntervalSeconds * 1000;

                if (shouldSync) {
                    console.log('[Market][Forex] Sync time elapsed — fetching from metals.dev API...');
                    try {
                        const response = await fetch('https://api.metals.dev/v1/latest?api_key=DCU40FCSUKCJAJ3WJVJI9823WJVJI&currency=USD&unit=toz');
                        if (response.ok) {
                            const rawData = await response.json();
                            console.log('[MarketContext][Forex] API response fetched from metals.dev:', rawData);
                            if (rawData.status === 'success' && rawData.currencies) {
                                const forexData = {
                                    provider: 'metals.dev',
                                    rates: rawData.currencies,
                                    syncedAt: now,
                                };
                                await setDoc(doc(db, 'coins_rates_forex', 'latest'), forexData);

                                if (rawData.metals) {
                                    await setDoc(doc(db, 'coins_rates_metals', 'latest'), {
                                        rates: rawData.metals,
                                        syncedAt: now,
                                    });
                                }

                                const newCfg = {
                                    ...cfg,
                                    forex: { ...cfg.forex, lastSyncedAt: now },
                                    metals: { ...cfg.metals, lastSyncedAt: now }
                                };
                                await setDoc(doc(db, 'admin_set', 'coins_config'), newCfg);
                                console.log('[Market][Forex] API data fetched & stored to DB for Forex & Metals');

                                const built = buildForexFromCachedRaw(forexData, extraForex);
                                if (built && built.length > 0) {
                                    forexAssets = built;
                                }
                            }
                        }
                    } catch (err) {
                        console.error('[Market][Forex] Failed to fetch live forex:', err);
                        forexAssets = buildForexFromCachedRaw(cachedRates.forex, extraForex) || [...FALLBACK_FOREX];
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
            let metalAssets = buildMetalsFromCachedRaw(cachedRates.metals, extraMetals);

            if (cfg.metals.useCustomPrice) {
                console.log('[Market][Metals] Custom price mode ON — loading from DB');
                metalAssets = applyCustomRatesToAssets(metalAssets, customRatesAll.metals);
            } else {
                const timeSince = now - (cfg.metals.lastSyncedAt || 0);
                const shouldSync = forceMetals
                    || timeSince >= cfg.metals.syncIntervalSeconds * 1000;

                if (shouldSync) {
                    console.log('[Market][Metals] Sync time elapsed — fetching from metals.dev API...');
                    try {
                        const response = await fetch('https://api.metals.dev/v1/latest?api_key=DCU40FCSUKCJAJ3WJVJI9823WJVJI&currency=USD&unit=toz');
                        if (response.ok) {
                            const rawData = await response.json();
                            console.log('[MarketContext][Metals] API response fetched from metals.dev:', rawData);
                            if (rawData.status === 'success') {
                                if (rawData.metals) {
                                    await setDoc(doc(db, 'coins_rates_metals', 'latest'), {
                                        rates: rawData.metals,
                                        syncedAt: now,
                                    });
                                    metalAssets = buildMetalsFromCachedRaw(rawData.metals, extraMetals);
                                }
                                if (rawData.currencies) {
                                    await setDoc(doc(db, 'coins_rates_forex', 'latest'), {
                                        provider: 'metals.dev',
                                        rates: rawData.currencies,
                                        syncedAt: now,
                                    });
                                }

                                const newCfg = {
                                    ...cfg,
                                    metals: { ...cfg.metals, lastSyncedAt: now },
                                    forex: { ...cfg.forex, lastSyncedAt: now }
                                };
                                await setDoc(doc(db, 'admin_set', 'coins_config'), newCfg);
                                console.log('[Market][Metals] API data fetched & stored to DB for Metals & Forex');
                            }
                        }
                    } catch (err) {
                        console.error('[Market][Metals] Failed to fetch live metals:', err);
                        metalAssets = buildMetalsFromCachedRaw(cachedRates.metals, extraMetals);
                    }
                } else {
                    console.log('[Market][Metals] Using cached DB data (sync not due yet)');
                    metalAssets = buildMetalsFromCachedRaw(cachedRates.metals, extraMetals);
                }

                // Apply custom overrides on top if any
                if (customRatesAll.metals) {
                    metalAssets = applyCustomRatesToAssets(metalAssets, customRatesAll.metals);
                }
            }

            // ─────────────────────────────────────────────────────────
            // Merge + Apply visibility filter + Custom Names
            // ─────────────────────────────────────────────────────────
            const allDeletedCoins = [...deletedCrypto, ...deletedForex, ...deletedMetals];
            try {
                localStorage.setItem('cached_visibility', JSON.stringify(visibility));
                localStorage.setItem('cached_deleted_coins', JSON.stringify(allDeletedCoins));
                localStorage.setItem('cached_custom_names_crypto', JSON.stringify(customNamesCrypto));
                localStorage.setItem('cached_custom_names_forex', JSON.stringify(customNamesForex));
                localStorage.setItem('cached_custom_names_metals', JSON.stringify(customNamesMetals));
            } catch (_) { }

            // Helper to apply custom name overrides
            const applyCustomNames = (assets, namesMap) =>
                assets.map(a => namesMap[a.id] ? { ...a, fullName: namesMap[a.id] } : a);

            const filteredCrypto = applyCustomNames(
                cryptoAssets.filter(c => !deletedCrypto.includes(c.id)),
                customNamesCrypto
            );
            const filteredForex = applyCustomNames(
                forexAssets.filter(f => !deletedForex.includes(f.id)),
                customNamesForex
            );
            const filteredMetals = applyCustomNames(
                metalAssets.filter(m => !deletedMetals.includes(m.id)),
                customNamesMetals
            );

            let allAssets = [...filteredForex, ...filteredCrypto, ...filteredMetals];

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

    // ── Intervals & lifecycle ────────────────────────────────────────────
    useEffect(() => {
        if (!isActive) return;
        setLoading(true);

        // Initial load
        loadMarketData(true);

        // Check and refresh market data according to sync intervals every 30 seconds
        const apiInterval = setInterval(() => loadMarketData(false), 30_000);

        // Price simulation for live non-crypto assets (only when NOT in custom price mode)
        const simInterval = setInterval(async () => {
            // Check if metals custom mode is on before simulating
            let metalsCustom = false;
            let forexCustom = false;
            try {
                const cfgSnap = await getDoc(doc(db, 'admin_set', 'coins_config'));
                if (cfgSnap.exists()) {
                    metalsCustom = !!cfgSnap.data()?.metals?.useCustomPrice;
                    forexCustom = !!cfgSnap.data()?.forex?.useCustomPrice;
                }
            } catch (_) { /* ignore */ }

            setAssets(prev => {
                const newAssets = prev.map(asset => {
                    if (asset.isLive === false) return asset;
                    if (asset.category === 'Cryptocurrency') return asset;
                    if (asset.category === 'Precious Metals') return asset;
                    if (asset.category === 'Foreign Exchange' && forexCustom) return asset;

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
            clearInterval(simInterval);
        };
    }, [loadMarketData, isActive]);

    return (
        <MarketContext.Provider value={{ assets, loading, refreshData: loadMarketData, selectedAsset, setSelectedAsset, setIsActive, syncConfig }}>
            {children}
        </MarketContext.Provider>
    );
};

export const useMarket = () => useContext(MarketContext);
