import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';

const Coin = () => {
    const [activeType, setActiveType] = useState('Buy');
    const [activePositionTab, setActivePositionTab] = useState('My position');

    const buyOrders = [
        { price: '70773.44', qty: '0.322', width: '60%' },
        { price: '70773.34', qty: '0.360', width: '70%' },
        { price: '70773.24', qty: '0.375', width: '75%' },
        { price: '70773.14', qty: '0.221', width: '40%' },
        { price: '70773.04', qty: '0.445', width: '90%' },
        { price: '70772.94', qty: '0.228', width: '45%' },
    ];

    const sellOrders = [
        { price: '70773.54', qty: '0.363', width: '72%' },
        { price: '70773.64', qty: '0.318', width: '63%' },
        { price: '70773.74', qty: '0.285', width: '55%' },
        { price: '70773.84', qty: '0.184', width: '35%' },
        { price: '70773.94', qty: '0.306', width: '60%' },
        { price: '70774.04', qty: '0.452', width: '90%' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="app-container"
            style={{ padding: '0 0 100px 0', minHeight: '100vh', background: '#222325', color: '#fff', fontFamily: 'Inter, sans-serif' }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '18px', fontWeight: '700' }}>
                    BTC <ChevronDown size={20} />
                </div>
                <SlidersHorizontal size={20} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '15px', padding: '0 12px' }}>
                {/* Left Side: Order Controls */}
                <div>
                    <div style={{ display: 'flex', background: '#333', borderRadius: '4px', padding: '2px', marginBottom: '16px' }}>
                        <button
                            onClick={() => setActiveType('Buy')}
                            style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '4px', background: activeType === 'Buy' ? '#00c087' : 'transparent', color: '#fff', fontWeight: '700', fontSize: '14px' }}
                        >
                            Buy
                        </button>
                        <button
                            onClick={() => setActiveType('Sell')}
                            style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '4px', background: activeType === 'Sell' ? '#fff' : 'transparent', color: activeType === 'Sell' ? '#000' : '#888', fontWeight: '700', fontSize: '14px' }}
                        >
                            Sell
                        </button>
                    </div>

                    <div style={{ position: 'relative', marginBottom: '12px' }}>
                        <div style={{ background: 'transparent', border: '1px solid #444', borderRadius: '4px', padding: '10px', fontSize: '14px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Market Order... <ChevronDown size={16} color="#888" />
                        </div>
                    </div>

                    <div style={{ background: 'transparent', border: '1px solid #444', borderRadius: '4px', padding: '10px', fontSize: '14px', color: '#fff', marginBottom: '16px' }}>
                        Market Price
                    </div>

                    <div style={{ fontSize: '14px', marginBottom: '8px' }}>Amount</div>
                    <div style={{ position: 'relative', marginBottom: '16px' }}>
                        <div style={{ background: 'transparent', border: '1px solid #444', borderRadius: '4px', padding: '10px', fontSize: '14px', color: '#fff', textAlign: 'right', paddingRight: '50px' }}>
                            <span style={{ position: 'absolute', right: '10px', color: '#fff', fontWeight: '600' }}>USDT</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
                        {[25, 50, 75, 100].map(pct => (
                            <div key={pct} style={{ flex: 1, textAlign: 'center' }}>
                                <div style={{ height: '4px', background: '#444', marginBottom: '4px', borderRadius: '2px' }}></div>
                                <div style={{ fontSize: '10px', color: '#ccc' }}>{pct}%</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888', marginBottom: '12px' }}>
                        <span>Available Balance</span>
                        <span style={{ color: '#fff' }}>0.000000</span>
                    </div>

                    <button style={{ width: '100%', background: '#00c087', color: '#fff', padding: '12px', border: 'none', borderRadius: '4px', fontWeight: '700', fontSize: '16px' }}>
                        Buy
                    </button>
                </div>

                {/* Right Side: Order Book */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                        <span>Price</span>
                        <span>Quantity</span>
                    </div>

                    {/* Buy Orders (Green) */}
                    <div style={{ marginBottom: '8px' }}>
                        {buyOrders.map((order, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', height: '22px', alignItems: 'center', position: 'relative' }}>
                                <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: order.width, background: 'rgba(0, 192, 135, 0.15)', zIndex: 0 }}></div>
                                <span style={{ color: '#00c087', zIndex: 1 }}>{order.price}</span>
                                <span style={{ color: '#00c087', zIndex: 1 }}>{order.qty}</span>
                            </div>
                        ))}
                    </div>

                    {/* Middle Price */}
                    <div style={{ padding: '8px 0', textAlign: 'left' }}>
                        <div style={{ color: '#ff4d4f', fontSize: '18px', fontWeight: '700' }}>70773.44</div>
                        <div style={{ color: '#ff4d4f', fontSize: '10px' }}>-0.0033642564%</div>
                    </div>

                    {/* Sell Orders (Red) */}
                    <div>
                        {sellOrders.map((order, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', height: '22px', alignItems: 'center', position: 'relative' }}>
                                <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: order.width, background: 'rgba(255, 77, 79, 0.15)', zIndex: 0 }}></div>
                                <span style={{ color: '#ff4d4f', zIndex: 1 }}>{order.price}</span>
                                <span style={{ color: '#ff4d4f', zIndex: 1 }}>{order.qty}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '30px', borderTop: '1px solid #333' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--accent-gold)', marginBottom: '20px' }}>
                    {['My position', 'My closed position'].map(tab => (
                        <div
                            key={tab}
                            onClick={() => setActivePositionTab(tab)}
                            style={{
                                padding: '10px 15px',
                                fontSize: '14px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                background: activePositionTab === tab ? 'var(--accent-gold)' : 'transparent',
                                color: activePositionTab === tab ? '#000' : '#888'
                            }}
                        >
                            {tab}
                        </div>
                    ))}
                </div>
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#555', fontSize: '14px' }}>
                    No more data
                </div>
            </div>
        </motion.div>
    );
};

export default Coin;
