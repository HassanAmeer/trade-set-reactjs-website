import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchCryptoByDynamicCodes, fetchMetalsBundle, fetchStockQuotes } from '../services/api';
import { db } from '../firebase-setup';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const STOCKS_SYMBOLS = ['AMZN', 'TSLA', 'NVDA', 'NDAQ'];

const MarketContext = createContext();

// ─── Fallback Data ─────────────────────────────────────────────────────────
const FALLBACK_CRYPTO = [
    { id: 'BTCUSDT', symbol: 'BTC', name: 'BTC/USDT', fullName: 'Bitcoin', rate: '74,383.07', change: '-2.05%', flag: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', category: 'Cryptocurrency', isLive: false },
    { id: 'ETHUSDT', symbol: 'ETH', name: 'ETH/USDT', fullName: 'Ethereum', rate: '2,113.94', change: '-5.54%', flag: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', category: 'Cryptocurrency', isLive: false },
    { id: 'SOLUSDT', symbol: 'SOL', name: 'SOL/USDT', fullName: 'Solana', rate: '86.08', change: '-3.89%', flag: 'https://assets.coingecko.com/coins/images/4128/small/solana.png', category: 'Cryptocurrency', isLive: false },
    { id: 'XRPUSDT', symbol: 'XRP', name: 'XRP/USDT', fullName: 'XRP', rate: '1.079984', change: '-7.25%', flag: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png', category: 'Cryptocurrency', isLive: false },
    { id: 'AVAXUSDT', symbol: 'AVAX', name: 'AVAX/USDT', fullName: 'Avalanche', rate: '8.04', change: '-2.20%', flag: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png', category: 'Cryptocurrency', isLive: false },
    { id: 'LINKUSDT', symbol: 'LINK', name: 'LINK/USDT', fullName: 'Chainlink', rate: '10.51', change: '-2.97%', flag: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png', category: 'Cryptocurrency', isLive: false },
    { id: 'MATICUSDT', symbol: 'MATIC', name: 'MATIC/USDT', fullName: 'Polygon', rate: '0.088236', change: '-2.10%', flag: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png', category: 'Cryptocurrency', isLive: false },
    { id: 'SHIBUSDT', symbol: 'SHIB', name: 'SHIB/USDT', fullName: 'Shiba Inu', rate: '0.000004', change: '-2.13%', flag: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png', category: 'Cryptocurrency', isLive: false },
    { id: 'TONUSDT', symbol: 'TON', name: 'TON/USDT', fullName: 'Toncoin', rate: '1.026441', change: '-4.38%', flag: 'https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png', category: 'Cryptocurrency', isLive: false },
    { id: 'NEARUSDT', symbol: 'NEAR', name: 'NEAR/USDT', fullName: 'NEAR Protocol', rate: '3.505502', change: '-6.32%', flag: 'https://assets.coingecko.com/coins/images/10365/small/near_icon.png', category: 'Cryptocurrency', isLive: false },
    { id: 'PEPEUSDT', symbol: 'PEPE', name: 'PEPE/USDT', fullName: 'Pepe', rate: '0.000005', change: '+0.20%', flag: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token-icon.png', category: 'Cryptocurrency', isLive: false },
    { id: 'SUIUSDT', symbol: 'SUI', name: 'SUI/USDT', fullName: 'Sui', rate: '0.824806', change: '-3.71%', flag: 'https://assets.coingecko.com/coins/images/26375/small/sui_logo.png', category: 'Cryptocurrency', isLive: false },
    { id: 'DOGEUSDT', symbol: 'DOGE', name: 'DOGE/USDT', fullName: 'Dogecoin', rate: '0.068890', change: '-3.67%', flag: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png', category: 'Cryptocurrency', isLive: false },
    { id: 'TRXUSDT', symbol: 'TRX', name: 'TRX/USDT', fullName: 'TRON', rate: '0.317017', change: '-0.96%', flag: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png', category: 'Cryptocurrency', isLive: false },
    { id: 'DOTUSDT', symbol: 'DOT', name: 'DOT/USDT', fullName: 'Polkadot', rate: '0.861308', change: '-5.06%', flag: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png', category: 'Cryptocurrency', isLive: false },
    { id: 'LTCUSDT', symbol: 'LTC', name: 'LTC/USDT', fullName: 'Litecoin', rate: '50.722437', change: '-2.38%', flag: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png', category: 'Cryptocurrency', isLive: false },
];

const FALLBACK_FOREX = [
    { id: 'fx-gbp', name: 'GBP/USD', fullName: 'British Pound / US Dollar', rate: '1.341966', change: '+0.00%', flag: 'https://flagcdn.com/w40/gb.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-eur', name: 'EUR/USD', fullName: 'Euro / US Dollar', rate: '1.119282', change: '+0.00%', flag: 'https://flagcdn.com/w40/eu.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-aud', name: 'AUD/USD', fullName: 'Australian Dollar / US Dollar', rate: '0.690122', change: '+0.00%', flag: 'https://flagcdn.com/w40/au.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-nzd', name: 'NZD/USD', fullName: 'New Zealand Dollar / US Dollar', rate: '0.560769', change: '+0.00%', flag: 'https://flagcdn.com/w40/nz.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-jpy', name: 'USD/JPY', fullName: 'US Dollar / Japanese Yen', rate: '157.984', change: '+0.00%', flag: 'https://flagcdn.com/w40/jp.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-cad', name: 'USD/CAD', fullName: 'US Dollar / Canadian Dollar', rate: '1.408516', change: '+0.00%', flag: 'https://flagcdn.com/w40/ca.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-chf', name: 'USD/CHF', fullName: 'US Dollar / Swiss Franc', rate: '0.818193', change: '+0.00%', flag: 'https://flagcdn.com/w40/ch.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-hkd', name: 'USD/HKD', fullName: 'US Dollar / Hong Kong Dollar', rate: '7.841660', change: '+0.00%', flag: 'https://flagcdn.com/w40/hk.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-inr', name: 'INR/USD', fullName: 'Indian Rupee / US Dollar', rate: '0.010648', change: '+0.00%', flag: 'https://flagcdn.com/w40/in.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-krw', name: 'USD/KRW', fullName: 'US Dollar / South Korean Won', rate: '1348.32', change: '+0.00%', flag: 'https://flagcdn.com/w40/kr.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-thb', name: 'USD/THB', fullName: 'US Dollar / Thai Baht', rate: '33.5380', change: '+0.00%', flag: 'https://flagcdn.com/w40/th.png', category: 'Foreign Exchange', isLive: false },
    { id: 'fx-aed', name: 'AED/USD', fullName: 'UAE Dirham / US Dollar', rate: '0.272294', change: '+0.00%', flag: 'https://flagcdn.com/w40/ae.png', category: 'Foreign Exchange', isLive: false },
];

const STATIC_METALS = [
    { id: 'metal-1', name: 'XAU/USD', fullName: 'Gold', rate: '4,096.70', change: '+0.00%', flag: 'https://img.icons8.com/color/96/gold-bars.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-2', name: 'XAG/USD', fullName: 'Silver', rate: '52.52', change: '+0.00%', flag: 'https://img.icons8.com/color/96/silver-bars.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-4', name: 'XPT/USD', fullName: 'Platinum', rate: '1,547.80', change: '+0.00%', flag: 'https://img.icons8.com/color/96/silver-bars.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-5', name: 'XPD/USD', fullName: 'Palladium', rate: '1,028.82', change: '+0.00%', flag: 'https://img.icons8.com/color/96/silver-bars.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-6', name: 'XCU/USD', fullName: 'Copper', rate: '13,779.81', change: '+0.00%', flag: 'https://img.icons8.com/color/96/copper-ingot.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-7', name: 'ALU/USD', fullName: 'Aluminum', rate: '3,051.11', change: '+0.00%', flag: 'https://img.icons8.com/color/96/aluminum-ingot.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-9', name: 'ZNC/USD', fullName: 'Zinc', rate: '3,735.02', change: '+0.00%', flag: 'https://img.icons8.com/color/96/steel-ingot.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-10', name: 'NKL/USD', fullName: 'Nickel', rate: '16,281.14', change: '+0.00%', flag: 'https://img.icons8.com/color/96/steel-ingot.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-11', name: 'LD/USD', fullName: 'Lead', rate: '1,887.25', change: '+0.00%', flag: 'https://img.icons8.com/color/96/steel-ingot.png', category: 'Precious Metals', isLive: false },
];

// ─── Fallback Stocks Data ───────────────────────────────────────────────────
const FALLBACK_STOCKS = [
    { id: 'stock-AMZN', symbol: 'AMZN', name: 'AMZN/USD', fullName: 'Amazon.com Inc.', rate: '259.30', change: '-0.35%', flag: 'https://logo.clearbit.com/amazon.com', category: 'Stocks', isLive: false },
    { id: 'stock-TSLA', symbol: 'TSLA', name: 'TSLA/USD', fullName: 'Tesla Inc.', rate: '358.22', change: '+4.23%', flag: 'https://logo.clearbit.com/tesla.com', category: 'Stocks', isLive: false },
    { id: 'stock-NVDA', symbol: 'NVDA', name: 'NVDA/USD', fullName: 'NVIDIA Corporation', rate: '186.64', change: '+2.78%', flag: 'https://logo.clearbit.com/nvidia.com', category: 'Stocks', isLive: false },
    { id: 'stock-NDAQ', symbol: 'NDAQ', name: 'NDAQ/USD', fullName: 'Nasdaq Inc.', rate: '107.12', change: '+0.27%', flag: 'https://logo.clearbit.com/nasdaq.com', category: 'Stocks', isLive: false },
];

// ─── Default config if DB has nothing ─────────────────────────────────────
const DEFAULT_TAB_CONFIG = {
    crypto: { useCustomPrice: false, syncIntervalSeconds: 300, lastSyncedAt: 0 },
    forex: { useCustomPrice: false, syncIntervalSeconds: 1800, lastSyncedAt: 0 },
    metals: { useCustomPrice: false, syncIntervalSeconds: 21600, lastSyncedAt: 0 },
    stocks: { useCustomPrice: false, syncIntervalSeconds: 3600, lastSyncedAt: 0 },
};

// ─── Rate helpers ──────────────────────────────────────────────────────────
const LAST_GOOD_CACHE_KEY = 'market_last_good_assets_v1';
const LAST_GOOD_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const CHANGE_MAX_ABS_PCT = 40;
const API_BACKOFF_MS = 5 * 60 * 1000;
const API_QUOTA_BACKOFF_MS = 6 * 60 * 60 * 1000;

const apiBackoffUntil = {};

function isApiBackedOff(key) {
    return Date.now() < (apiBackoffUntil[key] || 0);
}

function applyApiBackoff(key, error) {
    const status = error?.status;
    const quotaHit = status === 429 || /quota|rate limit|limit exceeded/i.test(error?.message || '');
    apiBackoffUntil[key] = Date.now() + (quotaHit ? API_QUOTA_BACKOFF_MS : API_BACKOFF_MS);
}

function clearApiBackoff(key) {
    delete apiBackoffUntil[key];
}

function parseRateNumber(value) {
    if (value === null || value === undefined) return null;
    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''));
    return Number.isFinite(num) ? num : null;
}

function formatChange(pct) {
    if (pct === null || pct === undefined || !Number.isFinite(pct)) return '+0.00%';
    const rounded = Math.abs(pct) < 0.005 ? 0 : pct;
    return `${rounded >= 0 ? '+' : ''}${rounded.toFixed(2)}%`;
}

function computeChangePct(currentRate, baselineRate) {
    const current = parseRateNumber(currentRate);
    const baseline = parseRateNumber(baselineRate);
    if (current === null || baseline === null || baseline === 0) return null;
    const pct = ((current - baseline) / baseline) * 100;
    // Guard against unit changes (e.g. an old per-ounce metals snapshot).
    if (!Number.isFinite(pct) || Math.abs(pct) > CHANGE_MAX_ABS_PCT) return null;
    return pct;
}

// Keep a ~24h baseline so forex/metals can show a real percentage change.
function nextBaseline(oldDoc, now) {
    const baseline = oldDoc?.baseline;
    const baselineAt = oldDoc?.baselineAt || 0;
    if (baseline && now - baselineAt < 48 * 60 * 60 * 1000) {
        return { baseline, baselineAt };
    }
    if (!oldDoc?.rates) return { baseline: null, baselineAt: now };
    return { baseline: oldDoc.rates, baselineAt: oldDoc.syncedAt || now };
}

const METAL_SYMBOL_KEYS = {
    XAU: 'gold',
    XAG: 'silver',
    XPT: 'platinum',
    XPD: 'palladium',
    XCU: 'copper',
    ALU: 'aluminum',
    ZNC: 'zinc',
    NKL: 'nickel',
    LD: 'lead',
};

const METAL_NAME_KEYS = ['gold', 'silver', 'platinum', 'palladium', 'copper', 'aluminum', 'zinc', 'nickel', 'lead'];

function getMetalKey(asset) {
    const symbol = (asset.name || '').split('/')[0].toUpperCase();
    if (METAL_SYMBOL_KEYS[symbol]) return METAL_SYMBOL_KEYS[symbol];
    const name = (asset.fullName || '').toLowerCase();
    return METAL_NAME_KEYS.find(key => name.includes(key)) || null;
}

function readLastGoodAssets() {
    try {
        const parsed = JSON.parse(localStorage.getItem(LAST_GOOD_CACHE_KEY) || 'null');
        if (!parsed || !Array.isArray(parsed.assets) || !parsed.assets.length) return null;
        if (parsed.savedAt && Date.now() - parsed.savedAt > LAST_GOOD_MAX_AGE_MS) return null;
        return parsed.assets;
    } catch (_) {
        return null;
    }
}

function writeLastGoodAssets(assets) {
    try {
        localStorage.setItem(LAST_GOOD_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), assets }));
    } catch (_) {
        // Storage may be full or disabled — caching is best effort.
    }
}

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
    const baseline = raw.baseline || null;
    const updatedAt = raw.syncedAt || 0;
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
        const rawRate = parseRateNumber(rates[pair.rateKey]);
        if (!rawRate) return null;

        // metals.dev provides USD per unit of currency; exchangerate-api provides
        // units of currency per USD. USD/XXX pairs are the inverse of both.
        const inverted = isMetalsApi
            ? !pair.symbol.endsWith('/USD')
            : pair.symbol.endsWith('/USD');

        const rate = inverted ? 1 / rawRate : rawRate;
        const rawPct = computeChangePct(rawRate, baseline?.[pair.rateKey]);
        const pct = rawPct === null ? null : (inverted ? -rawPct : rawPct);

        return {
            id: pair.id,
            name: pair.symbol,
            fullName: fullNameMap[pair.id] || `${pair.rateKey} / US Dollar`,
            rate: rate.toFixed(6),
            change: formatChange(pct),
            flag: `https://flagcdn.com/w40/${pair.flag}.png`,
            category: 'Foreign Exchange',
            isLive: false,
            updatedAt,
        };
    }).filter(Boolean);
}

// ─── Helper: build metals assets from raw cached metals.dev data ────────────
function buildMetalsFromCachedRaw(cachedMetalDoc, extraMetals = []) {
    const extraMetalsList = extraMetals.map((str, idx) => {
        const parts = str.split('|');
        const symbol = parts[0]?.trim() || 'UNKNOWN/USD';
        const name = parts[1]?.trim() || symbol;
        return {
            id: `metal-extra-${idx}`,
            name: symbol,
            fullName: name,
            rate: '0.00', // default rate, admin should set custom rate
            change: '+0.00%',
            flag: 'https://img.icons8.com/color/96/steel-ingot.png', // generic metal icon
            category: 'Precious Metals',
            isLive: false,
        };
    });

    const baseMetalsCombined = [...STATIC_METALS, ...extraMetalsList];

    const rates = cachedMetalDoc?.rates || cachedMetalDoc || null;
    if (!rates) return baseMetalsCombined;

    const baseline = cachedMetalDoc?.baseline || null;
    const updatedAt = cachedMetalDoc?.syncedAt || 0;

    return baseMetalsCombined.map(m => {
        const key = getMetalKey(m);
        let price = key ? parseRateNumber(rates[key]) : null;

        if (!price) {
            // Try dynamic symbol lookup for custom metals (e.g. LME_COPPER/USD -> lme_copper)
            const cleanSymbol = m.name.toLowerCase().split('/')[0];
            if (cleanSymbol && rates[cleanSymbol]) {
                price = parseRateNumber(rates[cleanSymbol]);
            }
        }

        if (price) {
            return {
                ...m,
                rate: price > 100
                    ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : price.toFixed(price < 1 ? 4 : 2),
                change: formatChange(computeChangePct(price, baseline?.[key || m.name.toLowerCase().split('/')[0]])),
                isLive: true,
                updatedAt,
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

// ─── Helper: build stocks assets from raw twelvedata response ─────────────
function buildStocksFromCachedRaw(cachedStockDoc, extraStocks = [], deletedStocks = []) {
    const baseStocks = FALLBACK_STOCKS.filter(s => !deletedStocks.includes(s.id));
    // Merge with extra stocks added by admin
    const extraStockAssets = (extraStocks || []).map(symbol => ({
        id: `stock-${symbol}`,
        symbol,
        name: `${symbol}/USD`,
        fullName: symbol,
        rate: '0.00',
        change: '+0.00%',
        flag: `https://logo.clearbit.com/${symbol.toLowerCase()}.com`,
        category: 'Stocks',
        isLive: false,
    })).filter(s => !deletedStocks.includes(s.id));

    const allStocks = [
        ...baseStocks,
        ...extraStockAssets.filter(e => !baseStocks.find(b => b.id === e.id)),
    ];

    const rawRates = cachedStockDoc?.rates || cachedStockDoc || null;
    const updatedAt = cachedStockDoc?.syncedAt || 0;

    if (!rawRates) return allStocks;

    return allStocks.map(stock => {
        const raw = rawRates[stock.symbol];
        const rawPrice = raw ? (raw.price ?? raw.close) : null;
        if (rawPrice !== undefined && rawPrice !== null) {
            const price = parseFloat(rawPrice);
            if (!isNaN(price)) {
                const pct = raw.percent_change !== undefined && raw.percent_change !== null
                    ? parseFloat(raw.percent_change)
                    : (raw.previous_close ? computeChangePct(price, raw.previous_close) : null);
                return {
                    ...stock,
                    rate: price > 100
                        ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : price.toFixed(2),
                    change: formatChange(Number.isFinite(pct) ? pct : null),
                    isLive: true,
                    updatedAt,
                };
            }
        }
        return stock;
    });
}

// ─── Provider ─────────────────────────────────────────────────────────────
export const MarketProvider = ({ children }) => {
    const [assets, setAssets] = useState(() => getCachedVisibilityAndFilter(
        readLastGoodAssets() || [...FALLBACK_FOREX, ...FALLBACK_CRYPTO, ...STATIC_METALS, ...FALLBACK_STOCKS]
    ));
    const [loading, setLoading] = useState(true);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [isActive, setIsActive] = useState(false);
    const [syncConfig, setSyncConfig] = useState(DEFAULT_TAB_CONFIG);
    const [lastUpdated, setLastUpdated] = useState({ crypto: 0, forex: 0, metals: 0, stocks: 0 });

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
            const [cfgSnap, customRatesSnap, visSnap, listSnap, cryptoListSnap, forexListSnap, metalsListSnap, cryptoRatesSnap, forexRatesSnap, metalsRatesSnap, stocksListSnap, stocksRatesSnap] = await Promise.all([
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
                getDoc(doc(db, 'coins_list_stocks', 'latest')),
                getDoc(doc(db, 'coins_rates_stocks', 'latest')),
            ]);

            const cfg = cfgSnap.exists()
                ? {
                    crypto: { ...DEFAULT_TAB_CONFIG.crypto, ...(cfgSnap.data().crypto || {}) },
                    forex: { ...DEFAULT_TAB_CONFIG.forex, ...(cfgSnap.data().forex || {}) },
                    metals: { ...DEFAULT_TAB_CONFIG.metals, ...(cfgSnap.data().metals || {}) },
                    stocks: { ...DEFAULT_TAB_CONFIG.stocks, ...(cfgSnap.data().stocks || {}) },
                }
                : DEFAULT_TAB_CONFIG;

            setSyncConfig(cfg);

            const cachedRates = {
                crypto: cryptoRatesSnap.exists() ? cryptoRatesSnap.data().rates : null,
                forex: forexRatesSnap.exists() ? forexRatesSnap.data() : null,
                metals: metalsRatesSnap.exists() ? metalsRatesSnap.data() : null,
                stocks: stocksRatesSnap.exists() ? stocksRatesSnap.data() : null,
            };
            let dataWasReal = Boolean(
                (cachedRates.crypto && cachedRates.crypto.length) ||
                cachedRates.forex?.rates ||
                cachedRates.metals?.rates ||
                cachedRates.stocks?.rates
            );
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
            let extraStocks = [];
            let deletedStocks = [];
            let customNamesStocks = {};

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
            if (stocksListSnap.exists()) {
                const d = stocksListSnap.data();
                extraStocks = d.stocks || [];
                deletedStocks = d.deletedCoins || [];
                customNamesStocks = d.customNames || {};
            }

            // Fallback to legacy document if new documents don't exist yet
            if (!cryptoListSnap.exists() && !forexListSnap.exists() && !metalsListSnap.exists() && listSnap.exists()) {
                const legacyData = listSnap.data();
                extraCrypto = legacyData.crypto || legacyData.extraCoins || [];
                extraForex = legacyData.forex || [];
                extraMetals = legacyData.metals || [];

                const deletedAll = legacyData.deletedCoins || [];
                deletedCrypto = deletedAll.filter(id => !id.startsWith('fx-') && !id.startsWith('metal-') && !id.startsWith('stock-'));
                deletedForex = deletedAll.filter(id => id.startsWith('fx-'));
                deletedMetals = deletedAll.filter(id => id.startsWith('metal-'));
            }

            const now = Date.now();

            const syncedStamps = {
                crypto: cryptoRatesSnap.exists() ? (cryptoRatesSnap.data().syncedAt || 0) : 0,
                forex: forexRatesSnap.exists() ? (forexRatesSnap.data().syncedAt || 0) : 0,
                metals: metalsRatesSnap.exists() ? (metalsRatesSnap.data().syncedAt || 0) : 0,
                stocks: stocksRatesSnap.exists() ? (stocksRatesSnap.data().syncedAt || 0) : 0,
            };

            // ─────────────────────────────────────────────────────────
            // CRYPTO
            // ─────────────────────────────────────────────────────────
            let cryptoAssets = buildCryptoFromCachedRaw(cachedRates.crypto) || [...FALLBACK_CRYPTO];

            if (cfg.crypto.useCustomPrice) {
                // Custom mode: apply saved custom rates to cached/fallback data
                console.log('[Market][Crypto] Custom price mode ON — loading from DB');
                cryptoAssets = applyCustomRatesToAssets(cryptoAssets, customRatesAll.crypto);
            } else {
                const timeSince = now - (cfg.crypto.lastSyncedAt || 0);
                const shouldSync = timeSince >= cfg.crypto.syncIntervalSeconds * 1000;

                if (shouldSync && !isApiBackedOff('crypto')) {
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

                    try {
                        const freshData = await fetchCryptoByDynamicCodes(allCodes);
                        if (freshData && freshData.length > 0) {
                            console.log('[MarketContext][Crypto] API response fetched from LiveCoinWatch:', freshData);
                            cryptoAssets = freshData;
                            dataWasReal = true;
                            // Store raw API response to DB
                            await setDoc(doc(db, 'coins_rates_crypto', 'latest'), {
                                rates: freshData,
                                syncedAt: now,
                            });
                            // Update only lastSyncedAt so parallel tabs cannot clobber config
                            await setDoc(doc(db, 'admin_set', 'coins_config'), {
                                crypto: { lastSyncedAt: now },
                            }, { merge: true });
                            setSyncConfig(prev => ({ ...prev, crypto: { ...prev.crypto, lastSyncedAt: now } }));
                            syncedStamps.crypto = now;
                            clearApiBackoff('crypto');
                            console.log('[Market][Crypto] API data fetched & stored to DB');
                        }
                    } catch (err) {
                        console.error('[Market][Crypto] Failed to fetch live crypto:', err);
                        applyApiBackoff('crypto', err);
                    }
                } else {
                    console.log('[Market][Crypto] Using cached DB data (sync not due yet)');
                }
            }

            // ─────────────────────────────────────────────────────────
            // FOREX + METALS (one metals.dev request feeds both)
            // ─────────────────────────────────────────────────────────
            let forexDocData = cachedRates.forex;
            let metalsDocData = cachedRates.metals;

            const forexDue = !cfg.forex.useCustomPrice
                && now - (cfg.forex.lastSyncedAt || 0) >= cfg.forex.syncIntervalSeconds * 1000;
            // Old snapshots stored base metals per troy ounce (copper ~0.44).
            // Treat them as stale so the normalised per-tonne values load immediately.
            const storedMetalRates = cachedRates.metals?.rates || {};
            const metalsUnitStale = typeof storedMetalRates.copper === 'number' && storedMetalRates.copper > 0 && storedMetalRates.copper < 50;
            const metalsDue = !cfg.metals.useCustomPrice
                && (forceMetals || metalsUnitStale || now - (cfg.metals.lastSyncedAt || 0) >= cfg.metals.syncIntervalSeconds * 1000);

            if ((forexDue || metalsDue) && !isApiBackedOff('metals')) {
                console.log('[Market][Forex+Metals] Sync time elapsed — fetching from metals.dev API...');
                try {
                    const bundle = await fetchMetalsBundle();
                    const fetchedAt = Date.now();
                    dataWasReal = true;

                    if (bundle.currencies && Object.keys(bundle.currencies).length) {
                        const { baseline, baselineAt } = nextBaseline(forexDocData, fetchedAt);
                        forexDocData = {
                            provider: 'metals.dev',
                            rates: bundle.currencies,
                            syncedAt: fetchedAt,
                            baseline,
                            baselineAt,
                        };
                        await setDoc(doc(db, 'coins_rates_forex', 'latest'), forexDocData);
                    }

                    if (bundle.metals && Object.keys(bundle.metals).length) {
                        const { baseline, baselineAt } = nextBaseline(metalsDocData, fetchedAt);
                        // A partial (precious-only) fallback must keep cached base metals.
                        const previousMetals = metalsDocData?.rates || {};
                        const nextMetals = bundle.partial
                            ? { ...previousMetals, ...bundle.metals }
                            : bundle.metals;
                        metalsDocData = {
                            rates: nextMetals,
                            syncedAt: fetchedAt,
                            baseline,
                            baselineAt,
                        };
                        await setDoc(doc(db, 'coins_rates_metals', 'latest'), metalsDocData);
                    }

                    await setDoc(doc(db, 'admin_set', 'coins_config'), {
                        forex: { lastSyncedAt: fetchedAt },
                        metals: { lastSyncedAt: fetchedAt },
                    }, { merge: true });

                    setSyncConfig(prev => ({
                        ...prev,
                        forex: { ...prev.forex, lastSyncedAt: fetchedAt },
                        metals: { ...prev.metals, lastSyncedAt: fetchedAt },
                    }));

                    syncedStamps.forex = fetchedAt;
                    syncedStamps.metals = fetchedAt;

                    clearApiBackoff('metals');
                    console.log('[Market][Forex+Metals] API data fetched & stored to DB');
                } catch (err) {
                    console.error('[Market][Forex+Metals] Failed to fetch live metals/forex:', err);
                    applyApiBackoff('metals', err);
                }
            } else {
                console.log('[Market][Forex+Metals] Using cached DB data');
            }

            let forexAssets = buildForexFromCachedRaw(forexDocData, extraForex) || [...FALLBACK_FOREX];
            if (cfg.forex.useCustomPrice) {
                console.log('[Market][Forex] Custom price mode ON — loading from DB');
                forexAssets = applyCustomRatesToAssets(forexAssets, customRatesAll.forex);
            }

            let metalAssets = buildMetalsFromCachedRaw(metalsDocData, extraMetals);
            if (cfg.metals.useCustomPrice) {
                console.log('[Market][Metals] Custom price mode ON — loading from DB');
                metalAssets = applyCustomRatesToAssets(metalAssets, customRatesAll.metals);
            }

            // ─────────────────────────────────────────────────────────
            // STOCKS
            // ─────────────────────────────────────────────────────────
            let stockDocData = cachedRates.stocks;
            let stockAssets = buildStocksFromCachedRaw(stockDocData, extraStocks, deletedStocks);

            if (cfg.stocks.useCustomPrice) {
                console.log('[Market][Stocks] Custom price mode ON — loading from DB');
                stockAssets = applyCustomRatesToAssets(stockAssets, customRatesAll.stocks);
            } else {
                const timeSince = now - (cfg.stocks.lastSyncedAt || 0);
                const shouldSync = timeSince >= cfg.stocks.syncIntervalSeconds * 1000;

                if (shouldSync && !isApiBackedOff('stocks')) {
                    console.log('[Market][Stocks] Sync time elapsed — fetching from TwelveData API...');
                    try {
                        // Collect all symbols (base + extra)
                        const allSymbols = [
                            ...STOCKS_SYMBOLS,
                            ...(extraStocks || []),
                        ].filter((v, i, a) => a.indexOf(v) === i);

                        const rawData = await fetchStockQuotes(allSymbols);
                        const symbolCount = Object.values(rawData || {}).filter(v => v && v.close !== undefined).length;
                        if (symbolCount > 0) {
                            console.log('[MarketContext][Stocks] API response from TwelveData:', rawData);
                            stockDocData = { rates: rawData, syncedAt: Date.now() };
                            dataWasReal = true;
                            // Store raw rates to DB
                            await setDoc(doc(db, 'coins_rates_stocks', 'latest'), stockDocData);
                            await setDoc(doc(db, 'admin_set', 'coins_config'), {
                                stocks: { lastSyncedAt: stockDocData.syncedAt },
                            }, { merge: true });
                            setSyncConfig(prev => ({ ...prev, stocks: { ...prev.stocks, lastSyncedAt: stockDocData.syncedAt } }));
                            syncedStamps.stocks = stockDocData.syncedAt;
                            clearApiBackoff('stocks');
                            console.log('[Market][Stocks] API data fetched & stored to DB');
                            stockAssets = buildStocksFromCachedRaw(stockDocData, extraStocks, deletedStocks);
                        }
                    } catch (err) {
                        console.error('[Market][Stocks] Failed to fetch live stocks:', err);
                        applyApiBackoff('stocks', err);
                    }
                } else {
                    console.log('[Market][Stocks] Using cached DB data (sync not due yet)');
                }
            }

            // ─────────────────────────────────────────────────────────
            // Merge + Apply visibility filter + Custom Names
            // ─────────────────────────────────────────────────────────
            const allDeletedCoins = [...deletedCrypto, ...deletedForex, ...deletedMetals, ...deletedStocks];
            try {
                localStorage.setItem('cached_visibility', JSON.stringify(visibility));
                localStorage.setItem('cached_deleted_coins', JSON.stringify(allDeletedCoins));
                localStorage.setItem('cached_custom_names_crypto', JSON.stringify(customNamesCrypto));
                localStorage.setItem('cached_custom_names_forex', JSON.stringify(customNamesForex));
                localStorage.setItem('cached_custom_names_metals', JSON.stringify(customNamesMetals));
                localStorage.setItem('cached_custom_names_stocks', JSON.stringify(customNamesStocks));
            } catch (_) { }

            // Helper to apply custom name overrides
            const applyCustomNames = (assets, namesMap) =>
                assets.map(a => namesMap[a.id] ? { ...a, fullName: namesMap[a.id] } : a);

            const stampAssets = (list, ts) => list.map(a => ({ ...a, updatedAt: ts || a.updatedAt || 0 }));

            cryptoAssets = stampAssets(cryptoAssets, syncedStamps.crypto);
            forexAssets = stampAssets(forexAssets, syncedStamps.forex);
            metalAssets = stampAssets(metalAssets, syncedStamps.metals);
            stockAssets = stampAssets(stockAssets, syncedStamps.stocks);

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
            const filteredStocks = applyCustomNames(
                stockAssets.filter(s => !deletedStocks.includes(s.id)),
                customNamesStocks
            );

            let allAssets = [...filteredForex, ...filteredCrypto, ...filteredMetals, ...filteredStocks];

            // Hide coins that admin set to false in coins_visibility
            if (Object.keys(visibility).length > 0) {
                allAssets = allAssets.filter(a => visibility[a.id] !== false);
            }

            setAssets(allAssets);
            setLastUpdated({ ...syncedStamps });
            if (dataWasReal && allAssets.length > 0) {
                writeLastGoodAssets(allAssets);
            }
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

        // Initial load (fetch only tabs whose interval has elapsed)
        loadMarketData(false);

        // Check and refresh market data according to sync intervals every 30 seconds
        const apiInterval = setInterval(() => loadMarketData(false), 30_000);

        return () => {
            clearInterval(apiInterval);
        };
    }, [loadMarketData, isActive]);

    return (
        <MarketContext.Provider value={{ assets, loading, refreshData: loadMarketData, selectedAsset, setSelectedAsset, setIsActive, syncConfig, lastUpdated }}>
            {children}
        </MarketContext.Provider>
    );
};

export const useMarket = () => useContext(MarketContext);
