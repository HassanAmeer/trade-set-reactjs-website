import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { createChart } from 'lightweight-charts';

const LightweightChart = forwardRef(({ symbol, interval, currentRate, activeSignal, user, isTrading, tradeDirection, intendedOutcome, onCandlesUpdate }, ref) => {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef(null);
    const candlesDataRef = useRef([]);
    const updateIntervalRef = useRef(null);
    const signalRef = useRef(activeSignal);
    
    // Persistent signal state to ensure smooth wave generation
    const signalStateRef = useRef({
        isActive: false,
        tradeStarted: false,
        startPrice: null,
        startTime: null,
        targetPrice: null
    });
    useEffect(() => {
        signalRef.current = activeSignal;

        const sig = activeSignal;
        // Signal visually activates ONLY when user is actively trading
        const isCurrentlyActive = sig?.isActive && 
                                 new Date(sig?.expiresAt) > new Date() && 
                                 sig.affectedUsersMap?.[user?.id] &&
                                 isTrading;

        // Reset or initialize signal state when trade begins
        if (isCurrentlyActive && (!signalStateRef.current.isActive || !signalStateRef.current.tradeStarted)) {
            const lastCandle = candlesDataRef.current[candlesDataRef.current.length - 1];
            const startPrice = lastCandle ? lastCandle.close : (currentRate ? parseFloat(String(currentRate).replace(/,/g, '')) : 73000);
            
            const userConfig = sig.affectedUsersMap?.[user?.id];
            // Deterministic visual move: If win move in direction, if loss move against direction
            const isWin = intendedOutcome === 'win';
            const moveInDirection = (tradeDirection === 'BUY') ? (isWin ? 1 : -1) : (isWin ? -1 : 1);
            
            const targetMoveRatio = ((userConfig?.payoutRate || sig.payoutRate || 80) / 40) / 100; 
            const targetPrice = startPrice * (1 + (targetMoveRatio * moveInDirection));

            signalStateRef.current = {
                isActive: true,
                tradeStarted: true,
                startPrice,
                startTime: Date.now(),
                endTime: Date.now() + 10000, // 10s window (matches Trade.jsx wait)
                targetPrice
            };
        } else if (!isCurrentlyActive) {
            signalStateRef.current.isActive = false;
            signalStateRef.current.tradeStarted = false;
        }
    }, [activeSignal, symbol, user?.id, isTrading, tradeDirection, intendedOutcome]);

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
            price = close;
        }
        return candles;
    };

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

        const tickIntervalMap = { '1': 2000, '5': 5000, '15': 8000, '30': 10000, '60': 15000, 'D': 20000, 'W': 30000 };
        const tickMs = tickIntervalMap[interval] || 3000;

        updateIntervalRef.current = setInterval(() => {
            if (!seriesRef.current || candlesDataRef.current.length === 0) return;

            const sigState = signalStateRef.current;
            const lastCandle = candlesDataRef.current[candlesDataRef.current.length - 1];
            const nowMs = Date.now();
            const nowSec = Math.floor(nowMs / 1000);
            const intervalSeconds = getIntervalSeconds(interval);

            const lastPrice = lastCandle.close;
            let newClose;

            if (sigState.isActive) {
                // ADVANCED ZIGZAG SIGNAL LOGIC
                const totalDuration = sigState.endTime - sigState.startTime;
                const elapsed = nowMs - sigState.startTime;

                // Progress from 0 to 1
                let progress = Math.min(Math.max(elapsed / totalDuration, 0), 1);

                // Target trend line: Start -> Target
                const trendPrice = sigState.startPrice + (sigState.targetPrice - sigState.startPrice) * progress;

                // Zigzag noise: Create 3 waves using sine
                const waveCount = 3;
                const waveAmplitude = (sigState.targetPrice - sigState.startPrice) * 0.08; // Reduced deviation for realism
                const zigzagOffset = Math.sin(progress * Math.PI * 2 * waveCount) * waveAmplitude;
                
                // Smoothed actual target price at this moment
                const targetNow = trendPrice + zigzagOffset;
                
                // Move towards 'targetNow' with much slower speed for smooth candles
                const moveSpeed = 0.05; 
                const jitter = (Math.random() - 0.5) * (lastPrice * 0.00015);
                newClose = lastPrice + (targetNow - lastPrice) * moveSpeed + jitter;
            } else {
                // Natural market behavior: Follow the real-world currentRate smoothly
                const realPrice = currentRate ? parseFloat(String(currentRate).replace(/,/g, '')) : lastPrice;
                
                // If we are far from real price, move towards it (followSpeed)
                // If we are close, just do natural jitter
                const followSpeed = 0.15; 
                const diff = realPrice - lastPrice;
                const drift = isNaN(diff) ? 0 : diff * followSpeed;
                
                const volatility = lastPrice * (0.0003 + Math.random() * 0.0002);
                newClose = lastPrice + drift + (Math.random() - 0.5) * volatility;
            }

            const moveSize = Math.abs(newClose - lastPrice);
            const wickSize = moveSize * (0.5 + Math.random() * 1.5);
            const newHigh = Math.max(lastPrice, newClose) + wickSize;
            const newLow = Math.min(lastPrice, newClose) - wickSize;

            if (nowSec - lastCandle.time >= intervalSeconds) {
                const newCandle = {
                    time: nowSec,
                    open: parseFloat(lastPrice.toFixed(6)),
                    high: parseFloat(newHigh.toFixed(6)),
                    low: parseFloat(newLow.toFixed(6)),
                    close: parseFloat(newClose.toFixed(6)),
                };
                candlesDataRef.current.push(newCandle);
                if (candlesDataRef.current.length > 500) candlesDataRef.current.shift();
                seriesRef.current.setData(candlesDataRef.current);
                if (onCandlesUpdate) onCandlesUpdate(candlesDataRef.current);
            } else {
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

        const handleResize = () => {
            if (container && chartRef.current) {
                chartRef.current.applyOptions({ width: container.clientWidth, height: container.clientHeight || 400 });
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
                seriesRef.current = null;
            }
        };
    }, [symbol, interval]);

    return (
        <div
            ref={chartContainerRef}
            style={{ width: '100%', height: '100%', minHeight: '300px', position: 'relative' }}
        />
    );
});

LightweightChart.displayName = 'LightweightChart';
export default LightweightChart;
