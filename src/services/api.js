/**
 * API service for fetching market data.
 */

const CMC_API_KEY = '055fbbf5675e46e589d62f10f894a56d';
const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com/v1';

const METALS_DEV_KEY = 'DNOEU1OR0Q4QPTXKHGE1802XKHGE1';
const GOLD_API_KEY = 'goldapi-cd9d69369cfe98af15d8f6fa095fb59e-io'; // Add your GoldAPI.io key here if Metals.dev fails

/**
 * Fetches cryptocurrency market data from CoinMarketCap.
 * @returns {Promise<Array>} List of mapped cryptocurrency assets.
 */
export const fetchCryptoMarkets = async () => {
    try {
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        if (!response.ok) throw new Error('Binance response not ok');
        const data = await response.json();

        // Define common symbols to match our context
        const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'TRXUSDT', 'DOTUSDT', 'LTCUSDT', 'MATICUSDT', 'LINKUSDT', 'AVAXUSDT', 'UNIUSDT', 'ATOMUSDT'];
        const filtered = data.filter(item => symbols.includes(item.symbol));

        return filtered.map(item => {
            const rawName = item.symbol.replace('USDT', '');
            return {
                id: item.symbol,
                symbol: rawName,
                name: `${rawName}/USDT`,
                fullName: rawName === 'BTC' ? 'Bitcoin' : rawName === 'ETH' ? 'Ethereum' : rawName,
                rate: parseFloat(item.lastPrice) > 100 ?
                    parseFloat(item.lastPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) :
                    parseFloat(item.lastPrice).toFixed(6),
                change: (parseFloat(item.priceChangePercent) >= 0 ? '+' : '') + parseFloat(item.priceChangePercent).toFixed(2) + '%',
                flag: `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${rawName.toLowerCase()}.png`,
                category: 'Cryptocurrency',
                volume24h: (parseFloat(item.quoteVolume) / 1000000).toFixed(1) + 'M',
                high24h: parseFloat(item.highPrice).toLocaleString(),
                low24h: parseFloat(item.lowPrice).toLocaleString(),
                isLive: true
            };
        });
    } catch (error) {
        console.error('Error fetching crypto markets (Binance):', error);
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
            { id: 'vnd', symbol: 'VND/USD', flag: 'vn', rateKey: 'VND' },
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
 * Fetches metal market data with fallback.
 * @returns {Promise<Object>} Object containing metal rates.
 */
export const fetchMetalMarkets = async () => {
    const results = { source: 'none' };
    const metalsToFetch = ['gold', 'silver', 'platinum', 'palladium', 'aluminum', 'copper', 'lead', 'nickel', 'zinc'];

    console.log('API: Starting Metal Fetching...');

    // 1. Try Metals.dev for each metal (Parallel calls for speed)
    try {
        const fetchPromises = metalsToFetch.map(async (metal) => {
            try {
                const url = `https://api.metals.dev/v1/metal/spot?api_key=${METALS_DEV_KEY}&currency=USD&unit=toz&metal=${metal}`;
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    console.log(`API: Metals.dev Response for ${metal}:`, data);
                    if (data.status === 'success' && data.rate) {
                        return { metal, price: data.rate.price };
                    }
                } else {
                    console.warn(`API: Metals.dev ${metal} failed with status: ${response.status}`);
                }
            } catch (err) {
                console.error(`API: Metals.dev error for ${metal}:`, err.message);
            }
            return null;
        });

        const metalResults = await Promise.all(fetchPromises);
        metalResults.forEach(res => {
            if (res) {
                results[res.metal] = res.price;
                results.source = 'metals.dev';
            }
        });
    } catch (error) {
        console.error('API: Metals.dev main loop failed:', error);
    }

    // 2. Check if any metals are still missing and try GoldAPI.io as fallback
    const missingMetals = metalsToFetch.filter(m => !results[m]);

    if (missingMetals.length > 0 && GOLD_API_KEY) {
        console.log('API: Missing from Metals.dev, trying GoldAPI for:', missingMetals);
        try {
            for (const metalName of missingMetals) {
                const symbol = metalName === 'gold' ? 'XAU' : metalName === 'silver' ? 'XAG' : metalName === 'platinum' ? 'XPT' : 'XPD';
                const res = await fetch(`https://www.goldapi.io/api/${symbol}/USD`, {
                    headers: { 'x-access-token': GOLD_API_KEY }
                });
                if (res.ok) {
                    const data = await res.json();
                    console.log(`API: GoldAPI Response for ${symbol}:`, data);
                    results[metalName] = data.price;
                    if (results.source === 'none') results.source = 'goldapi';
                } else {
                    const errorData = await res.json().catch(() => ({}));
                    console.error(`API: GoldAPI ${symbol} failed (${res.status}):`, errorData.error || res.statusText);
                }
            }
        } catch (err) {
            console.error('API: Fallback GoldAPI failed:', err);
        }
    }

    console.log('API: Final Compiled Results:', results);
    return Object.keys(results).length > 1 ? results : null;
};
