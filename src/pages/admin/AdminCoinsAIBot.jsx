import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Loader2, Globe } from 'lucide-react';
import Groq from "groq-sdk";

const groq = new Groq({ 
    apiKey: "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",
    dangerouslyAllowBrowser: true 
});

const getSystemPrompt = (isWebSearchEnabled, contextInfo) => {
    return `You are a concise AI assistant in the "Coins API Settings" admin panel.
Help the admin manage and discover coins, fiat currencies, stocks, and precious metals.
Web Search is currently ${isWebSearchEnabled ? 'ENABLED: You may act as if you have access to live internet search to find new coins, exchange rates, or live data.' : 'DISABLED: Focus only on managing the current coins and answering general questions.'}

Current Active Tab: ${contextInfo?.activeTab || 'Unknown'}
Currently added extra coins in system:
Crypto: ${contextInfo?.extraCoins?.crypto?.join(', ') || 'None'}
Forex: ${contextInfo?.extraCoins?.forex?.join(', ') || 'None'}
Metals: ${contextInfo?.extraCoins?.metals?.join(', ') || 'None'}
Stocks: ${contextInfo?.extraCoins?.stocks?.join(', ') || 'None'}

If the user asks you to ADD, REMOVE, RESTORE, or TOGGLE VISIBILITY of a coin/metal/stock, you MUST respond with ONLY a raw JSON block in the following format so the system can execute it:
{"tool": "add_coin", "tab": "crypto", "code": "BTC"}
{"tool": "remove_coin", "tab": "metals", "code": "XAU"}
{"tool": "toggle_visibility", "code": "BTCUSDT"}
{"tool": "restore_coin", "tab": "stocks", "code": "stock-AMZN"}

Important rules for tools:
- Allowed tool names: add_coin, remove_coin, toggle_visibility, restore_coin.
- Valid tabs: crypto, forex, metals, stocks.
- Do not include any conversational text outside the JSON block when calling a tool.

If the user is just asking a question, answer normally without JSON. Keep responses short and professional.`;
};

