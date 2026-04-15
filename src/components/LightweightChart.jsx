import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { createChart } from 'lightweight-charts';

const LightweightChart = forwardRef(({ symbol, interval, currentRate, activeSignal, onCandlesUpdate }, ref) => {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef(null);
    const candlesDataRef = useRef([]);
    const updateIntervalRef = useRef(null);
    const signalRef = useRef(activeSignal);

    // Always keep signalRef in sync — no chart recreation needed
    useEffect(() => {
        signalRef.current = activeSignal;
    }, [activeSignal]);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        getCandles: () => candlesDataRef.current,
    }));

    const getIntervalSeconds = (iv) => {
        const map = { '1': 60, '5': 300, '15': 900, '30': 1800, '60': 3600, 'D': 86400, 'W': 604800 };
        return map[iv] || 60;
    };

    const generateInitialCandles = (basePrice, count = 60) => {
        const candles = [];
        const intervalSeconds = getIntervalSeconds(interval);
        const now = Math.floor(Date.now() / 1000);
        let price = basePrice;

        for (let i = count; i > 0; i--) {
            const time = now - (i * intervalSeconds);
            const volatility = price * 0.0015;
            const open = price;
            const close = open + (Math.random() - 0.5) * volatility;
            const high = Math.max(open, close) + Math.random() * volatility * 0.4;
            const low = Math.min(open, close) - Math.random() * volatility * 0.4;
            candles.push({
                time,
                open: parseFloat(open.toFixed(6)),
                high: parseFloat(high.toFixed(6)),
                low: parseFloat(low.toFixed(6)),
                close: parseFloat(close.toFixed(6))
            });
            price = close; // Continuous price flow
        }
        return candles;
    };

    // Chart init — only recreate when symbol/interval/currentRate changes
    useEffect(() => {
        const container = chartContainerRef.current;
        if (!container) return;

        // Cleanup previous
        if (updateIntervalRef.current) {
            clearInterval(updateIntervalRef.current);
            updateIntervalRef.current = null;
        }
        if (chartRef.current) {
            chartRef.current.remove();
            chartRef.current = null;
            seriesRef.current = null;
        }

        const chart = createChart(container, {
            width: container.clientWidth,
            height: container.clientHeight || 400,
            layout: {
                background: { type: 'solid', color: '#000000' },
                textColor: '#d1d4dc',
            },
            grid: {
                vertLines: { color: '#0d0d0d' },
                horzLines: { color: '#0d0d0d' },
            },
            crosshair: { mode: 1 },
            rightPriceScale: {
                borderColor: '#1b1b1b',
                textColor: '#888888',
            },
            timeScale: {
                borderColor: '#1b1b1b',
                textColor: '#888888',
                timeVisible: true,
                secondsVisible: false,
            },
            handleScroll: true,
            handleScale: true,
        });

        chartRef.current = chart;

        const series = chart.addCandlestickSeries({
            upColor: '#00c087',
            downColor: '#ff4d4f',
            borderVisible: false,
            wickUpColor: '#00c087',
            wickDownColor: '#ff4d4f',
        });
        seriesRef.current = series;

        const rawPrice = currentRate ? parseFloat(String(currentRate).replace(/,/g, '')) : 73000;
        const basePrice = isNaN(rawPrice) ? 73000 : rawPrice;

        const initialCandles = generateInitialCandles(basePrice);
        candlesDataRef.current = initialCandles;
        series.setData(initialCandles);
        chart.timeScale().fitContent();

        if (onCandlesUpdate) onCandlesUpdate(initialCandles);

        // Tick speed based on timeframe — feels like real market
        // 1m → new candle every 60s, but UI tick every 2s for smooth animation
        // 5m → tick every 5s, 1D → tick every 30s
        const tickIntervalMap = {
            '1': 2000,   // 1 min chart  — tick every 2s (fast movement)
            '5': 5000,   // 5 min chart  — tick every 5s
            '15': 8000,   // 15 min chart — tick every 8s
            '30': 10000,  // 30 min chart — tick every 10s
            '60': 15000,  // 1 hour chart — tick every 15s
            'D': 20000,  // 1 day chart  — tick every 20s (slow steady)
            'W': 30000,  // 1 week chart — tick every 30s (very slow)
        };
        const tickMs = tickIntervalMap[interval] || 3000;

        // ── LIVE UPDATE LOOP ──────────────────────────────────────────────
        updateIntervalRef.current = setInterval(() => {
            if (!seriesRef.current || candlesDataRef.current.length === 0) return;

            const sig = signalRef.current;
            const isSignalActive = sig?.isActive && new Date(sig?.expiresAt) > new Date();

            const lastCandle = candlesDataRef.current[candlesDataRef.current.length - 1];
            const now = Math.floor(Date.now() / 1000);
            const intervalSeconds = getIntervalSeconds(interval);

            // Volatility: signal sets it, else default per timeframe
            const defaultVolMap = {
                '1': 0.0006, '5': 0.0008, '15': 0.0010,
                '30': 0.0012, '60': 0.0015, 'D': 0.0020, 'W': 0.0025
            };
            const signalVolMap = { low: 0.0004, medium: 0.0010, high: 0.0020 };
            const baseVol = isSignalActive
                ? (signalVolMap[sig.volatility] || 0.0010)
                : (defaultVolMap[interval] || 0.0008);

            const lastPrice = lastCandle.close;
            const moveAmount = lastPrice * baseVol;

            let newClose;
            if (isSignalActive) {
                // Admin-forced direction: 80% bias
                const upBias = sig.direction === 'UP' ? 0.80 : 0.20;
                const isUp = Math.random() < upBias;
                newClose = isUp
                    ? lastPrice + moveAmount * (0.5 + Math.random() * 0.5)
                    : lastPrice - moveAmount * (0.1 + Math.random() * 0.4);
            } else {
                // Natural random walk with slight mean reversion
                newClose = lastPrice + (Math.random() - 0.5) * moveAmount;
            }

            const wickSize = moveAmount * (0.1 + Math.random() * 0.3);
            const newHigh = Math.max(lastPrice, newClose) + wickSize;
            const newLow = Math.min(lastPrice, newClose) - wickSize;

            if (now - lastCandle.time >= intervalSeconds) {
                // New candle — price continues from last close
                const newCandle = {
                    time: now,
                    open: parseFloat(lastPrice.toFixed(6)),
                    high: parseFloat(newHigh.toFixed(6)),
                    low: parseFloat(newLow.toFixed(6)),
                    close: parseFloat(newClose.toFixed(6)),
                };
                candlesDataRef.current.push(newCandle);
                if (candlesDataRef.current.length > 150) candlesDataRef.current.shift();
                seriesRef.current.setData(candlesDataRef.current);
                if (onCandlesUpdate) onCandlesUpdate(candlesDataRef.current);
            } else {
                // Update current candle in-place — smooth wick/body extension
                const updated = {
                    ...lastCandle,
                    high: parseFloat(Math.max(lastCandle.high, newHigh).toFixed(6)),
                    low: parseFloat(Math.min(lastCandle.low, newLow).toFixed(6)),
                    close: parseFloat(newClose.toFixed(6)),
                };
                candlesDataRef.current[candlesDataRef.current.length - 1] = updated;
                seriesRef.current.update(updated);
                if (onCandlesUpdate) onCandlesUpdate(candlesDataRef.current);
            }
        }, tickMs);

        // Resize handler
        const handleResize = () => {
            if (container && chartRef.current) {
                chartRef.current.applyOptions({
                    width: container.clientWidth,
                    height: container.clientHeight || 400,
                });
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (updateIntervalRef.current) {
                clearInterval(updateIntervalRef.current);
                updateIntervalRef.current = null;
            }
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
                seriesRef.current = null;
            }
        };
    }, [symbol, interval, currentRate]);

    return (
        <div
            ref={chartContainerRef}
            style={{ width: '100%', height: '100%', minHeight: '300px', position: 'relative' }}
        />
    );
});

LightweightChart.displayName = 'LightweightChart';
export default LightweightChart;
