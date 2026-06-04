/**
 * API service for fetching market data.
 */

const CMC_API_KEY = '055fbbf5675e46e589d62f10f894a56d';
const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com/v1';

const METALS_DEV_KEY = 'DNOEU1OR0Q4QPTXKHGE1802XKHGE1';
const GOLD_API_KEY = 'goldapi-cd9d69369cfe98af15d8f6fa095fb59e-io'; // Add your GoldAPI.io key here if Metals.dev fails

export const fetchCryptoMarkets = async () => {
    try {
        const response = await fetch("https://api.livecoinwatch.com/coins/map", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-api-key": "20c87391-6c37-4e83-a9cb-ad52ab7a3da2",
            },
            body: JSON.stringify({
                codes: ["BTC", "ETH", "SOL", "XRP", "AVAX", "LINK", "MATIC", "SHIB", "TONCOIN", "NEAR", "____PEPE", "_SUI", "DOGE", "TRX", "DOT", "LTC"],
                currency: "USD",
                sort: "rank",
                order: "ascending",
                offset: 0,
                limit: 0,
                meta: true,
            }),
        });
        if (!response.ok) throw new Error('LiveCoinWatch response not ok');
        const data = await response.json();

        return data.map(item => {
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
    } catch (error) {
        console.error('Error fetching crypto markets (LiveCoinWatch):', error);
        return [];
    }
};

/**
 * Fetches crypto markets for a dynamic set of coin codes.
 * Used when admin adds extra coins via the Coins Management panel.
 * @param {string[]} codes - Array of coin codes e.g. ['BTC','ETH','GRIN']
 * @returns {Promise<Array>} List of mapped crypto assets.
 */
export const fetchCryptoByDynamicCodes = async (codes = []) => {
    if (!codes.length) return [];

    // Map standard codes to LiveCoinWatch specific codes
    const mappedCodes = codes.map(c => {
        const upper = c.toUpperCase();
        if (upper === 'SUI') return '_SUI';
        if (upper === 'PEPE') return '____PEPE';
        if (upper === 'TON') return 'TONCOIN';
        return c;
    });

    try {
        const response = await fetch('https://api.livecoinwatch.com/coins/map', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-api-key': '20c87391-6c37-4e83-a9cb-ad52ab7a3da2',
            },
            body: JSON.stringify({
                codes: mappedCodes,
                currency: 'USD',
                sort: 'rank',
                order: 'ascending',
                offset: 0,
                limit: 0,
                meta: true,
            }),
        });
        if (!response.ok) throw new Error('LiveCoinWatch dynamic fetch not ok');
        const data = await response.json();
        return data.map(item => {
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
    } catch (error) {
        console.error('Error fetching dynamic crypto markets:', error);
        return [];
    }
};

/**
 * Fetches forex market data.
 * @returns {Promise<Array>} List of mapped forex assets.
 */
export const fetchForexMarkets = async () => {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        const rates = data.rates;

        // Define important currency pairs
        const pairs = [
            { id: 'gbp', symbol: 'GBP/USD', flag: 'gb', rateKey: 'GBP' },
            { id: 'eur', symbol: 'EUR/USD', flag: 'eu', rateKey: 'EUR' },
            { id: 'aud', symbol: 'AUD/USD', flag: 'au', rateKey: 'AUD' },
            { id: 'nzd', symbol: 'NZD/USD', flag: 'nz', rateKey: 'NZD' },
            { id: 'jpy', symbol: 'USD/JPY', flag: 'jp', rateKey: 'JPY' },
            { id: 'cad', symbol: 'USD/CAD', flag: 'ca', rateKey: 'CAD' },
            { id: 'chf', symbol: 'USD/CHF', flag: 'ch', rateKey: 'CHF' },
            { id: 'hkd', symbol: 'USD/HKD', flag: 'hk', rateKey: 'HKD' },
            { id: 'inr', symbol: 'INR/USD', flag: 'in', rateKey: 'INR' },
            { id: 'krw', symbol: 'USD/KRW', flag: 'kr', rateKey: 'KRW' },
            { id: 'thb', symbol: 'USD/THB', flag: 'th', rateKey: 'THB' },
            { id: 'aed', symbol: 'AED/USD', flag: 'ae', rateKey: 'AED' },
        ];

        return pairs.map(pair => {
            let rate = rates[pair.rateKey];
            // If it's something like EUR/USD, we usually want 1 EUR in USD
            // exchangerate-api provides 1 USD in EUR. So we take inverse for some.
            if (pair.symbol.endsWith('/USD')) {
                rate = 1 / rate;
            }

            return {
                id: `fx-${pair.id}`,
                name: pair.symbol,
                rate: rate.toFixed(6),
                change: `${(Math.random() * 0.4 - 0.2).toFixed(2)}%`, // Mock change as free API doesn't provide it
                flag: `https://flagcdn.com/w40/${pair.flag}.png`,
                category: 'Foreign Exchange',
                isLive: true
            };
        });
    } catch (error) {
        console.error('Error fetching forex markets:', error);
        return [];
    }
};

/**
 * Fetches metal market data.
 * @returns {Promise<Object>} Object containing metal rates.
 */
export const fetchMetalMarkets = async () => {
    console.log('API: Starting Metal Fetching...');
    try {
        const url = 'https://api.metals.dev/v1/latest?api_key=DCU40FCSUKCJAJ3WJVJI9823WJVJI&currency=USD&unit=toz';
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
        });
        if (!response.ok) throw new Error(`Metals.dev API error: ${response.status}`);
        const result = await response.json();

        if (result.status === 'success' && result.metals) {
            return result.metals;
        }
    } catch (error) {
        console.error('API: Failed to fetch metals data:', error);
    }
    return null;
};
