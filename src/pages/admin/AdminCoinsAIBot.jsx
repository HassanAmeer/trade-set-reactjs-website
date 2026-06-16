import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Loader2, Trash2, History, Plus, Download, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { db } from '../../firebase-setup';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { aiBotConfig } from './aiBotConfig';
import cryptoChats from '../../../memory/crypto_chats.json';
import exchangeChats from '../../../memory/exchange_chats.json';
import metalsChats from '../../../memory/metals_chats.json';
import stocksChats from '../../../memory/stocks_chats.json';

const getMessageText = (msg) => {
    if (!msg) return '';
    const content = typeof msg === 'string' ? msg : msg.content;
    if (!content) return '';
    if (typeof content === 'object' && content !== null) {
        const headers = ['Asset Name', 'Our Database Price', 'Live Google Price', 'Difference / Status'];
        const headerRow = `| ${headers.join(' | ')} |`;
        const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
        const dataRows = Object.keys(content).map(assetName => {
            const item = content[assetName] || {};
            return `| ${assetName} | ${item.databaseRate || ''} | ${item.liveGoogleRate || ''} | ${item.difference || ''} |`;
        });
        return [headerRow, separatorRow, ...dataRows].join('\n');
    }
    return content;
};
const getApiKeys = () => {
    const keys = [];
    const keysStr = import.meta.env.VITE_GEMINI_API_KEYS;
    if (keysStr) {
        keys.push(...keysStr.split(',').map(k => k.trim()).filter(Boolean));
    }
    return keys;
};

// ─── System Prompt ─────────────────────────────────────────────────────────────
const getSystemPrompt = (contextInfo) => {
    const getRatesStr = (category) => {
        const coins = contextInfo?.[`${category}Coins`] || [];
        return coins.map(c => {
            const label = c.label || c.code || c.id;
            const rate = contextInfo?.getLiveRateForCoin?.(category, c) || '0';
            return `${label}: ${rate}`;
        }).join(', ');
    };

    const cryptoRates = getRatesStr('crypto') || 'None';
    const forexRates = getRatesStr('forex') || 'None';
    const metalsRates = getRatesStr('metals') || 'None';
    const stocksRates = getRatesStr('stocks') || 'None';

    return `Your name is ${aiBotConfig.assistantName}. You are a market rates comparison bot trained by ${aiBotConfig.trainedBy} to search coins, view rates, and perform actions on the dashboard.
If anyone asks for your name, identity, who trained you, or who created you, you must state that your name is ${aiBotConfig.assistantName} and that you were trained by ${aiBotConfig.trainedBy}. Do not claim to be Gemini or created by Google.

Your job is to search the web for the current live prices/rates of assets using Google Search and compare them with our local database prices.

Here are our local database prices:
- Cryptocurrency: [${cryptoRates}]
- Foreign Exchange (Forex): [${forexRates}]
- Precious Metals: [${metalsRates}]
- Stocks: [${stocksRates}]

When the user asks to compare prices or rates (e.g. for Crypto, Forex, Metals, or Stocks):
1. Use Google Search to find the latest live price of each asset in the list.
2. Construct a Markdown table comparing our database prices with the live Google Search prices.
3. The table MUST have the following columns:
| Asset Name | Our Database Price | Live Google Price | Difference / Status |
4. Keep the output professional and highly concise. Do not list sources or write lengthy explanations.`;
};

// ─── Rich Formatting Parsers & Exports ─────────────────────────────────────────
const parseTable = (tableText) => {
    const lines = tableText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 1) return null;

    const headers = lines[0]
        .split('|')
        .map(cell => cell.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

    const rows = [];
    const hasSeparator = lines.length > 1 && lines[1].replace(/[\s|:-]/g, '') === '';
    const startIndex = hasSeparator ? 2 : 1;

    for (let i = startIndex; i < lines.length; i++) {
        const rowCells = lines[i]
            .split('|')
            .map(cell => cell.trim())
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        if (rowCells.length > 0) {
            rows.push(rowCells);
        }
    }
    return { headers, rows };
};

const renderImage = (alt, url) => {
    const downloadImage = async () => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = alt || `image_export_${Date.now()}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.download = alt || `image_export_${Date.now()}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div style={{ margin: '14px 0', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <img src={url} alt={alt} style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '8px' }} />
            {alt && <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic' }}>{alt}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={downloadImage}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        background: aiBotConfig.highlightBackground, border: aiBotConfig.highlightBorder,
                        color: aiBotConfig.primaryColor, padding: '6px 12px', borderRadius: '8px',
                        fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <Download size={12} />
                    Download Image
                </button>
            </div>
        </div>
    );
};

