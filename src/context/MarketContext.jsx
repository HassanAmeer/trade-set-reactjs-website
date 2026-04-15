import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchCryptoMarkets, fetchForexMarkets } from '../services/api';

const MarketContext = createContext();

const FALLBACK_CRYPTO = [
    { id: '1', symbol: 'BTC', name: 'BTC/USDT', fullName: 'Bitcoin', rate: '73,262.14', change: '+1.24%', flag: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', category: 'Cryptocurrency' },
    { id: '2', symbol: 'ETH', name: 'ETH/USDT', fullName: 'Ethereum', rate: '3,842.15', change: '+2.15%', flag: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', category: 'Cryptocurrency' },
    { id: '5426', symbol: 'SOL', name: 'SOL/USDT', fullName: 'Solana', rate: '145.28', change: '+4.80%', flag: 'https://assets.coingecko.com/coins/images/4128/small/solana.png', category: 'Cryptocurrency' },
    { id: '52', symbol: 'XRP', name: 'XRP/USDT', fullName: 'XRP', rate: '0.6241', change: '+0.12%', flag: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png', category: 'Cryptocurrency' },
    { id: '210', symbol: 'AVAX', name: 'AVAX/USDT', fullName: 'Avalanche', rate: '35.40', change: '+1.15%', flag: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png', category: 'Cryptocurrency' },
    { id: '1000', symbol: 'LINK', name: 'LINK/USDT', fullName: 'Chainlink', rate: '18.25', change: '-0.40%', flag: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png', category: 'Cryptocurrency' },
    { id: 'MATIC', symbol: 'MATIC', name: 'MATIC/USDT', fullName: 'Polygon', rate: '0.72', change: '-1.10%', flag: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png', category: 'Cryptocurrency' },
    { id: 'SHIB', symbol: 'SHIB', name: 'SHIB/USDT', fullName: 'Shiba Inu', rate: '0.000025', change: '+5.10%', flag: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png', category: 'Cryptocurrency' },
    { id: 'TON', symbol: 'TON', name: 'TON/USDT', fullName: 'Toncoin', rate: '7.15', change: '+3.45%', flag: 'https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png', category: 'Cryptocurrency' },
    { id: 'NEAR', symbol: 'NEAR', name: 'NEAR/USDT', fullName: 'NEAR Protocol', rate: '5.80', change: '+0.25%', flag: 'https://assets.coingecko.com/coins/images/10365/small/near_icon.png', category: 'Cryptocurrency' },
    { id: 'PEPE', symbol: 'PEPE', name: 'PEPE/USDT', fullName: 'Pepe', rate: '0.000008', change: '+12.40%', flag: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token-icon.png', category: 'Cryptocurrency' },
    { id: 'SUI', symbol: 'SUI', name: 'SUI/USDT', fullName: 'Sui', rate: '1.05', change: '-2.15%', flag: 'https://assets.coingecko.com/coins/images/26375/small/sui_logo.png', category: 'Cryptocurrency' },
    { id: '74', symbol: 'DOGE', name: 'DOGE/USDT', fullName: 'Dogecoin', rate: '0.1624', change: '+5.40%', flag: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png', category: 'Cryptocurrency' },
    { id: '1958', symbol: 'TRX', name: 'TRX/USDT', fullName: 'TRON', rate: '0.1215', change: '+0.05%', flag: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png', category: 'Cryptocurrency' },
    { id: '6636', symbol: 'DOT', name: 'DOT/USDT', fullName: 'Polkadot', rate: '7.20', change: '-2.15%', flag: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png', category: 'Cryptocurrency' },
    { id: '2', symbol: 'LTC', name: 'LTC/USDT', fullName: 'Litecoin', rate: '85.40', change: '+0.80%', flag: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png', category: 'Cryptocurrency' },
];

const FALLBACK_FOREX = [
    { id: 'fx-eur', name: 'EUR/USD', fullName: 'Euro / US Dollar', rate: '1.085420', change: '+0.04%', flag: 'https://flagcdn.com/w40/eu.png', category: 'Foreign Exchange' },
    { id: 'fx-gbp', name: 'GBP/USD', fullName: 'British Pound / US Dollar', rate: '1.267430', change: '-0.12%', flag: 'https://flagcdn.com/w40/gb.png', category: 'Foreign Exchange' },
    { id: 'fx-jpy', name: 'USD/JPY', fullName: 'US Dollar / Japanese Yen', rate: '151.42', change: '+0.25%', flag: 'https://flagcdn.com/w40/jp.png', category: 'Foreign Exchange' },
    { id: 'fx-cad', name: 'USD/CAD', fullName: 'US Dollar / Canadian Dollar', rate: '1.3520', change: '+0.10%', flag: 'https://flagcdn.com/w40/ca.png', category: 'Foreign Exchange' },
    { id: 'fx-aud', name: 'AUD/USD', fullName: 'Australian Dollar / US Dollar', rate: '0.6540', change: '-0.15%', flag: 'https://flagcdn.com/w40/au.png', category: 'Foreign Exchange' },
    { id: 'fx-nzd', name: 'NZD/USD', fullName: 'New Zealand Dollar / US Dollar', rate: '0.6020', change: '-0.05%', flag: 'https://flagcdn.com/w40/nz.png', category: 'Foreign Exchange' },
    { id: 'fx-chf', name: 'USD/CHF', fullName: 'US Dollar / Swiss Franc', rate: '0.9015', change: '+0.08%', flag: 'https://flagcdn.com/w40/ch.png', category: 'Foreign Exchange' },
    { id: 'fx-eurgbp', name: 'EUR/GBP', fullName: 'Euro / British Pound', rate: '0.8560', change: '+0.02%', flag: 'https://flagcdn.com/w40/gb.png', category: 'Foreign Exchange' },
];

const STATIC_METALS = [
    { id: 'metal-1', name: 'XAU/USD', fullName: 'Gold', rate: '2,350.20', change: '+0.04%', flag: 'https://img.icons8.com/color/96/gold-bars.png', category: 'Precious Metals' },
    { id: 'metal-2', name: 'XAG/USD', fullName: 'Silver', rate: '32.50', change: '-0.12%', flag: 'https://img.icons8.com/color/96/silver-bars.png', category: 'Precious Metals' },
    { id: 'metal-3', name: 'WTI/USD', fullName: 'Crude Oil', rate: '85.45', change: '+0.15%', flag: 'https://img.icons8.com/color/96/oil-industry.png', category: 'Precious Metals' },
    { id: 'metal-4', name: 'XPT/USD', fullName: 'Platinum', rate: '1,080.40', change: '+0.25%', flag: 'https://img.icons8.com/color/96/silver-bars.png', category: 'Precious Metals' },
    { id: 'metal-5', name: 'XPD/USD', fullName: 'Palladium', rate: '1,120.15', change: '-0.45%', flag: 'https://img.icons8.com/color/96/silver-bars.png', category: 'Precious Metals' },
    { id: 'metal-6', name: 'XCU/USD', fullName: 'Copper', rate: '4.85', change: '+1.10%', flag: 'https://img.icons8.com/color/96/copper-ingot.png', category: 'Precious Metals' },
    { id: 'metal-7', name: 'ALU/USD', fullName: 'Aluminum', rate: '2,540.00', change: '-0.30%', flag: 'https://img.icons8.com/color/96/aluminum-ingot.png', category: 'Precious Metals' },
    { id: 'metal-8', name: 'NG/USD', fullName: 'Natural Gas', rate: '2.45', change: '+2.10%', flag: 'https://img.icons8.com/color/96/natural-gas.png', category: 'Precious Metals' },
    { id: 'metal-9', name: 'ZNC/USD', fullName: 'Zinc', rate: '2,840.50', change: '-0.15%', flag: 'https://img.icons8.com/color/96/steel-ingot.png', category: 'Precious Metals' },
    { id: 'metal-10', name: 'NKL/USD', fullName: 'Nickel', rate: '16,450.00', change: '+0.85%', flag: 'https://img.icons8.com/color/96/steel-ingot.png', category: 'Precious Metals' },
    { id: 'metal-11', name: 'LD/USD', fullName: 'Lead', rate: '2,120.00', change: '-0.60%', flag: 'https://img.icons8.com/color/96/steel-ingot.png', category: 'Precious Metals' },
    { id: 'metal-12', name: 'BRENT/USD', fullName: 'Brent Oil', rate: '89.20', change: '+0.45%', flag: 'https://img.icons8.com/color/96/oil-industry.png', category: 'Precious Metals' },
    { id: 'metal-13', name: 'WHEAT/USD', fullName: 'Wheat', rate: '615.40', change: '-0.25%', flag: 'https://img.icons8.com/color/48/wheat.png', category: 'Precious Metals' },
    { id: 'metal-14', name: 'CORN/USD', fullName: 'Corn', rate: '450.15', change: '+1.05%', flag: 'https://img.icons8.com/color/48/corn.png', category: 'Precious Metals' },
    { id: 'metal-15', name: 'COFFEE/USD', fullName: 'Coffee', rate: '220.30', change: '+2.40%', flag: 'https://img.icons8.com/color/48/coffee-beans.png', category: 'Precious Metals' },
    { id: 'metal-16', name: 'SUGAR/USD', fullName: 'Sugar', rate: '19.45', change: '-0.80%', flag: 'https://img.icons8.com/color/48/sugar-cube.png', category: 'Precious Metals' },
    { id: 'metal-17', name: 'COTTON/USD', fullName: 'Cotton', rate: '78.50', change: '+0.35%', flag: 'https://img.icons8.com/color/48/cotton.png', category: 'Precious Metals' },
];

export const MarketProvider = ({ children }) => {
    const [assets, setAssets] = useState([...FALLBACK_FOREX, ...FALLBACK_CRYPTO, ...STATIC_METALS]);
    const [loading, setLoading] = useState(true);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [isActive, setIsActive] = useState(false); // Track if market data should be active

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
        // Only load market data if isActive is true
        if (!isActive) {
            setLoading(false);
            return;
        }

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
    }, [loadMarketData, isActive]);

    return (
        <MarketContext.Provider value={{ assets, loading, refreshData: loadMarketData, selectedAsset, setSelectedAsset, setIsActive }}>
            {children}
        </MarketContext.Provider>
    );
};

export const useMarket = () => useContext(MarketContext);
