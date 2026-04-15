import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchCryptoMarkets, fetchForexMarkets } from '../services/api';

const MarketContext = createContext();

const FALLBACK_CRYPTO = [
    { id: '1', symbol: 'BTC', name: 'BTC/USDT', fullName: 'Bitcoin', rate: '73,262.14', change: '+1.24%', flag: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', category: 'Cryptocurrency' },
    { id: '2', symbol: 'ETH', name: 'ETH/USDT', fullName: 'Ethereum', rate: '3,842.15', change: '+2.15%', flag: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', category: 'Cryptocurrency' },
    { id: '5426', symbol: 'SOL', name: 'SOL/USDT', fullName: 'Solana', rate: '145.28', change: '+4.80%', flag: 'https://assets.coingecko.com/coins/images/4128/small/solana.png', category: 'Cryptocurrency' },
    { id: '52', symbol: 'XRP', name: 'XRP/USDT', fullName: 'XRP', rate: '0.6241', change: '+0.12%', flag: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png', category: 'Cryptocurrency' },
    { id: '2010', symbol: 'ADA', name: 'ADA/USDT', fullName: 'Cardano', rate: '0.4582', change: '-1.20%', flag: 'https://assets.coingecko.com/coins/images/975/small/cardano.png', category: 'Cryptocurrency' },
    { id: '74', symbol: 'DOGE', name: 'DOGE/USDT', fullName: 'Dogecoin', rate: '0.1624', change: '+5.40%', flag: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png', category: 'Cryptocurrency' },
    { id: '1958', symbol: 'TRX', name: 'TRX/USDT', fullName: 'TRON', rate: '0.1215', change: '+0.05%', flag: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png', category: 'Cryptocurrency' },
    { id: '6636', symbol: 'DOT', name: 'DOT/USDT', fullName: 'Polkadot', rate: '7.20', change: '-2.15%', flag: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png', category: 'Cryptocurrency' },
    { id: '2', symbol: 'LTC', name: 'LTC/USDT', fullName: 'Litecoin', rate: '85.40', change: '+0.80%', flag: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png', category: 'Cryptocurrency' },
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

    // Set initial selected asset once data is loaded (only if no asset is selected)
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
        const apiInterval = setInterval(loadMarketData, 60000); // 1 minute real update

        // Simulation interval for "Live" feeling every 3 seconds
        const simInterval = setInterval(() => {
            setAssets(prev => {
                const newAssets = prev.map(asset => {
                    const currentPrice = parseFloat(asset.rate.replace(/,/g, ''));
                    if (isNaN(currentPrice)) return asset;

                    // Small random fluctuation (0.01% to 0.05%)
                    const change = (Math.random() * 0.0004 - 0.0002) * currentPrice;
                    const newPrice = currentPrice + change;

                    return {
                        ...asset,
                        rate: newPrice > 100 ?
                            newPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) :
                            newPrice.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })
                    };
                });

                // Update selected asset price too
                setSelectedAsset(current => {
                    if (!current) return current;
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
    }, [loadMarketData]);

    return (
        <MarketContext.Provider value={{ assets, loading, refreshData: loadMarketData, selectedAsset, setSelectedAsset }}>
            {children}
        </MarketContext.Provider>
    );
};

export const useMarket = () => useContext(MarketContext);
