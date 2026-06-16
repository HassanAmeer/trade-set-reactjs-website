import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Loader2, Trash2, History, Plus, Download } from 'lucide-react';
import { aiBotConfig } from './aiBotConfig';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

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

const renderTable = (tableData) => {
    const { headers, rows } = tableData;

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
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}>
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

const renderMessageContent = (content) => {
    if (!content) return null;

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

    parts.forEach((part, index) => {
        if (part.type === 'text') {
            textBuffer.push(part.content);
        } else {
            flushTextBuffer(`text-buf-${index}`);
            if (part.type === 'table') {
                renderedElements.push(<React.Fragment key={`table-${index}`}>{renderTable(part.data)}</React.Fragment>);
            } else if (part.type === 'image') {
                renderedElements.push(<React.Fragment key={`image-${index}`}>{renderImage(part.alt, part.url)}</React.Fragment>);
            }
        }
    });
    flushTextBuffer(`text-buf-final`);

    return <div style={{ display: 'flex', flexDirection: 'column' }}>{renderedElements}</div>;
};

// ─── Main Component ─────────────────────────────────────────────────────────────
const AdminCoinsAIBot = ({ coinsContext, onAddCoin, onRemoveCoin, onSetVisibility, onRestoreCoin }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: aiBotConfig.greetingMessage, timestamp: Date.now() }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchStatus, setSearchStatus] = useState('');
    const messagesEndRef = useRef(null);

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
            return saved ? JSON.parse(saved) : [];
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
        localStorage.setItem('cheap_coins_bot_last_session', currentSessionId);
    }, [currentSessionId, sessions]);

    const saveSession = (sessionId, updatedMessages) => {
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

            try {
                localStorage.setItem('cheap_coins_bot_sessions', JSON.stringify(newSessions));
            } catch (e) {
                console.error('Failed to save sessions:', e);
            }
            return newSessions;
        });
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
        setSessions(prev => {
            const newSessions = prev.filter(s => s.id !== sessionId);
            try {
                localStorage.setItem('cheap_coins_bot_sessions', JSON.stringify(newSessions));
            } catch (err) {
                console.error(err);
            }
            return newSessions;
        });

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
            if (formattedContents.length > 0 && formattedContents[formattedContents.length - 1].role === role) {
                formattedContents[formattedContents.length - 1].parts[0].text += `\n${m.content}`;
            } else {
                formattedContents.push({
                    role,
                    parts: [{ text: m.content }]
                });
            }
        }

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
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
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response. Please try again.";
            setMessages(prev => {
                const updated = [...prev, { role: 'assistant', content: reply, timestamp: Date.now() }];
                saveSession(currentSessionId, updated);
                return updated;
            });
        } catch (error) {
            console.error("Gemini API Error:", error);
            setMessages(prev => {
                const updated = [...prev, { role: 'assistant', content: `Gemini Error: ${error.message}`, timestamp: Date.now() }];
                saveSession(currentSessionId, updated);
                return updated;
            });
        } finally {
            setIsLoading(false);
            setSearchStatus('');
        }
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
                                            {msg.role === 'user' ? msg.content : renderMessageContent(msg.content)}
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
