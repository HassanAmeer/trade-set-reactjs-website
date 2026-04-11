import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchCryptoMarkets, fetchForexMarkets } from '../services/api';

const MarketContext = createContext();

const FALLBACK_CRYPTO = [
    { id: '1', symbol: 'BTC', name: 'BTC/USDT', fullName: 'Bitcoin', rate: '64,231.50', change: '+1.24%', flag: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', category: 'Cryptocurrency' },
    { id: '2', symbol: 'ETH', name: 'ETH/USDT', fullName: 'Ethereum', rate: '3,450.20', change: '-0.45%', flag: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', category: 'Cryptocurrency' },
    { id: '5426', symbol: 'SOL', name: 'SOL/USDT', fullName: 'Solana', rate: '145.80', change: '+3.12%', flag: 'https://assets.coingecko.com/coins/images/4128/small/solana.png', category: 'Cryptocurrency' },
    { id: '52', symbol: 'XRP', name: 'XRP/USDT', fullName: 'XRP', rate: '0.62', change: '+0.10%', flag: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png', category: 'Cryptocurrency' },
    { id: '2010', symbol: 'ADA', name: 'ADA/USDT', fullName: 'Cardano', rate: '0.45', change: '-1.20%', flag: 'https://assets.coingecko.com/coins/images/975/small/cardano.png', category: 'Cryptocurrency' },
    { id: '74', symbol: 'DOGE', name: 'DOGE/USDT', fullName: 'Dogecoin', rate: '0.16', change: '+5.40%', flag: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png', category: 'Cryptocurrency' },
    { id: '1958', symbol: 'TRX', name: 'TRX/USDT', fullName: 'TRON', rate: '0.12', change: '+0.05%', flag: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png', category: 'Cryptocurrency' },
    { id: '6636', symbol: 'DOT', name: 'DOT/USDT', fullName: 'Polkadot', rate: '7.20', change: '-2.15%', flag: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png', category: 'Cryptocurrency' },
    { id: '2', symbol: 'LTC', name: 'LTC/USDT', fullName: 'Litecoin', rate: '85.40', change: '+0.80%', flag: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png', category: 'Cryptocurrency' },
    { id: '5994', symbol: 'SHIB', name: 'SHIB/USDT', fullName: 'Shiba Inu', rate: '0.000027', change: '-3.10%', flag: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png', category: 'Cryptocurrency' },
    { id: '512', symbol: 'LINK', name: 'LINK/USDT', fullName: 'Chainlink', rate: '18.20', change: '+1.45%', flag: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png', category: 'Cryptocurrency' },
    { id: '3890', symbol: 'MATIC', name: 'MATIC/USDT', fullName: 'Polygon', rate: '0.72', change: '-0.50%', flag: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png', category: 'Cryptocurrency' },
    { id: '5805', symbol: 'AVAX', name: 'AVAX/USDT', fullName: 'Avalanche', rate: '35.40', change: '+2.10%', flag: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png', category: 'Cryptocurrency' },
    { id: '7083', symbol: 'UNI', name: 'UNI/USDT', fullName: 'Uniswap', rate: '7.80', change: '-1.40%', flag: 'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png', category: 'Cryptocurrency' },
    { id: '3794', symbol: 'ATOM', name: 'ATOM/USDT', fullName: 'Cosmos', rate: '8.50', change: '+0.30%', flag: 'https://assets.coingecko.com/coins/images/8254/small/cosmos.png', category: 'Cryptocurrency' },
    { id: '1321', symbol: 'ETC', name: 'ETC/USDT', fullName: 'Ethereum Classic', rate: '26.40', change: '+1.10%', flag: 'https://assets.coingecko.com/coins/images/453/small/ethereum-classic-logo.png', category: 'Cryptocurrency' },
    { id: '328', symbol: 'XMR', name: 'XMR/USDT', fullName: 'Monero', rate: '120.50', change: '-0.20%', flag: 'https://assets.coingecko.com/coins/images/69/small/monero_logo.png', category: 'Cryptocurrency' },
    { id: '512', symbol: 'XLM', name: 'XLM/USDT', fullName: 'Stellar', rate: '0.11', change: '+0.45%', flag: 'https://assets.coingecko.com/coins/images/100/small/stellar.png', category: 'Cryptocurrency' },
    { id: '6535', symbol: 'NEAR', name: 'NEAR/USDT', fullName: 'NEAR Protocol', rate: '6.80', change: '+4.20%', flag: 'https://assets.coingecko.com/coins/images/10365/small/near_icon.png', category: 'Cryptocurrency' },
    { id: '3077', symbol: 'VET', name: 'VET/USDT', fullName: 'VeChain', rate: '0.04', change: '-2.50%', flag: 'https://assets.coingecko.com/coins/images/1167/small/VeChain-Logo-768x725.png', category: 'Cryptocurrency' },
    { id: '2280', symbol: 'FIL', name: 'FIL/USDT', fullName: 'Filecoin', rate: '5.90', change: '-1.15%', flag: 'https://assets.coingecko.com/coins/images/12817/small/filecoin.png', category: 'Cryptocurrency' },
    { id: '11840', symbol: 'ARB', name: 'ARB/USDT', fullName: 'Arbitrum', rate: '1.15', change: '+0.80%', flag: 'https://assets.coingecko.com/coins/images/16547/small/arbitrum.png', category: 'Cryptocurrency' },
    { id: '21314', symbol: 'APT', name: 'APT/USDT', fullName: 'Aptos', rate: '9.20', change: '+2.40%', flag: 'https://assets.coingecko.com/coins/images/26455/small/aptos_round.png', category: 'Cryptocurrency' },
];

const FALLBACK_FOREX = [
    { id: 'fx-eur', name: 'EUR/USD', rate: '1.085420', change: '+0.04%', flag: 'https://flagcdn.com/w40/eu.png', category: 'Foreign Exchange' },
    { id: 'fx-gbp', name: 'GBP/USD', rate: '1.267430', change: '-0.12%', flag: 'https://flagcdn.com/w40/gb.png', category: 'Foreign Exchange' },
];

const STATIC_METALS = [
    { id: 'metal-1', name: 'XAU/USD', rate: '5120.20', change: '+0.04%', flag: 'https://cdn-icons-png.flaticon.com/512/272/272535.png', category: 'Precious Metals' },
    { id: 'metal-2', name: 'XAG/USD', rate: '32.50', change: '-0.12%', flag: 'https://cdn-icons-png.flaticon.com/512/272/272536.png', category: 'Precious Metals' },
];

export const MarketProvider = ({ children }) => {
    const [assets, setAssets] = useState([...FALLBACK_FOREX, ...FALLBACK_CRYPTO, ...STATIC_METALS]);
    const [loading, setLoading] = useState(true);
    const [selectedAsset, setSelectedAsset] = useState(null);

    // Set initial selected asset once data is loaded
    useEffect(() => {
        if (assets.length > 0 && !selectedAsset) {
            setSelectedAsset(assets.find(a => a.symbol === 'BTC') || assets[0]);
        }
    }, [assets]);

    const loadMarketData = useCallback(async () => {
        console.log('Fetching market data...');
        try {
            const [cryptoData, forexData] = await Promise.all([
                fetchCryptoMarkets(),
                fetchForexMarkets()
            ]);

            console.log('Crypto Data received:', cryptoData?.length || 0);
            console.log('Forex Data received:', forexData?.length || 0);

            const allAssets = [
                ...(forexData.length > 0 ? forexData : FALLBACK_FOREX),
                ...(cryptoData.length > 0 ? cryptoData : FALLBACK_CRYPTO),
                ...STATIC_METALS
            ];

            setAssets(allAssets);
            setLoading(false);
        } catch (error) {
            console.error('CRITICAL: Failed to load market data:', error);
            // Fallback is already set in the initial state or previous successful load
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMarketData();
        const interval = setInterval(loadMarketData, 60000); // Update every 1 minutes
        return () => clearInterval(interval);
    }, [loadMarketData]);

    return (
        <MarketContext.Provider value={{ assets, loading, refreshData: loadMarketData, selectedAsset, setSelectedAsset }}>
            {children}
        </MarketContext.Provider>
    );
};

export const useMarket = () => useContext(MarketContext);
