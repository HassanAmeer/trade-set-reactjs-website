import React, { useEffect, useState, useRef, useMemo } from 'react';

const CustomChart = ({ activeSignal, currentRate }) => {
    const [candles, setCandles] = useState([]);
    const containerRef = useRef(null);
    const signalRef = useRef(activeSignal);

    // Precise parsing of the current market rate
    const basePrice = useMemo(() => {
        if (!currentRate) return 73000;
        const parsed = parseFloat(currentRate.replace(/,/g, ''));
        return isNaN(parsed) ? 73000 : parsed;
    }, [currentRate]);

    useEffect(() => {
        signalRef.current = activeSignal;
    }, [activeSignal]);

    useEffect(() => {
        const now = Date.now();
        const displayCount = 28; // Focus on exactly 28 visible bars
        
        // DYNAMIC PATTERN: Mimicking the variety in the user's screenshot
        // Larger values for more "visible" and professional looking candles
        const fixedPattern = [
            0.0015, -0.0008, 0.0025, -0.0040, 0.0012, 
            0.0035, -0.0015, 0.0020, -0.0010, 0.0008,
            0.0045, -0.0022, 0.0018, -0.0030, 0.0025,
            -0.0012, 0.0030, -0.0045, 0.0020, 0.0010,
            0.0055, -0.0025, 0.0015, 0.0035, -0.0010,
            0.0020, -0.0005, 0.0000 // Ends exactly at current price
        ];

        let historyCandles = [];
        let trailPrice = basePrice;
        
        // Generate history working backwards from live price
        for (let i = displayCount - 1; i >= 0; i--) {
            const relMove = fixedPattern[i] * basePrice;
            const close = trailPrice;
            const open = close - relMove;
            // Wicks proportional to body but varied
            const high = Math.max(open, close) + (Math.random() * 0.0008 * basePrice);
            const low = Math.min(open, close) - (Math.random() * 0.0008 * basePrice);
            
            historyCandles.unshift({
                id: `h-${i}-${Date.now()}`,
                open,
                high,
                low,
                close,
                timestamp: now - (displayCount - i) * 2000
            });
            
            trailPrice = open;
        }

        setCandles(historyCandles);

        const interval = setInterval(() => {
            setCandles(prev => {
                if (prev.length === 0) return [];
                const last = prev[prev.length - 1];
                const curSignal = signalRef.current;
                
                // Bias for live candles
                const bias = curSignal?.direction === 'UP' ? 0.82 : 
                             curSignal?.direction === 'DOWN' ? 0.18 : 0.5;
                
                const isUp = Math.random() < bias;
                const open = last.close;
                // Significant move size to prevent "small" candles
                const change = (Math.random() * 0.0015 + 0.0005) * basePrice;
                const close = isUp ? open + change : open - change;
                
                const newCandle = {
                    id: `l-${Date.now()}`,
                    open,
                    close,
                    high: Math.max(open, close) + (Math.random() * 0.0005 * basePrice),
                    low: Math.min(open, close) - (Math.random() * 0.0005 * basePrice),
                    timestamp: Date.now()
                };
                
                return [...prev.slice(1), newCandle];
            });
        }, 2000);

        return () => clearInterval(interval);
    }, [basePrice]); 

    // CALCULATE SCALE: Mimic TradingView's auto-scale (buffer top and bottom)
    const scale = useMemo(() => {
        if (candles.length === 0) return { min: 0, max: 100, range: 100 };
        const highs = candles.map(c => c.high);
        const lows = candles.map(c => c.low);
        const actualMin = Math.min(...lows);
        const actualMax = Math.max(...highs);
        const buffer = (actualMax - actualMin) * 0.35; // 35% buffer for visual breathing
        const min = actualMin - buffer;
        const max = actualMax + buffer;
        return { min, max, range: max - min };
    }, [candles]);

    const getY = (price) => {
        if (!containerRef.current) return 0;
        const h = containerRef.current.clientHeight;
        return h - ((price - scale.min) / scale.range) * h;
    };

    const getX = (index) => {
        if (!containerRef.current) return 0;
        const w = containerRef.current.clientWidth - 95;
        // Spacing for 28 bars
        return (index / 28) * w + 10;
    };

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', backgroundColor: '#0c0d10', overflow: 'hidden', position: 'relative', fontFamily: 'Inter, sans-serif' }}>
            {/* Pronounced Grid Lines */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(30,31,36,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(30,31,36,0.5) 1px, transparent 1px)', backgroundSize: '60px 45px' }} />

            {/* Signal Badge */}
            <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ padding: '4px 12px', backgroundColor: '#f0b90b', color: '#000', borderRadius: '4px', fontSize: '10px', fontWeight: '900', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                    SIGNAL LIVE
                </div>
            </div>

            {/* Price Sidebar - Professional Layout */}
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '90px', borderLeft: '1px solid #1e1f24', zIndex: 5, backgroundColor: '#0c0d10', display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                {[...Array(10)].map((_, i) => {
                    const price = scale.max - (i * scale.range / 9);
                    return (
                        <div key={i} style={{ paddingRight: '10px', textAlign: 'right', fontSize: '11px', color: '#63666e', fontWeight: '500' }}>
                            {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    );
                })}
            </div>

            <svg style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 2 }}>
                {candles.map((c, i) => {
                    const isUp = c.close >= c.open;
                    const color = isUp ? '#00c087' : '#ff4d4f';
                    const x = getX(i);
                    const yOpen = getY(c.open);
                    const yClose = getY(c.close);
                    const yHigh = getY(c.high);
                    const yLow = getY(c.low);
                    // Bolder candles (matched to Screenshot 1)
                    const candleWidth = Math.max(12, (getX(1) - getX(0)) * 0.72);

                    return (
                        <g key={c.id}>
                            <line x1={x + candleWidth/2} y1={yHigh} x2={x + candleWidth/2} y2={yLow} stroke={color} strokeWidth="1.5" />
                            <rect x={x} y={Math.min(yOpen, yClose)} width={candleWidth} height={Math.max(1, Math.abs(yOpen - yClose))} fill={color} />
                        </g>
                    );
                })}
                
                {/* Live Price Marker */}
                {candles.length > 0 && (
                    <g>
                        <line x1="0" y1={getY(candles[candles.length-1].close)} x2="calc(100% - 90px)" y2={getY(candles[candles.length-1].close)} stroke="#00c08744" strokeWidth="1" strokeDasharray="4 2" />
                        <rect x="calc(100% - 90px)" y={getY(candles[candles.length-1].close) - 13} width="90" height="26" fill="#00c087" />
                        <text x="calc(100% - 45px)" y={getY(candles[candles.length-1].close) + 5} fill="#fff" fontSize="13" fontWeight="900" textAnchor="middle">
                            {candles[candles.length-1].close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </text>
                    </g>
                )}
            </svg>
        </div>
    );
};

export default CustomChart;
