import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchCryptoMarkets, fetchForexMarkets, fetchMetalMarkets } from '../services/api';

const MarketContext = createContext();

const FALLBACK_CRYPTO = [
    { id: '1', symbol: 'BTC', name: 'BTC/USDT', fullName: 'Bitcoin', rate: '73,262.14', change: '+1.24%', flag: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', category: 'Cryptocurrency', isLive: true },
    { id: '2', symbol: 'ETH', name: 'ETH/USDT', fullName: 'Ethereum', rate: '3,842.15', change: '+2.15%', flag: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', category: 'Cryptocurrency', isLive: true },
    { id: '5426', symbol: 'SOL', name: 'SOL/USDT', fullName: 'Solana', rate: '145.28', change: '+4.80%', flag: 'https://assets.coingecko.com/coins/images/4128/small/solana.png', category: 'Cryptocurrency', isLive: true },
    { id: '52', symbol: 'XRP', name: 'XRP/USDT', fullName: 'XRP', rate: '0.6241', change: '+0.12%', flag: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png', category: 'Cryptocurrency', isLive: true },
    { id: '210', symbol: 'AVAX', name: 'AVAX/USDT', fullName: 'Avalanche', rate: '35.40', change: '+1.15%', flag: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png', category: 'Cryptocurrency', isLive: true },
    { id: '1000', symbol: 'LINK', name: 'LINK/USDT', fullName: 'Chainlink', rate: '18.25', change: '-0.40%', flag: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png', category: 'Cryptocurrency', isLive: true },
    { id: 'MATIC', symbol: 'MATIC', name: 'MATIC/USDT', fullName: 'Polygon', rate: '0.72', change: '-1.10%', flag: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png', category: 'Cryptocurrency', isLive: true },
    { id: 'SHIB', symbol: 'SHIB', name: 'SHIB/USDT', fullName: 'Shiba Inu', rate: '0.000025', change: '+5.10%', flag: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png', category: 'Cryptocurrency', isLive: true },
    { id: 'TON', symbol: 'TON', name: 'TON/USDT', fullName: 'Toncoin', rate: '7.15', change: '+3.45%', flag: 'https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png', category: 'Cryptocurrency', isLive: true },
    { id: 'NEAR', symbol: 'NEAR', name: 'NEAR/USDT', fullName: 'NEAR Protocol', rate: '5.80', change: '+0.25%', flag: 'https://assets.coingecko.com/coins/images/10365/small/near_icon.png', category: 'Cryptocurrency', isLive: true },
    { id: 'PEPE', symbol: 'PEPE', name: 'PEPE/USDT', fullName: 'Pepe', rate: '0.000008', change: '+12.40%', flag: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token-icon.png', category: 'Cryptocurrency', isLive: true },
    { id: 'SUI', symbol: 'SUI', name: 'SUI/USDT', fullName: 'Sui', rate: '1.05', change: '-2.15%', flag: 'https://assets.coingecko.com/coins/images/26375/small/sui_logo.png', category: 'Cryptocurrency', isLive: true },
    { id: '74', symbol: 'DOGE', name: 'DOGE/USDT', fullName: 'Dogecoin', rate: '0.1624', change: '+5.40%', flag: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png', category: 'Cryptocurrency', isLive: true },
    { id: '1958', symbol: 'TRX', name: 'TRX/USDT', fullName: 'TRON', rate: '0.1215', change: '+0.05%', flag: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png', category: 'Cryptocurrency', isLive: true },
    { id: '6636', symbol: 'DOT', name: 'DOT/USDT', fullName: 'Polkadot', rate: '7.20', change: '-2.15%', flag: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png', category: 'Cryptocurrency', isLive: true },
    { id: '2', symbol: 'LTC', name: 'LTC/USDT', fullName: 'Litecoin', rate: '85.40', change: '+0.80%', flag: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png', category: 'Cryptocurrency', isLive: true },
];

const FALLBACK_FOREX = [
    { id: 'fx-eur', name: 'EUR/USD', fullName: 'Euro / US Dollar', rate: '1.085420', change: '+0.04%', flag: 'https://flagcdn.com/w40/eu.png', category: 'Foreign Exchange', isLive: true },
    { id: 'fx-gbp', name: 'GBP/USD', fullName: 'British Pound / US Dollar', rate: '1.267430', change: '-0.12%', flag: 'https://flagcdn.com/w40/gb.png', category: 'Foreign Exchange', isLive: true },
    { id: 'fx-jpy', name: 'USD/JPY', fullName: 'US Dollar / Japanese Yen', rate: '151.42', change: '+0.25%', flag: 'https://flagcdn.com/w40/jp.png', category: 'Foreign Exchange', isLive: true },
    { id: 'fx-cad', name: 'USD/CAD', fullName: 'US Dollar / Canadian Dollar', rate: '1.3520', change: '+0.10%', flag: 'https://flagcdn.com/w40/ca.png', category: 'Foreign Exchange', isLive: true },
    { id: 'fx-aud', name: 'AUD/USD', fullName: 'Australian Dollar / US Dollar', rate: '0.6540', change: '-0.15%', flag: 'https://flagcdn.com/w40/au.png', category: 'Foreign Exchange', isLive: true },
    { id: 'fx-nzd', name: 'NZD/USD', fullName: 'New Zealand Dollar / US Dollar', rate: '0.6020', change: '-0.05%', flag: 'https://flagcdn.com/w40/nz.png', category: 'Foreign Exchange', isLive: true },
    { id: 'fx-chf', name: 'USD/CHF', fullName: 'US Dollar / Swiss Franc', rate: '0.9015', change: '+0.08%', flag: 'https://flagcdn.com/w40/ch.png', category: 'Foreign Exchange', isLive: true },
    { id: 'fx-eurgbp', name: 'EUR/GBP', fullName: 'Euro / British Pound', rate: '0.8560', change: '+0.02%', flag: 'https://flagcdn.com/w40/gb.png', category: 'Foreign Exchange', isLive: true },
];

const STATIC_METALS = [
    { id: 'metal-1', name: 'XAU/USD', fullName: 'Gold', rate: '2,385.50', change: '+0.45%', flag: 'https://img.icons8.com/color/96/gold-bars.png', category: 'Precious Metals', isLive: true },
    { id: 'metal-2', name: 'XAG/USD', fullName: 'Silver', rate: '28.40', change: '+1.20%', flag: 'https://img.icons8.com/color/96/silver-bars.png', category: 'Precious Metals', isLive: true },
    { id: 'metal-3', name: 'WTI/USD', fullName: 'Crude Oil', rate: '83.40', change: '+0.15%', flag: 'https://img.icons8.com/color/96/oil-industry.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-4', name: 'XPT/USD', fullName: 'Platinum', rate: '965.40', change: '+0.15%', flag: 'https://img.icons8.com/color/96/silver-bars.png', category: 'Precious Metals', isLive: true },
    { id: 'metal-5', name: 'XPD/USD', fullName: 'Palladium', rate: '1,025.15', change: '-0.85%', flag: 'https://img.icons8.com/color/96/silver-bars.png', category: 'Precious Metals', isLive: true },
    { id: 'metal-6', name: 'XCU/USD', fullName: 'Copper', rate: '4.45', change: '+0.20%', flag: 'https://img.icons8.com/color/96/copper-ingot.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-7', name: 'ALU/USD', fullName: 'Aluminum', rate: '2,450.00', change: '-0.10%', flag: 'https://img.icons8.com/color/96/aluminum-ingot.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-8', name: 'NG/USD', fullName: 'Natural Gas', rate: '1.95', change: '+3.10%', flag: 'https://img.icons8.com/color/96/natural-gas.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-9', name: 'ZNC/USD', fullName: 'Zinc', rate: '2,750.50', change: '+0.15%', flag: 'https://img.icons8.com/color/96/steel-ingot.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-10', name: 'NKL/USD', fullName: 'Nickel', rate: '17,850.00', change: '+1.15%', flag: 'https://img.icons8.com/color/96/steel-ingot.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-11', name: 'LD/USD', fullName: 'Lead', rate: '2,145.00', change: '-0.20%', flag: 'https://img.icons8.com/color/96/steel-ingot.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-12', name: 'BRENT/USD', fullName: 'Brent Oil', rate: '87.20', change: '-0.40%', flag: 'https://img.icons8.com/color/96/oil-industry.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-13', name: 'WHEAT/USD', fullName: 'Wheat', rate: '565.40', change: '+0.25%', flag: 'https://img.icons8.com/color/48/wheat.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-14', name: 'CORN/USD', fullName: 'Corn', rate: '430.15', change: '-0.15%', flag: 'https://img.icons8.com/color/48/corn.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-15', name: 'COFFEE/USD', fullName: 'Coffee', rate: '235.30', change: '+1.40%', flag: 'https://img.icons8.com/color/48/coffee-beans.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-16', name: 'SUGAR/USD', fullName: 'Sugar', rate: '19.85', change: '-0.30%', flag: 'https://img.icons8.com/color/48/sugar-cube.png', category: 'Precious Metals', isLive: false },
    { id: 'metal-17', name: 'COTTON/USD', fullName: 'Cotton', rate: '81.50', change: '+0.05%', flag: 'https://img.icons8.com/color/48/cotton.png', category: 'Precious Metals', isLive: false },
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

    const loadMarketData = useCallback(async (forceMetals = false) => {
        console.log('Fetching market data...');
        try {
            // Check if we should fetch metals (every 6 hours or if forced)
            const lastMetalFetch = localStorage.getItem('lastMetalFetch');
            const shouldFetchMetals = forceMetals || !lastMetalFetch || (Date.now() - parseInt(lastMetalFetch) > 6 * 60 * 60 * 1000);

            const [cryptoData, forexData, metalData] = await Promise.all([
                fetchCryptoMarkets(),
                fetchForexMarkets(),
                shouldFetchMetals ? fetchMetalMarkets() : Promise.resolve(null)
            ]);

            if (shouldFetchMetals && metalData) {
                localStorage.setItem('lastMetalFetch', Date.now().toString());
                localStorage.setItem('cachedMetalData', JSON.stringify(metalData));
            }

            const cachedMetalData = JSON.parse(localStorage.getItem('cachedMetalData') || 'null');

            let updatedMetals = [...STATIC_METALS];
            const activeMetalData = metalData || cachedMetalData;

            if (activeMetalData) {
                updatedMetals = updatedMetals.map(m => {
                    const nameLower = m.fullName.toLowerCase();
                    let price = null;

                    if (nameLower.includes('gold') && activeMetalData.gold) price = activeMetalData.gold;
                    else if (nameLower.includes('silver') && activeMetalData.silver) price = activeMetalData.silver;
                    else if (nameLower.includes('platinum') && activeMetalData.platinum) price = activeMetalData.platinum;
                    else if (nameLower.includes('palladium') && activeMetalData.palladium) price = activeMetalData.palladium;
                    else if (nameLower.includes('copper') && activeMetalData.copper) price = activeMetalData.copper;
                    else if (nameLower.includes('aluminum') && activeMetalData.aluminum) price = activeMetalData.aluminum;
                    else if (nameLower.includes('zinc') && activeMetalData.zinc) price = activeMetalData.zinc;
                    else if (nameLower.includes('nickel') && activeMetalData.nickel) price = activeMetalData.nickel;
                    else if (nameLower.includes('lead') && activeMetalData.lead) price = activeMetalData.lead;

                    if (price) {
                        return {
                            ...m,
                            rate: price > 100 ?
                                price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) :
                                price.toFixed(price < 1 ? 4 : 2),
                            isLive: true
                        };
                    }
                    return m;
                });
            }

            const allAssets = [
                ...(forexData.length > 0 ? forexData : FALLBACK_FOREX),
                ...(cryptoData.length > 0 ? cryptoData : FALLBACK_CRYPTO),
                ...updatedMetals
            ];

            setAssets(allAssets);
            setLoading(false);
        } catch (error) {
            console.error('CRITICAL: Failed to load market data:', error);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isActive) {
            setLoading(false);
            return;
        }

        // Initial load
        loadMarketData(true);

        // All live data (Crypto/Forex) updates every 5 minutes
        const apiInterval = setInterval(() => loadMarketData(false), 300_000);

        // Simulation interval for "Live" feeling every 3 seconds
        const simInterval = setInterval(() => {
            setAssets(prev => {
                const newAssets = prev.map(asset => {
                    // ONLY fluctuate if the asset is live
                    if (asset.isLive === false) return asset;

                    const currentPrice = parseFloat(asset.rate.replace(/,/g, ''));
                    if (isNaN(currentPrice)) return asset;

                    const change = (Math.random() * 0.0004 - 0.0002) * currentPrice;
                    const newPrice = currentPrice + change;

                    return {
                        ...asset,
                        rate: newPrice > 100 ?
                            newPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) :
                            newPrice.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })
                    };
                });

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
