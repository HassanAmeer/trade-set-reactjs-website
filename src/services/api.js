/**
 * API service for fetching market data.
 */

const CMC_API_KEY = '055fbbf5675e46e589d62f10f894a56d';
const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com/v1';

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
                low24h: parseFloat(item.lowPrice).toLocaleString()
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
                category: 'Foreign Exchange'
            };
        });
    } catch (error) {
        console.error('Error fetching forex markets:', error);
        return [];
    }
};
