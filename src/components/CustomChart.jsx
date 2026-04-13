import React, { useEffect, useState, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';

const timeFrameVolatility = {
    '1': 0.0008,
    '5': 0.0015,
    '15': 0.0030,
    '30': 0.0050,
    '60': 0.0080,
    'D': 0.0250,
    'W': 0.0600
};

const CustomChart = forwardRef(({ activeSignal, currentRate, capturedCandles, interval: timeframe }, ref) => {
    const [candles, setCandles] = useState([]);
    const containerRef = useRef(null);
    const signalRef = useRef(activeSignal);
    const lastIntervalRef = useRef(timeframe);

    // Expose getCandles method to parent
    useImperativeHandle(ref, () => ({
        getCandles: () => candles
    }));

    const basePrice = useMemo(() => {
        if (!currentRate) return 73000;
        const parsed = parseFloat(currentRate.replace(/,/g, ''));
        return isNaN(parsed) ? 73000 : parsed;
    }, [currentRate]);

    useEffect(() => {
        signalRef.current = activeSignal;
    }, [activeSignal]);

    useEffect(() => {
        // Redraw if interval changed
        if (lastIntervalRef.current !== timeframe) {
            setCandles([]);
            lastIntervalRef.current = timeframe;
        }

        // Use captured candles if available AND it's not a timeframe change
        if (capturedCandles && capturedCandles.length > 0 && candles.length === 0 && lastIntervalRef.current === timeframe) {
            setCandles(capturedCandles);
        } else if (candles.length === 0) {
            const now = Date.now();
            const displayCount = 28;
            
            const intervalMap = {
                '1': 60,
                '5': 300,
                '15': 900,
                '30': 1800,
                '60': 3600,
                'D': 86400,
                'W': 604800
            };
            const stepSeconds = intervalMap[timeframe] || 60;
            const baseVol = timeFrameVolatility[timeframe] || 0.0008;

            let historyCandles = [];
            let trailPrice = basePrice;

            const timeSeed = stepSeconds;

            for (let i = displayCount - 1; i >= 0; i--) {
                const rawMove = Math.sin(i * timeSeed * 0.1) * 0.6 + Math.cos(i * timeSeed * 0.3) * 0.4;
                const relMove = rawMove * baseVol * basePrice;
                const close = trailPrice;
                const open = close - relMove;
                const bodySize = Math.abs(close - open);
                const wickMultiplier = 0.3 + (Math.abs(Math.sin(i * timeSeed)) * 0.7);
                const high = Math.max(open, close) + (bodySize * wickMultiplier);
                const low = Math.min(open, close) - (bodySize * wickMultiplier);

                historyCandles.unshift({
                    id: `h-${i}-${stepSeconds}-${Date.now()}`,
                    open,
                    high,
                    low,
                    close,
                    timestamp: now - (displayCount - i) * stepSeconds * 1000
                });

                trailPrice = open;
            }

            setCandles(historyCandles);
        }

        // Get candle speed and volatility from signal
        const candleInterval = (activeSignal?.candleSpeed || 2) * 1000; // Convert to milliseconds
        const volatilityLevel = activeSignal?.volatility || 'medium';

        // Volatility multipliers
        const volatilityMap = {
            low: 0.0004,      // Small candles
            medium: 0.0010,   // Medium candles
            high: 0.0020      // Large candles
        };

        const baseVolatility = volatilityMap[volatilityLevel] || volatilityMap.medium;

        const intervalId = setInterval(() => {
            setCandles(prev => {
                if (prev.length === 0) return [];
                const last = prev[prev.length - 1];
                const curSignal = signalRef.current;

                const bias = curSignal?.direction === 'UP' ? 0.75 :
                             curSignal?.direction === 'DOWN' ? 0.25 : 0.5;

                const isUp = Math.random() < bias;
                const open = last.close;
                const tfBaseVol = timeFrameVolatility[timeframe] || 0.0008;
                const changePercent = (Math.random() * tfBaseVol * 1.5 + tfBaseVol * 0.5);
                const change = changePercent * basePrice;
                const close = isUp ? open + change : open - change;
                const bodySize = Math.abs(close - open);
                const wickMultiplier = 0.3 + Math.random() * 0.5;

                const newCandle = {
                    id: `l-${Date.now()}`,
                    open,
                    close,
                    high: Math.max(open, close) + (bodySize * wickMultiplier),
                    low: Math.min(open, close) - (bodySize * wickMultiplier),
                    timestamp: Date.now()
                };

                return [...prev.slice(1), newCandle];
            });
        }, candleInterval);

        return () => clearInterval(intervalId);
    }, [basePrice, capturedCandles, activeSignal?.candleSpeed, activeSignal?.volatility, timeframe]);

    const scale = useMemo(() => {
        if (candles.length === 0) return { min: 0, max: 100, range: 100 };
        const highs = candles.map(c => c.high);
        const lows = candles.map(c => c.low);
        const actualMin = Math.min(...lows);
        const actualMax = Math.max(...highs);
        const buffer = (actualMax - actualMin) * 0.15;
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
        const w = containerRef.current.clientWidth - 70;
        const spacing = w / (candles.length + 1);
        return spacing * (index + 1);
    };

    const candleWidth = useMemo(() => {
        if (!containerRef.current || candles.length === 0) return 8;
        const w = containerRef.current.clientWidth - 70;
        const spacing = w / (candles.length + 1);
        return Math.max(6, Math.min(spacing * 0.6, 14));
    }, [containerRef.current?.clientWidth, candles.length]);

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#131722',
                overflow: 'hidden',
                position: 'relative',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Arial, sans-serif'
            }}
        >
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'linear-gradient(rgba(42,46,57,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(42,46,57,0.4) 1px, transparent 1px)',
                backgroundSize: '50px 50px'
            }} />

            <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <div
                    style={{
                        padding: '6px 14px',
                        backgroundColor: '#f0b90b',
                        color: '#000',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        letterSpacing: '0.5px',
                        boxShadow: '0 2px 8px rgba(240,185,11,0.4)'
                    }}
                >
                    SIGNAL ACTIVE
                </div>
                <div
                    style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#00c087',
                        animation: 'pulse 2s infinite'
                    }}
                />
            </div>

            <div style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '70px',
                borderLeft: '1px solid #2a2e39',
                zIndex: 5,
                backgroundColor: '#131722',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                paddingTop: '10px',
                paddingBottom: '10px'
            }}>
                {[...Array(8)].map((_, i) => {
                    const price = scale.max - (i * scale.range / 7);
                    return (
                        <div key={i} style={{
                            paddingRight: '8px',
                            textAlign: 'right',
                            fontSize: '10px',
                            color: '#787b86',
                            fontWeight: '400',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Trebuchet MS", Arial, sans-serif'
                        }}>
                            {price.toLocaleString(undefined, {
                                minimumFractionDigits: price > 1000 ? 0 : 2,
                                maximumFractionDigits: price > 1000 ? 0 : 2
                            })}
                        </div>
                    );
                })}
            </div>

            <svg style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 2 }}>
                {candles.map((c, i) => {
                    const isUp = c.close >= c.open;
                    const color = isUp ? '#26a69a' : '#ef5350';
                    const x = getX(i);
                    const yOpen = getY(c.open);
                    const yClose = getY(c.close);
                    const yHigh = getY(c.high);
                    const yLow = getY(c.low);

                    return (
                        <g key={c.id}>
                            <line
                                x1={x}
                                y1={yHigh}
                                x2={x}
                                y2={yLow}
                                stroke={color}
                                strokeWidth="1"
                            />
                            <rect
                                x={x - candleWidth/2}
                                y={Math.min(yOpen, yClose)}
                                width={candleWidth}
                                height={Math.max(1, Math.abs(yOpen - yClose))}
                                fill={color}
                            />
                        </g>
                    );
                })}

                {candles.length > 0 && (
                    <g>
                        <line
                            x1="0"
                            y1={getY(candles[candles.length-1].close)}
                            x2={containerRef.current?.clientWidth - 70}
                            y2={getY(candles[candles.length-1].close)}
                            stroke="#2962ff"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                        />
                        <rect
                            x={containerRef.current?.clientWidth - 70}
                            y={getY(candles[candles.length-1].close) - 10}
                            width="70"
                            height="20"
                            fill="#2962ff"
                        />
                        <text
                            x={(containerRef.current?.clientWidth || 0) - 35}
                            y={getY(candles[candles.length-1].close) + 4}
                            fill="#fff"
                            fontSize="11"
                            fontWeight="600"
                            textAnchor="middle"
                            fontFamily="-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Arial, sans-serif"
                        >
                            {candles[candles.length-1].close.toLocaleString(undefined, {
                                minimumFractionDigits: basePrice > 1000 ? 0 : 2,
                                maximumFractionDigits: basePrice > 1000 ? 0 : 2
                            })}
                        </text>
                    </g>
                )}
            </svg>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
            `}</style>
        </div>
    );
});

CustomChart.displayName = 'CustomChart';

export default CustomChart;
