import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import { motion } from 'framer-motion';
import { Menu, Home, Home as HomeIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const Trade = () => {
    const { assets } = useMarket();
    const [selectedAsset] = useState(assets[0]); // GBP/USD
    const [activeTime, setActiveTime] = useState('1 min');

    const timeframes = ['1 min', '5 min', '15 min', '30 min', '60 min', '1 day'];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                backgroundColor: '#111',
                minHeight: '100vh',
                color: '#fff',
                paddingBottom: '100px',
                fontFamily: 'system-ui, sans-serif'
            }}
        >
            {/* Trading Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: '#111',
                borderBottom: '1px solid #222'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Menu size={20} color="#fff" />
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontWeight: '700', fontSize: '18px' }}>{selectedAsset.name}</span>
                        <span style={{ color: '#00c087', fontSize: '14px', fontWeight: '600' }}>0.36%</span>
                    </div>
                </div>
                <Link to="/">
                    <HomeIcon size={20} color="#fff" />
                </Link>
            </div>

            {/* Timeframes */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 16px',
                fontSize: '12px',
                color: '#888'
            }}>
                {timeframes.map(time => (
                    <div
                        key={time}
                        onClick={() => setActiveTime(time)}
                        style={{
                            cursor: 'pointer',
                            color: activeTime === time ? '#fff' : '#888',
                            borderBottom: activeTime === time ? '2px solid var(--accent-gold)' : 'none',
                            paddingBottom: '4px'
                        }}
                    >
                        {time}
                    </div>
                ))}
            </div>

            {/* Technical Info Strip */}
            <div style={{
                padding: '10px 16px',
                fontSize: '11px',
                color: '#666',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '4px',
                backgroundColor: '#111'
            }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <span>Time: 2026-03-06 13:58</span>
                    <span>Open: 1.336430</span>
                    <span>High: 1.336690</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end' }}>
                    <span>Low: 1.335630</span>
                    <span>Close: 1.336660</span>
                    <span>Volume: 696</span>
                </div>
            </div>

            {/* Indicators Strip */}
            <div style={{ padding: '4px 16px', fontSize: '11px', display: 'flex', gap: '12px' }}>
                <span style={{ color: '#555' }}>MA(5,10,20)</span>
                <span style={{ color: '#f0b90b' }}>MA5: 1.3369</span>
                <span style={{ color: '#a855f7' }}>MA10: 1.3370</span>
                <span style={{ color: '#3b82f6' }}>MA20: 1.3372</span>
            </div>

            {/* Main Chart Area */}
            <div style={{
                position: 'relative',
                height: '400px',
                width: '100%',
                borderTop: '1px solid #222',
                borderBottom: '1px solid #222',
                marginTop: '8px',
                backgroundImage: 'linear-gradient(#222 1px, transparent 1px), linear-gradient(90deg, #222 1px, transparent 1px)',
                backgroundSize: '40px 40px'
            }}>
                {/* Right Price Axis */}
                <div style={{
                    position: 'absolute',
                    right: '4px',
                    top: '0',
                    bottom: '0',
                    width: '60px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    color: '#555',
                    padding: '20px 0',
                    zIndex: 5
                }}>
                    <span>1.338000</span>
                    <span>1.337700</span>
                    <span>1.337400</span>
                    <span>1.337100</span>
                    <span>1.336800</span>
                    <span>1.336500</span>
                    <span>1.336200</span>
                </div>

                {/* Current Price Line */}
                <div style={{
                    position: 'absolute',
                    top: '60%',
                    left: 0,
                    right: '64px',
                    height: '1px',
                    borderTop: '1px dashed #00c087',
                    zIndex: 4
                }}>
                    <div style={{
                        position: 'absolute',
                        right: '-60px',
                        top: '-8px',
                        background: '#00c087',
                        color: '#fff',
                        fontSize: '10px',
                        padding: '2px 4px',
                        borderRadius: '2px'
                    }}>
                        1.336660
                    </div>
                </div>

                {/* Mock Candles & Lines */}
                <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0 }}>
                    {/* MA Lines */}
                    <path d="M0 200 Q100 220 200 150 T400 100" fill="none" stroke="#f0b90b" strokeWidth="1" />
                    <path d="M0 210 Q120 230 220 160 T400 110" fill="none" stroke="#a855f7" strokeWidth="1" />
                    <path d="M0 220 Q140 240 240 170 T400 120" fill="none" stroke="#3b82f6" strokeWidth="1" />

                    {/* Example Candles */}
                    {[...Array(20)].map((_, i) => {
                        const h = 20 + Math.random() * 40;
                        const y = 100 + Math.random() * 100;
                        const isUp = Math.random() > 0.5;
                        return (
                            <g key={i}>
                                <line x1={i * 20 + 10} y1={y - 10} x2={i * 20 + 10} y2={y + h + 10} stroke={isUp ? '#00c087' : '#ff4d4f'} strokeWidth="1" />
                                <rect x={i * 20 + 6} y={y} width="8" height={h} fill={isUp ? '#00c087' : '#ff4d4f'} />
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Volume Info */}
            <div style={{ padding: '10px 16px', fontSize: '11px', display: 'flex', gap: '12px' }}>
                <span style={{ color: '#555' }}>VOL(5,10,20)</span>
                <span style={{ color: '#f0b90b' }}>MA5: 584</span>
                <span style={{ color: '#a855f7' }}>MA10: 578</span>
                <span style={{ color: '#3b82f6' }}>MA20: 565</span>
            </div>
            <div style={{ padding: '0 16px', color: '#00c087', fontSize: '11px' }}>VOLUME: 696</div>

            {/* Volume Subchart */}
            <div style={{ height: '80px', width: '100%', marginBottom: '20px', padding: '0 16px' }}>
                <svg width="100%" height="100%" viewBox="0 0 400 100" preserveAspectRatio="none">
                    {[...Array(30)].map((_, i) => {
                        const h = 20 + Math.random() * 60;
                        return (
                            <rect
                                key={i}
                                x={i * 13}
                                y={100 - h}
                                width="8"
                                height={h}
                                fill={Math.random() > 0.5 ? '#00c087' : '#ff4d4f'}
                                opacity="0.6"
                            />
                        );
                    })}
                    {/* Time axis labels */}
                    <text x="50" y="95" fill="#555" fontSize="10">13:27</text>
                    <text x="200" y="95" fill="#555" fontSize="10">13:39</text>
                    <text x="350" y="95" fill="#555" fontSize="10">13:51</text>
                </svg>
            </div>

            {/* Bottom Trade Buttons */}
            <div style={{
                position: 'fixed',
                bottom: '80px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100%',
                maxWidth: '480px',
                display: 'flex',
                gap: '12px',
                padding: '0 16px',
                zIndex: 100
            }}>
                <button style={{
                    flex: 1,
                    background: '#00c087',
                    color: '#fff',
                    padding: '14px',
                    borderRadius: '4px',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '14px'
                }}>
                    Buy Long
                </button>
                <button style={{
                    flex: 1,
                    background: '#ff6b6b',
                    color: '#fff',
                    padding: '14px',
                    borderRadius: '4px',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '14px'
                }}>
                    Buy Short
                </button>
            </div>
        </motion.div>
    );
};

export default Trade;
