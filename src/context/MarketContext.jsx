import React, { createContext, useContext, useState, useEffect } from 'react';

const MarketContext = createContext();

export const MarketProvider = ({ children }) => {
    const [assets, setAssets] = useState([
        { id: 1, name: 'GBP/USD', rate: '1.351990', change: '+0.13%', flag: 'https://flagcdn.com/w40/gb.png', category: 'Foreign Exchange' },
        { id: 2, name: 'AUD/USD', rate: '0.709160', change: '+0.44%', flag: 'https://flagcdn.com/w40/au.png', category: 'Foreign Exchange' },
        { id: 3, name: 'NZD/USD', rate: '0.597240', change: '+0.07%', flag: 'https://flagcdn.com/w40/nz.png', category: 'Foreign Exchange' },
        { id: 4, name: 'VND/USD', rate: '0.000038', change: '+0.32%', flag: 'https://flagcdn.com/w40/vn.png', category: 'Foreign Exchange' },
        { id: 5, name: 'AED/USD', rate: '0.272300', change: '0%', flag: 'https://flagcdn.com/w40/ae.png', category: 'Foreign Exchange' },
        { id: 6, name: 'IDR/USD', rate: '0.000059', change: '0%', flag: 'https://flagcdn.com/w40/id.png', category: 'Foreign Exchange' },
        { id: 7, name: 'INR/USD', rate: '0.010907', change: '+0.16%', flag: 'https://flagcdn.com/w40/in.png', category: 'Foreign Exchange' },
        { id: 8, name: 'USD/KRW', rate: '1427.855260', change: '-0.98%', flag: 'https://flagcdn.com/w40/kr.png', category: 'Foreign Exchange' },
        { id: 9, name: 'USD/THB', rate: '31.082140', change: '+0.04%', flag: 'https://flagcdn.com/w40/th.png', category: 'Foreign Exchange' },
        { id: 10, name: 'USD/JPY', rate: '156.624600', change: '+0.53%', flag: 'https://flagcdn.com/w40/jp.png', category: 'Foreign Exchange' },
        { id: 11, name: 'USD/HKD', rate: '7.820550', change: '-0.03%', flag: 'https://flagcdn.com/w40/hk.png', category: 'Foreign Exchange' },
        { id: 12, name: 'USD/CHF', rate: '0.774310', change: '+0.1%', flag: 'https://flagcdn.com/w40/ch.png', category: 'Foreign Exchange' },
        { id: 13, name: 'USD/CAD', rate: '1.369490', change: '-0.07%', flag: 'https://flagcdn.com/w40/ca.png', category: 'Foreign Exchange' },
        { id: 14, name: 'EUR/USD', rate: '1.178410', change: '+0.04%', flag: 'https://flagcdn.com/w40/eu.png', category: 'Foreign Exchange' },
        { id: 15, name: 'JPY/USD', rate: '0.006385', change: '-0.53%', flag: 'https://flagcdn.com/w40/jp.png', category: 'Foreign Exchange' },
        { id: 16, name: 'BTC/USDT', rate: '64231.50', change: '+1.24%', flag: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', category: 'Cryptocurrency' },
        { id: 17, name: 'ETH/USDT', rate: '3450.20', change: '-0.45%', flag: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', category: 'Cryptocurrency' },
        { id: 18, name: 'XAU/USD', rate: '5120.20', change: '+0.04%', flag: 'https://cdn-icons-png.flaticon.com/512/272/272535.png', category: 'Precious Metals' },
    ]);

    useEffect(() => {
        const interval = setInterval(() => {
            setAssets(prev => prev.map(asset => {
                const rand = Math.random();
                if (rand > 0.8) {
                    const currentRate = parseFloat(asset.rate.replace(',', ''));
                    const change = (Math.random() * 0.002) - 0.001;
                    const newRate = (currentRate + change).toFixed(6);
                    return { ...asset, rate: newRate };
                }
                return asset;
            }));
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <MarketContext.Provider value={{ assets }}>
            {children}
        </MarketContext.Provider>
    );
};

export const useMarket = () => useContext(MarketContext);
