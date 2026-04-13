import React, { useEffect, useState, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';

const RealTimeChart = forwardRef(({ symbol, interval, currentRate, initialCandles }, ref) => {
    const [candles, setCandles] = useState([]);
    const containerRef = useRef(null);
    const lastPriceRef = useRef(null);
    const isInitializedRef = useRef(false);

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
        lastPriceRef.current = basePrice;
    }, [basePrice]);

    useEffect(() => {
        // If initialCandles provided (coming from signal end), use them
        if (initialCandles && initialCandles.length > 0 && !isInitializedRef.current) {
            setCandles(initialCandles);
            isInitializedRef.current = true;
            return;
        }

        // Only generate new candles if not already initialized
        if (isInitializedRef.current) return;

        // Generate initial 28 candles based on current price
        const now = Date.now();
        const displayCount = 28;

        const patterns = [
            -0.0008, 0.0015, -0.0012, 0.0020, -0.0010,
            0.0025, -0.0015, 0.0018, -0.0022, 0.0012,
            0.0030, -0.0018, 0.0014, -0.0025, 0.0020,
            -0.0010, 0.0028, -0.0035, 0.0016, 0.0010,
            0.0032, -0.0020, 0.0012, 0.0025, -0.0008,
            0.0015, -0.0005, 0.0000
        ];

        let historyCandles = [];
        let trailPrice = basePrice;

        for (let i = displayCount - 1; i >= 0; i--) {
            const relMove = patterns[i] * basePrice;
            const close = trailPrice;
            const open = close - relMove;
            const bodySize = Math.abs(close - open);
            const wickMultiplier = 0.3 + Math.random() * 0.4;

            historyCandles.unshift({
                id: `real-${i}-${Date.now()}`,
                open,
                high: Math.max(open, close) + (bodySize * wickMultiplier),
                low: Math.min(open, close) - (bodySize * wickMultiplier),
                close,
                timestamp: now - (displayCount - i) * 2000
            });

            trailPrice = open;
        }

        setCandles(historyCandles);
        isInitializedRef.current = true;
    }, [basePrice, initialCandles]);

    useEffect(() => {
        if (!isInitializedRef.current) return;

        // Real-time candle updates (simulating market movement)
        const interval = setInterval(() => {
            setCandles(prev => {
                if (prev.length === 0) return [];
                const last = prev[prev.length - 1];

                // Random market movement (50/50 up/down)
                const isUp = Math.random() > 0.5;
                const open = last.close;
                const changePercent = (Math.random() * 0.0010 + 0.0005);
                const change = changePercent * basePrice;
                const close = isUp ? open + change : open - change;
                const bodySize = Math.abs(close - open);
                const wickMultiplier = 0.3 + Math.random() * 0.5;

                const newCandle = {
                    id: `real-${Date.now()}`,
                    open,
                    close,
                    high: Math.max(open, close) + (bodySize * wickMultiplier),
                    low: Math.min(open, close) - (bodySize * wickMultiplier),
                    timestamp: Date.now()
                };

                lastPriceRef.current = close;
                return [...prev.slice(1), newCandle];
            });
        }, 2000);

        return () => clearInterval(interval);
    }, [basePrice, isInitializedRef.current]);

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
            {/* Grid Background */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'linear-gradient(rgba(42,46,57,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(42,46,57,0.4) 1px, transparent 1px)',
                backgroundSize: '50px 50px'
            }} />

            {/* Symbol Label */}
            <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                zIndex: 10,
                padding: '6px 12px',
                backgroundColor: 'rgba(19,23,34,0.8)',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#787b86',
                backdropFilter: 'blur(5px)'
            }}>
                {symbol || 'CHART'}
            </div>

            {/* Price Scale (Right Side) */}
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
                            fontWeight: '400'
                        }}>
                            {price.toLocaleString(undefined, {
                                minimumFractionDigits: price > 1000 ? 0 : 2,
                                maximumFractionDigits: price > 1000 ? 0 : 2
                            })}
                        </div>
                    );
                })}
            </div>

            {/* Candles SVG */}
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

                {/* Current Price Line */}
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
                        >
                            {candles[candles.length-1].close.toLocaleString(undefined, {
                                minimumFractionDigits: basePrice > 1000 ? 0 : 2,
                                maximumFractionDigits: basePrice > 1000 ? 0 : 2
                            })}
                        </text>
                    </g>
                )}
            </svg>
        </div>
    );
});

RealTimeChart.displayName = 'RealTimeChart';

export default RealTimeChart;