const AdminCoinsAIBot = ({ coinsContext, onAddCoin, onRemoveCoin, onToggleVisibility, onRestoreCoin }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello Admin! I am your Coins & Metals AI Assistant. How can I help you manage your assets today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const executeToolCall = async (parsed, historyMessages) => {
        let resultMsg = "";
        try {
            if (parsed.tool === 'add_coin') {
                if (onAddCoin) await onAddCoin(parsed.tab, parsed.code);
                resultMsg = `Successfully executed add_coin for ${parsed.code} in ${parsed.tab}.`;
            } else if (parsed.tool === 'remove_coin') {
                if (onRemoveCoin) await onRemoveCoin(parsed.tab, parsed.code);
                resultMsg = `Successfully executed remove_coin for ${parsed.code} in ${parsed.tab}.`;
            } else if (parsed.tool === 'toggle_visibility') {
                if (onToggleVisibility) await onToggleVisibility(parsed.code);
                resultMsg = `Successfully executed toggle_visibility for ${parsed.code}.`;
            } else if (parsed.tool === 'restore_coin') {
                if (onRestoreCoin) await onRestoreCoin(parsed.tab, parsed.code);
                resultMsg = `Successfully executed restore_coin for ${parsed.code} in ${parsed.tab}.`;
            } else {
                resultMsg = `Failed: Unknown tool ${parsed.tool}.`;
            }
        } catch (e) {
            resultMsg = `Failed to execute tool ${parsed.tool}: ${e.message}`;
        }

        try {
            const doubleRequestMessages = [
                { role: 'system', content: getSystemPrompt(isWebSearchEnabled, coinsContext) },
                ...historyMessages.slice(-6),
                { role: 'assistant', content: JSON.stringify(parsed) },
                { role: 'system', content: `[TOOL_EXECUTION_RESULT] ${resultMsg} Now, reply to the user naturally and confirm what you did.` }
            ];

            const completion = await groq.chat.completions.create({
                model: "groq/compound",
                messages: doubleRequestMessages,
            });

            const finalReply = completion.choices[0]?.message?.content || "Action complete.";
            setMessages(prev => [...prev, { role: 'assistant', content: finalReply }]);
        } catch (error) {
            console.error("Double Request Error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Action executed successfully, but I encountered an error generating the final response." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        
        const userMsg = input.trim();
        setInput('');
        const newMessages = [...messages, { role: 'user', content: userMsg }];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            // Only send the last 6 messages to avoid 413 Request Entity Too Large
            const recentMessages = newMessages.slice(-6);
            const apiMessages = [
                { role: 'system', content: getSystemPrompt(isWebSearchEnabled, coinsContext) },
                ...recentMessages
            ];

            const completion = await groq.chat.completions.create({
                model: "groq/compound",
                messages: apiMessages,
            });

            let replyMsg = completion.choices[0]?.message?.content || "I couldn't generate a response.";
            
            // Check if the reply is a JSON tool call
            try {
                const parsed = JSON.parse(replyMsg.trim());
                if (parsed && parsed.tool) {
                    await executeToolCall(parsed, newMessages);
                    return; // Stop here, double request will handle the final message
                }
            } catch(e) {
                // Not a JSON block, continue normally
            }

            setMessages(prev => [...prev, { role: 'assistant', content: replyMsg }]);
        } catch (error) {
            console.error("Groq API Error:", error);
            let errorMsg = "An error occurred while connecting to the AI. Please try again.";
            
            // Check if it's a 413 payload too large error
            if (error?.status === 413 || error?.message?.includes('413') || error?.message?.includes('Request Entity Too Large')) {
                errorMsg = "Your message or the conversation history is too long for the AI to process. Please try a shorter message or clear the chat.";
            }
            
            setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    bottom: '30px',
                    right: '30px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f7931a 0%, #d87b12 100%)',
                    border: 'none',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 32px rgba(247, 147, 26, 0.4)',
                    cursor: 'pointer',
                    zIndex: 9999,
                }}
            >
                {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'fixed',
                            bottom: '100px',
                            right: '30px',
                            width: '380px',
                            height: '550px',
                            background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '24px',
                            backdropFilter: 'blur(16px)',
                            boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
                            zIndex: 9998,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '16px 20px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, rgba(247, 147, 26, 0.2) 0%, rgba(247, 147, 26, 0.05) 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#f7931a'
                                }}>
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, color: '#fff', fontSize: '15px', fontWeight: '700' }}>Coins AI Assistant</h3>
                                    <p style={{ margin: 0, color: '#888', fontSize: '11px', marginTop: '2px' }}>Powered by Groq Compound</p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
                                style={{
                                    background: isWebSearchEnabled ? 'rgba(0, 192, 135, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                    border: `1px solid ${isWebSearchEnabled ? 'rgba(0, 192, 135, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                                    color: isWebSearchEnabled ? '#00c087' : '#888',
                                    padding: '6px 10px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    fontWeight: '700'
                                }}
                            >
                                <Globe size={14} />
                                {isWebSearchEnabled ? 'Search ON' : 'Search OFF'}
                            </motion.button>
                        </div>

                        {/* Messages Area */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px'
                        }}>
                            {messages.map((msg, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                                    gap: '12px',
                                    alignItems: 'flex-start'
                                }}>
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        background: msg.role === 'user' ? 'rgba(255,255,255,0.1)' : 'rgba(247, 147, 26, 0.15)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: msg.role === 'user' ? '#fff' : '#f7931a',
                                        flexShrink: 0,
                                        marginTop: '4px'
                                    }}>
                                        {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                                    </div>
                                    <div style={{
                                        background: msg.role === 'user' ? '#f7931a' : 'rgba(255, 255, 255, 0.05)',
                                        color: msg.role === 'user' ? '#000' : '#e0e0e0',
                                        padding: '12px 16px',
                                        borderRadius: '16px',
                                        borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
                                        borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
                                        fontSize: '14px',
                                        lineHeight: '1.5',
                                        maxWidth: '85%',
                                        fontWeight: msg.role === 'user' ? '600' : '400',
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        background: 'rgba(247, 147, 26, 0.15)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#f7931a'
                                    }}>
                                        <Bot size={14} />
                                    </div>
                                    <motion.div
                                        animate={{ opacity: [0.4, 1, 0.4] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        style={{ color: '#888', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                        Thinking...
                                    </motion.div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div style={{
                            padding: '16px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            gap: '10px'
                        }}>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask about coins, metals..."
                                rows={1}
                                style={{
                                    flex: 1,
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    padding: '12px 16px',
                                    color: '#fff',
                                    fontSize: '14px',
                                    outline: 'none',
                                    resize: 'none',
                                    minHeight: '44px',
                                    maxHeight: '120px',
                                    fontFamily: 'inherit'
                                }}
                            />
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '12px',
                                    background: '#f7931a',
                                    border: 'none',
                                    color: '#000',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer',
                                    opacity: (isLoading || !input.trim()) ? 0.5 : 1
                                }}
                            >
                                <Send size={18} style={{ marginLeft: '2px' }} />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AdminCoinsAIBot;