// ─── Main Component ─────────────────────────────────────────────────────────────
const AdminCoinsAIBot = ({ coinsContext, onAddCoin, onRemoveCoin, onSetVisibility, onRestoreCoin, onRatesUpdated }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Toast and Database Update States
    const [updatingIndex, setUpdatingIndex] = useState(null);
    const [updatedTables, setUpdatedTables] = useState({});
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

    const showToast = (type, msg) => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    const normalize = (str) => {
        if (!str) return '';
        return str
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[^a-z0-9]/g, '');
    };

    const getPrimarySymbol = (str) => {
        if (!str) return '';
        let clean = str.replace(/[*_`]/g, '').trim();
        clean = clean
            .replace(/^(fx-|metal-|stock-)/i, '')
            .replace(/(USDT|USD)$/i, '')
            .replace(/\(.*\)/g, ''); // remove (Gold), (Amazon) etc
        const parts = clean.split(/[^a-zA-Z0-9]/).filter(Boolean);
        return parts[0]?.trim().toUpperCase() || '';
    };

    const isMatch = (rowLabel, coin) => {
        if (!rowLabel || !coin) return false;
        
        // Clean formatting and convert to lowercase
        const cleanRow = rowLabel.replace(/[*_`]/g, '').trim().toLowerCase();
        const cleanCoinId = coin.id.toLowerCase();
        const cleanCoinLabel = coin.label.toLowerCase();
        const cleanCoinCode = coin.code ? coin.code.toLowerCase() : '';

        // Strategy 1: Exact matches of cleaned labels/ids/codes
        if (cleanRow === cleanCoinId || cleanRow === cleanCoinLabel || (cleanCoinCode && cleanRow === cleanCoinCode)) {
            return true;
        }

        // Strategy 2: Extract primary symbol/ticker from both and compare
        const getTickers = (str) => {
            const tickers = new Set();
            const parts = str.toUpperCase().split(/[^A-Z0-9]/).filter(Boolean);
            parts.forEach(p => {
                if (p === 'USD' || p === 'USDT' || p === 'FX' || p === 'METAL' || p === 'STOCK' || p === 'SPOT' || p === 'PRICE' || p === 'RATE') {
                    return;
                }
                if (p.length >= 2 && p.length <= 6) {
                    tickers.add(p);
                }
            });
            return tickers;
        };

        const rowTickers = getTickers(cleanRow);
        const coinTickers = new Set([
            ...getTickers(cleanCoinId),
            ...getTickers(cleanCoinLabel),
            ...(cleanCoinCode ? getTickers(cleanCoinCode) : [])
        ]);

        for (const ticker of rowTickers) {
            if (coinTickers.has(ticker)) {
                return true;
            }
        }

        // Strategy 3: Check name substring containment
        const alphabetic = (s) => s.replace(/[^a-z]/g, '');
        const rowAlpha = alphabetic(cleanRow);
        const labelAlpha = alphabetic(cleanCoinLabel);
        
        if (rowAlpha.length > 2 && labelAlpha.length > 2) {
            if (rowAlpha.includes(labelAlpha) || labelAlpha.includes(rowAlpha)) {
                return true;
            }
        }

        // Strategy 4: Specific known hardcoded manual mappings
        const rowLower = cleanRow.replace(/\s+/g, '');
        const labelLower = cleanCoinLabel.replace(/\s+/g, '');

        if (rowLower.includes('gold') && labelLower.includes('gold')) return true;
        if (rowLower.includes('silver') && labelLower.includes('silver')) return true;
        if (rowLower.includes('platinum') && labelLower.includes('platinum')) return true;
        if (rowLower.includes('palladium') && labelLower.includes('palladium')) return true;
        if (rowLower.includes('copper') && labelLower.includes('copper')) return true;
        if (rowLower.includes('aluminum') && labelLower.includes('aluminum')) return true;
        if (rowLower.includes('zinc') && labelLower.includes('zinc')) return true;
        if (rowLower.includes('nickel') && labelLower.includes('nickel')) return true;
        if (rowLower.includes('lead') && labelLower.includes('lead')) return true;

        return false;
    };

    const parsePrice = (priceStr) => {
        if (!priceStr) return '';
        const cleaned = priceStr.replace(/[^0-9.-]/g, '');
        return cleaned;
    };

    const detectTableCategory = (headers, rows, messageText) => {
        const textLower = (messageText || '').toLowerCase();
        
        let scores = {
            crypto: 0,
            forex: 0,
            metals: 0,
            stocks: 0
        };

        const cryptoCoins = coinsContext?.cryptoCoins || [];
        const forexCoins = coinsContext?.forexCoins || [];
        const metalsCoins = coinsContext?.metalsCoins || [];
        const stocksCoins = coinsContext?.stocksCoins || [];

        rows.forEach(row => {
            const assetName = row[0];
            if (!assetName) return;

            for (const coin of cryptoCoins) {
                if (isMatch(assetName, coin)) {
                    scores.crypto++;
                    break;
                }
            }
            for (const coin of forexCoins) {
                if (isMatch(assetName, coin)) {
                    scores.forex++;
                    break;
                }
            }
            for (const coin of metalsCoins) {
                if (isMatch(assetName, coin)) {
                    scores.metals++;
                    break;
                }
            }
            for (const coin of stocksCoins) {
                if (isMatch(assetName, coin)) {
                    scores.stocks++;
                    break;
                }
            }
        });

        if (scores.crypto === 0 && scores.forex === 0 && scores.metals === 0 && scores.stocks === 0) {
            if (textLower.includes('cryptocurrency') || textLower.includes('crypto') || textLower.includes('bitcoin')) {
                scores.crypto += 2;
            }
            if (textLower.includes('exchange rate') || textLower.includes('forex') || textLower.includes('currency pair')) {
                scores.forex += 2;
            }
            if (textLower.includes('precious metal') || textLower.includes('metal') || textLower.includes('gold') || textLower.includes('silver')) {
                scores.metals += 2;
            }
            if (textLower.includes('stock') || textLower.includes('equity') || textLower.includes('amazon') || textLower.includes('tesla')) {
                scores.stocks += 2;
            }
        }

        let maxScore = -1;
        let bestCategory = 'crypto';
        for (const cat of ['crypto', 'forex', 'metals', 'stocks']) {
            if (scores[cat] > maxScore) {
                maxScore = scores[cat];
                bestCategory = cat;
            }
        }
        return bestCategory;
    };

    const extractRatesData = (content) => {
        if (!content) return { crypto: {}, forex: {}, metals: {}, stocks: {} };

        if (typeof content !== 'string') {
            const ratesData = {
                crypto: {},
                forex: {},
                metals: {},
                stocks: {}
            };
            const cryptoCoins = coinsContext?.cryptoCoins || [];
            const forexCoins = coinsContext?.forexCoins || [];
            const metalsCoins = coinsContext?.metalsCoins || [];
            const stocksCoins = coinsContext?.stocksCoins || [];

            for (const assetName of Object.keys(content || {})) {
                const coinData = content[assetName];
                const livePriceStr = coinData?.liveGoogleRate;
                if (!livePriceStr) continue;

                const parsedPrice = parsePrice(livePriceStr);
                if (!parsedPrice || isNaN(Number(parsedPrice))) continue;

                let matched = false;
                for (const coin of cryptoCoins) {
                    if (isMatch(assetName, coin)) {
                        ratesData.crypto[coin.id] = parsedPrice;
                        matched = true;
                        break;
                    }
                }
                if (!matched) {
                    for (const coin of forexCoins) {
                        if (isMatch(assetName, coin)) {
                            ratesData.forex[coin.id] = parsedPrice;
                            matched = true;
                            break;
                        }
                    }
                }
                if (!matched) {
                    for (const coin of metalsCoins) {
                        if (isMatch(assetName, coin)) {
                            ratesData.metals[coin.id] = parsedPrice;
                            matched = true;
                            break;
                        }
                    }
                }
                if (!matched) {
                    for (const coin of stocksCoins) {
                        if (isMatch(assetName, coin)) {
                            ratesData.stocks[coin.id] = parsedPrice;
                            matched = true;
                            break;
                        }
                    }
                }
            }
            return ratesData;
        }

        const lines = content.split('\n');
        let currentTableLines = null;
        const tables = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
                if (!currentTableLines) {
                    currentTableLines = [];
                }
                currentTableLines.push(line);
            } else {
                if (currentTableLines) {
                    tables.push(currentTableLines.join('\n'));
                    currentTableLines = null;
                }
            }
        }
        if (currentTableLines) {
            tables.push(currentTableLines.join('\n'));
        }

        const ratesData = {
            crypto: {},
            forex: {},
            metals: {},
            stocks: {}
        };

        const cryptoCoins = coinsContext?.cryptoCoins || [];
        const forexCoins = coinsContext?.forexCoins || [];
        const metalsCoins = coinsContext?.metalsCoins || [];
        const stocksCoins = coinsContext?.stocksCoins || [];

        tables.forEach(tableText => {
            const parsed = parseTable(tableText);
            if (!parsed) return;
            const { headers, rows } = parsed;

            let googlePriceColIdx = 2;
            for (let i = 0; i < headers.length; i++) {
                const h = headers[i].toLowerCase();
                if (h.includes('google') || h.includes('live price') || h.includes('live rate')) {
                    googlePriceColIdx = i;
                    break;
                }
            }

            rows.forEach(row => {
                const assetName = row[0];
                const livePriceStr = row[googlePriceColIdx];
                if (!assetName || !livePriceStr) return;

                const parsedPrice = parsePrice(livePriceStr);
                if (!parsedPrice || isNaN(Number(parsedPrice))) return;

                let matched = false;

                for (const coin of cryptoCoins) {
                    if (isMatch(assetName, coin)) {
                        ratesData.crypto[coin.id] = parsedPrice;
                        matched = true;
                        break;
                    }
                }

                if (!matched) {
                    for (const coin of forexCoins) {
                        if (isMatch(assetName, coin)) {
                            ratesData.forex[coin.id] = parsedPrice;
                            matched = true;
                            break;
                        }
                    }
                }

                if (!matched) {
                    for (const coin of metalsCoins) {
                        if (isMatch(assetName, coin)) {
                            ratesData.metals[coin.id] = parsedPrice;
                            matched = true;
                            break;
                        }
                    }
                }

                if (!matched) {
                    for (const coin of stocksCoins) {
                        if (isMatch(assetName, coin)) {
                            ratesData.stocks[coin.id] = parsedPrice;
                            matched = true;
                            break;
                        }
                    }
                }
            });
        });

        return ratesData;
    };

    const handleUpdateRates = async (ratesData, tableId) => {
        if (updatingIndex !== null) return;
        setUpdatingIndex(tableId);

        try {
            const ratesRef = doc(db, 'admin_set', 'coins_custom_rates');
            const ratesSnap = await getDoc(ratesRef);
            let currentCustomRates = ratesSnap.exists() ? ratesSnap.data() : { crypto: {}, forex: {}, metals: {}, stocks: {} };

            const cryptoCoins = coinsContext?.cryptoCoins || [];
            const forexCoins = coinsContext?.forexCoins || [];
            const metalsCoins = coinsContext?.metalsCoins || [];
            const stocksCoins = coinsContext?.stocksCoins || [];

            let updatedCount = 0;
            const newCustomRates = {
                crypto: { ...(currentCustomRates.crypto || {}) },
                forex: { ...(currentCustomRates.forex || {}) },
                metals: { ...(currentCustomRates.metals || {}) },
                stocks: { ...(currentCustomRates.stocks || {}) }
            };

            // Merge from ratesData
            if (ratesData.crypto) {
                for (const key of Object.keys(ratesData.crypto)) {
                    newCustomRates.crypto[key] = ratesData.crypto[key];
                    updatedCount++;
                }
            }
            if (ratesData.forex) {
                for (const key of Object.keys(ratesData.forex)) {
                    newCustomRates.forex[key] = ratesData.forex[key];
                    updatedCount++;
                }
            }
            if (ratesData.metals) {
                for (const key of Object.keys(ratesData.metals)) {
                    newCustomRates.metals[key] = ratesData.metals[key];
                    updatedCount++;
                }
            }
            if (ratesData.stocks) {
                for (const key of Object.keys(ratesData.stocks)) {
                    newCustomRates.stocks[key] = ratesData.stocks[key];
                    updatedCount++;
                }
            }

            if (updatedCount === 0) {
                throw new Error("No matching assets found in the database to update.");
            }

            // Save custom override rates
            await setDoc(ratesRef, newCustomRates);

            // --- ALSO UPDATE LIVE RATES FOR DIRECT ASSET DISPLAY SYNC ---
            try {
                if (ratesData.crypto && Object.keys(ratesData.crypto).length > 0) {
                    const cryptoRatesRef = doc(db, 'coins_rates_crypto', 'latest');
                    const cryptoRatesSnap = await getDoc(cryptoRatesRef);
                    let cryptoRatesData = cryptoRatesSnap.exists() ? cryptoRatesSnap.data() : { rates: [], syncedAt: Date.now() };
                    let cryptoRatesArray = Array.isArray(cryptoRatesData.rates) ? cryptoRatesData.rates : [];

                    let hasCryptoChanges = false;
                    for (const coinId of Object.keys(ratesData.crypto)) {
                        const price = ratesData.crypto[coinId];
                        const coin = cryptoCoins.find(c => c.id === coinId);
                        const cleanSymbol = coin ? (coin.code || coin.symbol || coin.id.replace('USDT', '').toUpperCase()) : coinId.replace('USDT', '').toUpperCase();

                        const idx = cryptoRatesArray.findIndex(c => c && c.id === coinId);
                        if (idx !== -1) {
                            cryptoRatesArray[idx].rate = price;
                            hasCryptoChanges = true;
                        } else {
                            cryptoRatesArray.push({
                                id: coinId,
                                symbol: cleanSymbol,
                                name: `${cleanSymbol}/USDT`,
                                fullName: cleanSymbol,
                                rate: price,
                                change: '+0.00%',
                                flag: `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${cleanSymbol.toLowerCase()}.png`,
                                category: 'Cryptocurrency',
                                volume24h: '0M',
                                high24h: 'N/A',
                                low24h: 'N/A',
                                isLive: true
                            });
                            hasCryptoChanges = true;
                        }
                    }
                    if (hasCryptoChanges) {
                        await setDoc(cryptoRatesRef, { ...cryptoRatesData, rates: cryptoRatesArray, syncedAt: Date.now() });
                    }
                }

                if (ratesData.forex && Object.keys(ratesData.forex).length > 0) {
                    const forexRatesRef = doc(db, 'coins_rates_forex', 'latest');
                    const forexRatesSnap = await getDoc(forexRatesRef);
                    let forexRatesData = forexRatesSnap.exists() ? forexRatesSnap.data() : { provider: 'metals.dev', rates: {}, syncedAt: Date.now() };
                    
                    let hasForexChanges = false;
                    for (const coinId of Object.keys(ratesData.forex)) {
                        const price = ratesData.forex[coinId];
                        const coin = forexCoins.find(c => c.id === coinId);
                        const currency = coin ? (coin.code || coin.id.replace('fx-', '').toUpperCase()) : coinId.replace('fx-', '').toUpperCase();

                        if (forexRatesData.provider === 'metals.dev') {
                            if (!forexRatesData.rates) forexRatesData.rates = {};
                            forexRatesData.rates[currency] = 1 / Number(price);
                            hasForexChanges = true;
                        } else {
                            if (!forexRatesData.rates) forexRatesData.rates = {};
                            // Support both exchangerate-api schemas: flat rates object and double nested rates.rates object
                            forexRatesData.rates[currency] = 1 / Number(price);
                            if (typeof forexRatesData.rates === 'object') {
                                if (!forexRatesData.rates.rates) forexRatesData.rates.rates = {};
                                forexRatesData.rates.rates[currency] = 1 / Number(price);
                            }
                            hasForexChanges = true;
                        }
                    }
                    if (hasForexChanges) {
                        await setDoc(forexRatesRef, { ...forexRatesData, syncedAt: Date.now() });
                    }
                }

                if (ratesData.metals && Object.keys(ratesData.metals).length > 0) {
                    const metalsRatesRef = doc(db, 'coins_rates_metals', 'latest');
                    const metalsRatesSnap = await getDoc(metalsRatesRef);
                    let metalsRatesData = metalsRatesSnap.exists() ? metalsRatesSnap.data() : { rates: {}, syncedAt: Date.now() };
                    let metalsRatesObj = metalsRatesData.rates || {};

                    let hasMetalsChanges = false;
                    for (const coinId of Object.keys(ratesData.metals)) {
                        const price = ratesData.metals[coinId];
                        const coin = metalsCoins.find(c => c.id === coinId);
                        if (coin) {
                            const labelLower = coin.label.toLowerCase();
                            let cleanKey = coin.label.split('(')[0]?.trim()?.toLowerCase()?.replace('/usd', '');
                            
                            if (labelLower.includes('gold')) cleanKey = 'gold';
                            else if (labelLower.includes('silver')) cleanKey = 'silver';
                            else if (labelLower.includes('platinum')) cleanKey = 'platinum';
                            else if (labelLower.includes('palladium')) cleanKey = 'palladium';
                            else if (labelLower.includes('copper')) cleanKey = 'copper';
                            else if (labelLower.includes('aluminum')) cleanKey = 'aluminum';
                            else if (labelLower.includes('zinc')) cleanKey = 'zinc';
                            else if (labelLower.includes('nickel')) cleanKey = 'nickel';
                            else if (labelLower.includes('lead')) cleanKey = 'lead';

                            if (cleanKey) {
                                metalsRatesObj[cleanKey] = Number(price);
                                hasMetalsChanges = true;
                            }
                        }
                    }
                    if (hasMetalsChanges) {
                        await setDoc(metalsRatesRef, { ...metalsRatesData, rates: metalsRatesObj, syncedAt: Date.now() });
                    }
                }

                if (ratesData.stocks && Object.keys(ratesData.stocks).length > 0) {
                    const stocksRatesRef = doc(db, 'coins_rates_stocks', 'latest');
                    const stocksRatesSnap = await getDoc(stocksRatesRef);
                    let stocksRatesData = stocksRatesSnap.exists() ? stocksRatesSnap.data() : { rates: {}, syncedAt: Date.now() };
                    let stocksRatesObj = stocksRatesData.rates || {};

                    let hasStocksChanges = false;
                    for (const coinId of Object.keys(ratesData.stocks)) {
                        const price = ratesData.stocks[coinId];
                        const symbol = coinId.replace('stock-', '').toUpperCase();
                        stocksRatesObj[symbol] = { price: price };
                        hasStocksChanges = true;
                    }
                    if (hasStocksChanges) {
                        await setDoc(stocksRatesRef, { ...stocksRatesData, rates: stocksRatesObj, syncedAt: Date.now() });
                    }
                }
            } catch (liveErr) {
                console.error("Warning: Live rates table sync failed:", liveErr);
            }

            setUpdatedTables(prev => ({ ...prev, [tableId]: true }));
            showToast('success', 'Rate updated successfully');

            if (onRatesUpdated) {
                onRatesUpdated();
            }
        } catch (err) {
            console.error("Error updating custom rates from table:", err);
            showToast('error', err.message || 'Failed to update rates');
        } finally {
            setUpdatingIndex(null);
        }
    };
    const [messages, setMessages] = useState([
        { role: 'assistant', content: aiBotConfig.greetingMessage, timestamp: Date.now() }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchStatus, setSearchStatus] = useState('');
    const messagesEndRef = useRef(null);

    // ─── Scoped Table & Message Renderers ──────────────────────────────────────────
    const renderTable = (tableData, tableId, category, ratesData) => {
        const { headers, rows } = tableData;
        const isThisUpdating = updatingIndex === tableId;
        const isThisUpdated = updatedTables[tableId] === true;

        const categoryMeta = {
            crypto: { label: 'Cryptocurrency Rates', color: '#f7931a', bg: 'rgba(247, 147, 26, 0.15)', border: '1px solid rgba(247, 147, 26, 0.3)', icon: '🪙' },
            forex: { label: 'Forex Exchange Rates', color: '#00c087', bg: 'rgba(0, 192, 135, 0.15)', border: '1px solid rgba(0, 192, 135, 0.3)', icon: '💱' },
            metals: { label: 'Precious Metals Rates', color: '#f0b90b', bg: 'rgba(240, 185, 11, 0.15)', border: '1px solid rgba(240, 185, 11, 0.3)', icon: '🥇' },
            stocks: { label: 'Stock Rates', color: '#7c6af7', bg: 'rgba(124, 106, 247, 0.15)', border: '1px solid rgba(124, 106, 247, 0.3)', icon: '📈' }
        };

        const meta = categoryMeta[category] || categoryMeta.crypto;

        const downloadCSV = () => {
            const csvRows = [];
            csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));
            rows.forEach(row => {
                csvRows.push(row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','));
            });
            const csvContent = csvRows.join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `table_export_${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        };

        const downloadPDF = () => {
            const printWindow = window.open('', '_blank', 'width=800,height=600');
            if (!printWindow) return;
            const html = `
                <html>
                <head>
                    <title>Export PDF - DevBeast</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                            padding: 40px;
                            color: #333;
                        }
                        h2 {
                            color: ${aiBotConfig.primaryColor};
                            margin-bottom: 5px;
                        }
                        .meta {
                            font-size: 12px;
                            color: #666;
                            margin-bottom: 20px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 10px;
                        }
                        th, td {
                            border: 1px solid #ddd;
                            padding: 12px 15px;
                            text-align: left;
                        }
                        th {
                            background-color: ${aiBotConfig.primaryColor};
                            color: white;
                        }
                        tr:nth-child(even) {
                            background-color: #f9f9f9;
                        }
                    </style>
                </head>
                <body>
                    <h2>Market Price Comparison Report</h2>
                    <div class="meta">Generated by ${aiBotConfig.assistantName} AI Assistant on ${new Date().toLocaleString()}</div>
                    <table>
                        <thead>
                            <tr>
                                ${headers.map(h => `<th>${h}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.map(row => `
                                <tr>
                                    ${row.map(cell => `<td>${cell}</td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <script>
                        window.onload = function() {
                            window.print();
                            window.close();
                        }
                    </script>
                </body>
                </html>
            `;
            printWindow.document.write(html);
            printWindow.document.close();
        };

        return (
            <div style={{ margin: '14px 0', overflowX: 'auto', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', padding: '12px' }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '10px',
                    fontWeight: '800',
                    color: meta.color,
                    background: meta.bg,
                    border: meta.border,
                    padding: '3px 9px',
                    borderRadius: '20px',
                    marginBottom: '10px',
                    letterSpacing: '0.4px',
                    textTransform: 'uppercase'
                }}>
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#ddd' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                            {headers.map((h, i) => (
                                <th key={i} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: '700', color: aiBotConfig.primaryColor }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rIdx) => (
                            <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: rIdx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                                {row.map((cell, cIdx) => (
                                    <td key={cIdx} style={{ padding: '8px 10px' }}>{cell}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center' }}>
                    <button
                        onClick={() => handleUpdateRates(ratesData, tableId)}
                        disabled={updatingIndex !== null}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            background: isThisUpdated ? 'rgba(0, 192, 135, 0.15)' : 'rgba(255,255,255,0.05)',
                            border: isThisUpdated ? '1px solid #00c087' : '1px solid rgba(255,255,255,0.1)',
                            color: isThisUpdated ? '#00c087' : '#ccc',
                            padding: '6px 12px', borderRadius: '8px',
                            fontSize: '11px', fontWeight: '600',
                            cursor: updatingIndex !== null ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            marginRight: 'auto'
                        }}
                    >
                        {isThisUpdating ? (
                            <Loader2 size={12} className="spin" />
                        ) : isThisUpdated ? (
                            <CheckCircle2 size={12} />
                        ) : (
                            <Save size={12} />
                        )}
                        {isThisUpdating ? 'Updating...' : isThisUpdated ? 'Updated' : 'Update'}
                    </button>

                    <button
                        onClick={downloadPDF}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            background: aiBotConfig.highlightBackground, border: aiBotConfig.highlightBorder,
                            color: aiBotConfig.primaryColor, padding: '6px 12px', borderRadius: '8px',
                            fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Download size={12} />
                        Download PDF
                    </button>
                    <button
                        onClick={downloadCSV}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#ccc', padding: '6px 12px', borderRadius: '8px',
                            fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Download size={12} />
                        Download CSV
                    </button>
                </div>
            </div>
        );
    };

    const renderMessageContent = (msg, msgIdx) => {
        if (!msg) return null;
        const content = typeof msg === 'string' ? msg : msg.content;
        if (!content) return null;

        if (typeof content === 'object' && content !== null) {
            const headers = ['Asset Name', 'Our Database Price', 'Live Google Price', 'Difference / Status'];
            const rows = Object.keys(content).map(assetName => {
                const item = content[assetName] || {};
                return [
                    assetName,
                    item.databaseRate || '',
                    item.liveGoogleRate || '',
                    item.difference || ''
                ];
            });
            const tableId = `${msgIdx}-structured`;
            const category = detectTableCategory(headers, rows, '');
            const ratesData = (typeof msg === 'object' && msg !== null && msg.ratesData) ? msg.ratesData : extractRatesData(content);
            return (
                <React.Fragment key={`table-structured`}>
                    {renderTable({ headers, rows }, tableId, category, ratesData)}
                </React.Fragment>
            );
        }

        const lines = content.split('\n');
        const parts = [];
        let currentTableLines = null;

        const flushTable = () => {
            if (currentTableLines) {
                const tableText = currentTableLines.join('\n');
                const tableData = parseTable(tableText);
                if (tableData) {
                    parts.push({ type: 'table', data: tableData });
                } else {
                    parts.push({ type: 'text', content: tableText });
                }
                currentTableLines = null;
            }
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
                if (!currentTableLines) {
                    currentTableLines = [];
                }
                currentTableLines.push(line);
            } else {
                flushTable();

                const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
                let match;
                let lastIndex = 0;

                if (line.match(imageRegex)) {
                    while ((match = imageRegex.exec(line)) !== null) {
                        const matchIndex = match.index;
                        const precedingText = line.substring(lastIndex, matchIndex);
                        if (precedingText) {
                            parts.push({ type: 'text', content: precedingText });
                        }
                        parts.push({ type: 'image', alt: match[1], url: match[2] });
                        lastIndex = imageRegex.lastIndex;
                    }
                    const remainingText = line.substring(lastIndex);
                    if (remainingText) {
                        parts.push({ type: 'text', content: remainingText });
                    }
                } else {
                    parts.push({ type: 'text', content: line });
                }
            }
        }
        flushTable();

        const renderedElements = [];
        let textBuffer = [];

        const flushTextBuffer = (key) => {
            if (textBuffer.length > 0) {
                const combinedText = textBuffer.join('\n');
                renderedElements.push(
                    <span key={key} style={{ whiteSpace: 'pre-wrap' }}>
                        {combinedText}
                    </span>
                );
                textBuffer = [];
            }
        };

        let tableCount = 0;
        parts.forEach((part, index) => {
            if (part.type === 'text') {
                textBuffer.push(part.content);
            } else {
                flushTextBuffer(`text-buf-${index}`);
                if (part.type === 'table') {
                    const currentTableIdx = tableCount++;
                    const tableId = `${msgIdx}-${currentTableIdx}`;
                    const category = detectTableCategory(part.data.headers, part.data.rows, content);
                    const ratesData = (typeof msg === 'object' && msg !== null && msg.ratesData) ? msg.ratesData : extractRatesData(content);
                    renderedElements.push(
                        <React.Fragment key={`table-${index}`}>
                            {renderTable(part.data, tableId, category, ratesData)}
                        </React.Fragment>
                    );
                } else if (part.type === 'image') {
                    renderedElements.push(<React.Fragment key={`image-${index}`}>{renderImage(part.alt, part.url)}</React.Fragment>);
                }
            }
        });
        flushTextBuffer(`text-buf-final`);

        return <div style={{ display: 'flex', flexDirection: 'column' }}>{renderedElements}</div>;
    };

    // Resizable UI States & Handlers
    const [width, setWidth] = useState(550); // Default wider layout
    const [isResizing, setIsResizing] = useState(false);

    // Responsive UI state listeners
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
    const [windowHeight, setWindowHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 768);

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
            setWindowHeight(window.innerHeight);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth < 640;
    const renderWidth = isMobile ? windowWidth - 32 : width;
    const renderHeight = isMobile ? Math.min(580, windowHeight - 120) : 700;
    const renderRight = isMobile ? '16px' : '30px';
    const renderBottom = isMobile ? '90px' : '100px';

    // Persistent Chat Session Management
    const [sessions, setSessions] = useState(() => {
        try {
            const saved = localStorage.getItem('cheap_coins_bot_sessions');
            const loadedSessions = saved ? JSON.parse(saved) : [];
            const demoSessions = [
                ...cryptoChats,
                ...exchangeChats,
                ...metalsChats,
                ...stocksChats
            ];

            const existingIds = new Set(loadedSessions.map(s => s.id));
            const merged = [...loadedSessions];
            let addedAny = false;

            for (const ds of demoSessions) {
                if (!existingIds.has(ds.id)) {
                    merged.push(ds);
                    addedAny = true;
                }
            }

            merged.sort((a, b) => b.timestamp - a.timestamp);

            if (addedAny && typeof window !== 'undefined') {
                localStorage.setItem('cheap_coins_bot_sessions', JSON.stringify(merged));
            }
            return merged;
        } catch (e) {
            console.error('Error loading chat sessions:', e);
            return [];
        }
    });

    const [currentSessionId, setCurrentSessionId] = useState(() => {
        try {
            const lastSession = localStorage.getItem('cheap_coins_bot_last_session');
            return lastSession || Date.now().toString();
        } catch (e) {
            return Date.now().toString();
        }
    });

    const [showHistory, setShowHistory] = useState(false);

    // Sync active session messages
    useEffect(() => {
        const activeSession = sessions.find(s => s.id === currentSessionId);
        if (activeSession) {
            setMessages(activeSession.messages);
        } else {
            setMessages([
                { role: 'assistant', content: aiBotConfig.greetingMessage, timestamp: Date.now() }
            ]);
        }
        setUpdatedTables({});
        localStorage.setItem('cheap_coins_bot_last_session', currentSessionId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentSessionId]);

    const saveSession = (sessionId, updatedMessages) => {
        let newSessionsList = [];
        setSessions(prev => {
            const newSessions = [...prev];
            const sessionIdx = newSessions.findIndex(s => s.id === sessionId);

            let title = 'New Chat';
            const firstUserMsg = updatedMessages.find(m => m.role === 'user');
            if (firstUserMsg) {
                title = firstUserMsg.content.substring(0, 30);
                if (firstUserMsg.content.length > 30) title += '...';
            } else {
                title = `Chat on ${new Date(parseInt(sessionId, 10) || Date.now()).toLocaleDateString()}`;
            }

            const sessionObj = {
                id: sessionId,
                title,
                timestamp: Date.now(),
                messages: updatedMessages
            };

            if (sessionIdx !== -1) {
                newSessions[sessionIdx] = sessionObj;
            } else {
                newSessions.unshift(sessionObj);
            }
            newSessionsList = newSessions;
            return newSessions;
        });

        // Defer localStorage write to macro-task queue to prevent main-thread blockage
        setTimeout(() => {
            try {
                if (newSessionsList.length > 0) {
                    localStorage.setItem('cheap_coins_bot_sessions', JSON.stringify(newSessionsList));
                }
            } catch (e) {
                console.error('Failed to save sessions:', e);
            }
        }, 0);
    };

    const handleNewChat = () => {
        const newId = Date.now().toString();
        setCurrentSessionId(newId);
        setMessages([
            { role: 'assistant', content: aiBotConfig.greetingMessage, timestamp: Date.now() }
        ]);
        setShowHistory(false);
    };

    const handleLoadChat = (sessionId) => {
        setCurrentSessionId(sessionId);
        setShowHistory(false);
    };

    const handleDeleteChat = (sessionId, e) => {
        e.stopPropagation();
        let updatedSessions = [];
        setSessions(prev => {
            const newSessions = prev.filter(s => s.id !== sessionId);
            updatedSessions = newSessions;
            return newSessions;
        });

        // Defer disk I/O to macro-task queue
        setTimeout(() => {
            try {
                localStorage.setItem('cheap_coins_bot_sessions', JSON.stringify(updatedSessions));
            } catch (err) {
                console.error(err);
            }
        }, 0);

        if (sessionId === currentSessionId) {
            handleNewChat();
        }
    };

    const startResize = (e) => {
        e.preventDefault();
        setIsResizing(true);
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing || isMobile) return;
            const newWidth = window.innerWidth - (isMobile ? 16 : 30) - e.clientX;
            if (newWidth > 360 && newWidth < 900) {
                setWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, isMobile]);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    // ─── Main Send ─────────────────────────────────────────────────────────────
    const handleSend = async (overrideMsg = null) => {
        const userMsg = typeof overrideMsg === 'string' ? overrideMsg : input.trim();
        if (!userMsg || isLoading) return;

        setInput('');
        const newMessages = [...messages, { role: 'user', content: userMsg, timestamp: Date.now() }];
        setMessages(newMessages);
        saveSession(currentSessionId, newMessages);
        setIsLoading(true);
        setSearchStatus('🔍 Searching the web...');

        const formattedContents = [];
        for (const m of newMessages.slice(-15)) {
            const role = m.role === 'assistant' ? 'model' : 'user';
            const textContent = getMessageText(m);
            if (formattedContents.length > 0 && formattedContents[formattedContents.length - 1].role === role) {
                formattedContents[formattedContents.length - 1].parts[0].text += `\n${textContent}`;
            } else {
                formattedContents.push({
                    role,
                    parts: [{ text: textContent }]
                });
            }
        }

        const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];
        const keys = getApiKeys();
        if (keys.length === 0) {
            setMessages(prev => {
                const updated = [...prev, { role: 'assistant', content: `${aiBotConfig.assistantName} Error: No Gemini API keys found in VITE_GEMINI_API_KEYS inside your .env configuration.`, timestamp: Date.now() }];
                saveSession(currentSessionId, updated);
                return updated;
            });
            setIsLoading(false);
            setSearchStatus('');
            return;
        }
        let success = false;
        let lastError = null;
        let reply = '';
        let attemptCount = 0;

        for (const model of models) {
            if (success) break;
            for (const currentKey of keys) {
                if (attemptCount > 0) {
                    setSearchStatus(`🔄 Retrying ${attemptCount}...`);
                    await new Promise(resolve => setTimeout(resolve, 800));
                }
                attemptCount++;

                try {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentKey}`;
                    const response = await fetch(url, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            contents: formattedContents,
                            systemInstruction: {
                                parts: [{ text: getSystemPrompt(coinsContext) }]
                            },
                            tools: [
                                {
                                    google_search: {}
                                }
                            ]
                        })
                    });

                    if (!response.ok) {
                        const errData = await response.json();
                        throw new Error(errData.error?.message || "HTTP Error");
                    }

                    const data = await response.json();
                    reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response. Please try again.";
                    success = true;
                    break;
                } catch (error) {
                    console.warn(`Attempt ${attemptCount} failed with model ${model} and key:`, error);
                    lastError = error;
                }
            }
        }

        if (success) {
            setMessages(prev => {
                const parsedRatesData = extractRatesData(reply);
                const parsedContentObj = {};
                const parsedTableData = parseTable(reply);
                if (parsedTableData) {
                    const { headers, rows } = parsedTableData;
                    let googlePriceColIdx = 2;
                    let dbPriceColIdx = 1;
                    let diffColIdx = 3;
                    for (let i = 0; i < headers.length; i++) {
                        const h = headers[i].toLowerCase();
                        if (h.includes('google') || h.includes('live')) {
                            googlePriceColIdx = i;
                        } else if (h.includes('database') || h.includes('our')) {
                            dbPriceColIdx = i;
                        } else if (h.includes('difference') || h.includes('status')) {
                            diffColIdx = i;
                        }
                    }
                    rows.forEach(row => {
                        const assetName = row[0];
                        if (assetName) {
                            parsedContentObj[assetName] = {
                                databaseRate: row[dbPriceColIdx] || '',
                                liveGoogleRate: row[googlePriceColIdx] || '',
                                difference: row[diffColIdx] || ''
                            };
                        }
                    });
                }

                const finalContent = Object.keys(parsedContentObj).length > 0 ? parsedContentObj : reply;
                const updated = [...prev, { role: 'assistant', content: finalContent, timestamp: Date.now(), ratesData: parsedRatesData }];
                saveSession(currentSessionId, updated);
                return updated;
            });
        } else {
            console.error("DevBeast API Error: All keys failed.", lastError);
            setMessages(prev => {
                const updated = [...prev, { role: 'assistant', content: `${aiBotConfig.assistantName} Error: ${lastError?.message || "All API keys failed"}`, timestamp: Date.now() }];
                saveSession(currentSessionId, updated);
                return updated;
            });
        }
        setIsLoading(false);
        setSearchStatus('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    // ─── Dynamic Shortcuts Generator ───────────────────────────────────────────
    const getShortcuts = () => {
        const cryptoCoins = coinsContext?.cryptoCoins || [];
        const forexCoins = coinsContext?.forexCoins || [];
        const metalsCoins = coinsContext?.metalsCoins || [];
        const stocksCoins = coinsContext?.stocksCoins || [];

        const cryptoList = cryptoCoins
            .map(c => c.code || c.label.split('/')[0])
            .filter(Boolean)
            .join(', ');

        const forexList = forexCoins
            .map(c => c.label || c.id.replace('fx-', '').toUpperCase())
            .filter(Boolean)
            .join(', ');

        const metalsList = metalsCoins
            .map(c => c.label.split('(')[0].trim())
            .filter(Boolean)
            .join(', ');

        const stocksList = stocksCoins
            .map(c => c.label.split('(')[0].trim())
            .filter(Boolean)
            .join(', ');

        return [
            {
                label: '🪙 All Crypto Rates',
                prompt: `Compare our database rates with the current live rates of these cryptocurrency assets: ${cryptoList}. Show the comparison in a Markdown table.`
            },
            {
                label: '💱 All Exchange Rates',
                prompt: `Compare our database rates with the current live exchange rates of these currency pairs: ${forexList}. Show the comparison in a Markdown table.`
            },
            {
                label: '🥇 All Metals Rates',
                prompt: `Compare our database rates with the current live rates of these precious metals: ${metalsList}. Show the comparison in a Markdown table.`
            },
            {
                label: '📈 All Stocks Rates',
                prompt: `Compare our database rates with the current live rates of these stocks: ${stocksList}. Show the comparison in a Markdown table.`
            }
        ];
    };

    const shortcuts = getShortcuts();

    return (
        <>
            <motion.button
                initial={{ scale: 0 }} animate={{ scale: 1 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed', bottom: '30px', right: '30px',
                    width: '60px', height: '60px', borderRadius: '50%',
                    background: `linear-gradient(135deg, ${aiBotConfig.buttonGradientStart} 0%, ${aiBotConfig.buttonGradientEnd} 100%)`,
                    border: 'none', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: aiBotConfig.buttonShadow,
                    cursor: 'pointer', zIndex: 9999,
                }}
            >
                {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }} transition={{ duration: 0.2 }}
                        style={{
                            position: 'fixed', bottom: renderBottom, right: renderRight,
                            width: `${renderWidth}px`, height: `${renderHeight}px`,
                            background: aiBotConfig.panelBackground,
                            border: aiBotConfig.panelBorder,
                            borderRadius: '24px', backdropFilter: 'blur(20px)',
                            boxShadow: aiBotConfig.panelShadow,
                            zIndex: 9998, display: 'flex', flexDirection: 'column', overflow: 'hidden'
                        }}
                    >
                        {/* Drag Handle for Resizing (Desktop Only) */}
                        {!isMobile && (
                            <div
                                onMouseDown={startResize}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '8px',
                                    height: '100%',
                                    cursor: 'ew-resize',
                                    background: isResizing ? aiBotConfig.highlightHoverBackground : 'transparent',
                                    borderLeft: isResizing ? `2px solid ${aiBotConfig.primaryColor}` : '1px solid transparent',
                                    zIndex: 9999,
                                    transition: 'all 0.1s ease-in-out'
                                }}
                            />
                        )}

                        {/* Floating Success/Error Toast notification overlay inside AI Bot */}
                        <AnimatePresence>
                            {toast.show && (
                                <motion.div
                                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 15, scale: 1 }}
                                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                    style={{
                                        position: 'absolute',
                                        top: '60px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: toast.type === 'success' ? 'rgba(0, 192, 135, 0.95)' : 'rgba(255, 77, 79, 0.95)',
                                        color: '#fff',
                                        padding: '8px 18px',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                                        border: toast.type === 'success' ? '1px solid rgba(0, 192, 135, 0.2)' : '1px solid rgba(255, 77, 79, 0.2)',
                                        backdropFilter: 'blur(8px)',
                                        zIndex: 99999,
                                        whiteSpace: 'nowrap',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}
                                >
                                    {toast.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                    {toast.msg}
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div style={{
                            padding: '16px 18px', background: 'rgba(255,255,255,0.03)',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '12px',
                                    background: aiBotConfig.highlightBackground,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: aiBotConfig.primaryColor
                                }}>
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, color: '#fff', fontSize: '14px', fontWeight: '700' }}>{aiBotConfig.assistantName} AI Assistant</h3>
                                    <p style={{ margin: 0, fontSize: '10px', marginTop: '2px', color: '#717070ff', fontWeight: '600' }}>
                                        ● {aiBotConfig.engineLabel}
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {/* History Toggle Button */}
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowHistory(!showHistory)}
                                    title="Chat History"
                                    style={{
                                        background: showHistory ? aiBotConfig.highlightHoverBackground : 'rgba(255,255,255,0.03)',
                                        border: showHistory ? aiBotConfig.highlightBorder : '1px solid rgba(255,255,255,0.08)',
                                        color: showHistory ? aiBotConfig.primaryColor : '#aaa',
                                        width: '32px', height: '32px', borderRadius: '8px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer'
                                    }}>
                                    <History size={16} />
                                </motion.button>

                                {/* New Chat Button */}
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={handleNewChat}
                                    title="New Chat"
                                    style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        color: '#aaa',
                                        width: '32px', height: '32px', borderRadius: '8px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer'
                                    }}>
                                    <Plus size={16} />
                                </motion.button>
                            </div>
                        </div>

                        {/* Slide-out History Panel Drawer */}
                        <AnimatePresence>
                            {showHistory && (
                                <motion.div
                                    initial={{ x: '100%' }}
                                    animate={{ x: 0 }}
                                    exit={{ x: '100%' }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                    style={{
                                        position: 'absolute',
                                        top: '69px', // right below the header
                                        right: 0,
                                        width: '100%',
                                        height: 'calc(100% - 69px)',
                                        background: '#0d0d0d',
                                        borderLeft: '1px solid rgba(255,255,255,0.08)',
                                        zIndex: 9997,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        padding: '16px'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                        <h4 style={{ margin: 0, color: '#fff', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Past Conversations</h4>
                                        <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>Close</button>
                                    </div>

                                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {sessions.length === 0 ? (
                                            <div style={{ color: '#555', fontSize: '12px', textAlign: 'center', marginTop: '40px' }}>
                                                No saved chats yet.
                                            </div>
                                        ) : (
                                            sessions.map(s => {
                                                const isActive = s.id === currentSessionId;
                                                return (
                                                    <div
                                                        key={s.id}
                                                        onClick={() => handleLoadChat(s.id)}
                                                        style={{
                                                            padding: '12px 14px',
                                                            background: isActive ? aiBotConfig.highlightBackground : 'rgba(255,255,255,0.02)',
                                                            border: isActive ? aiBotConfig.highlightBorder : '1px solid rgba(255,255,255,0.05)',
                                                            borderRadius: '12px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    >
                                                        <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                                                            <div style={{ color: isActive ? aiBotConfig.primaryColor : '#ddd', fontSize: '12px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {s.title}
                                                            </div>
                                                            <div style={{ color: '#555', fontSize: '9px', marginTop: '4px' }}>
                                                                {new Date(parseInt(s.id, 10)).toLocaleString()}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={(e) => handleDeleteChat(s.id, e)}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                color: '#ff4d4f',
                                                                cursor: 'pointer',
                                                                opacity: 0.6,
                                                                transition: 'opacity 0.2s',
                                                                padding: '4px'
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                                            onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div style={{
                            padding: '10px 16px 0', display: 'flex', gap: '6px',
                            overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0
                        }}>
                            {shortcuts.map(s => (
                                <button key={s.label} onClick={() => handleSend(s.prompt)} disabled={isLoading}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#bbb', padding: '5px 11px', borderRadius: '14px',
                                        fontSize: '11px', whiteSpace: 'nowrap',
                                        cursor: isLoading ? 'not-allowed' : 'pointer',
                                        opacity: isLoading ? 0.4 : 1, transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.background = aiBotConfig.highlightBackground; e.currentTarget.style.color = aiBotConfig.accentColor; e.currentTarget.style.borderColor = aiBotConfig.primaryColor; } }}
                                    onMouseLeave={e => { if (!isLoading) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#bbb'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; } }}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>

                        <div style={{
                            flex: 1, overflowY: 'auto', padding: '16px',
                            display: 'flex', flexDirection: 'column', gap: '14px'
                        }}>
                            {messages.map((msg, idx) => (
                                <div key={`msg-${idx}-${msg.role}`} style={{
                                    display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                                    gap: '10px', alignItems: 'flex-start'
                                }}>
                                    <div style={{
                                        width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, marginTop: '4px',
                                        background: msg.role === 'user' ? 'rgba(255,255,255,0.1)' : aiBotConfig.highlightBackground,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: msg.role === 'user' ? '#fff' : aiBotConfig.primaryColor,
                                    }}>
                                        {msg.role === 'user' ? <User size={13} /> : <Bot size={13} />}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '87%' }}>
                                        <div style={{
                                            background: msg.role === 'user' ? aiBotConfig.userBubbleBackground : aiBotConfig.botBubbleBackground,
                                            color: msg.role === 'user' ? aiBotConfig.userBubbleTextColor : aiBotConfig.botBubbleTextColor,
                                            padding: '10px 14px', fontSize: '13px', lineHeight: '1.55',
                                            fontWeight: msg.role === 'user' ? '600' : '400',
                                            borderRadius: '14px',
                                            borderTopRightRadius: msg.role === 'user' ? '4px' : '14px',
                                            borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '14px',
                                            whiteSpace: msg.role === 'user' ? 'pre-wrap' : 'normal',
                                            width: '100%'
                                        }}>
                                            {msg.role === 'user' ? msg.content : renderMessageContent(msg, idx)}
                                        </div>
                                        {msg.timestamp && (
                                            <span style={{ fontSize: '9px', color: '#666', marginTop: '4px', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', padding: '0 4px' }}>
                                                {new Date(msg.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <div style={{
                                        width: '26px', height: '26px', borderRadius: '50%',
                                        background: aiBotConfig.highlightBackground,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: aiBotConfig.primaryColor
                                    }}>
                                        <Bot size={13} />
                                    </div>
                                    <motion.div
                                        animate={{ opacity: [0.4, 1, 0.4] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        style={{ color: '#777', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <Loader2 size={13} className="spin" />
                                        {searchStatus || 'Searching...'}
                                    </motion.div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div style={{
                            padding: '14px', borderTop: '1px solid rgba(255,255,255,0.05)',
                            background: 'rgba(255,255,255,0.02)', display: 'flex', gap: '8px'
                        }}>
                            <textarea
                                value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                                placeholder={aiBotConfig.placeholderText}
                                rows={1}
                                style={{
                                    flex: 1, background: 'rgba(0,0,0,0.25)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '10px', padding: '10px 14px', color: '#fff',
                                    fontSize: '13px', outline: 'none', resize: 'none',
                                    minHeight: '40px', maxHeight: '120px', fontFamily: 'inherit'
                                }}
                            />
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                onClick={handleSend} disabled={isLoading || !input.trim()}
                                style={{
                                    width: '40px', height: '40px', borderRadius: '10px',
                                    background: aiBotConfig.primaryColor, border: 'none', color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer',
                                    opacity: (isLoading || !input.trim()) ? 0.4 : 1
                                }}>
                                <Send size={16} style={{ marginLeft: '2px' }} />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
        </>
    );
};

export default AdminCoinsAIBot;
