import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { createChart } from 'lightweight-charts';

const LightweightChart = forwardRef(({ symbol, interval, currentRate, activeSignal, user, isTrading, tradeDirection, intendedOutcome, tradeDuration, onCandlesUpdate, useCustomPrice }, ref) => {
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

    // Live market & post-manipulation recovery state
    const isRecoveringRef = useRef(false);
    const latestRealPriceRef = useRef(null);
    const latestRealCandleRef = useRef(null);
    const socketRef = useRef(null);

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

    // Helper to safely extract millis from Firestore Timestamp or ISO string
    const toMillis = (val) => {
        if (!val) return 0;
        if (typeof val === 'object' && val.toMillis) return val.toMillis();
        const d = new Date(val);
        return d.getTime() || 0;
    };

    // Signal activation effect — fires when trade starts or signal changes
    useEffect(() => {
        const sig = activeSignal;
        const now = Date.now();
        const isSignalActiveOnChart = !!(sig?.isActive &&
            toMillis(sig?.startTime || sig?.updatedAt) <= now &&
            toMillis(sig?.expiresAt) > now &&
            sig.symbol === symbol);

        if (isSignalActiveOnChart) {
            const startTime = toMillis(sig.startTime || sig.updatedAt);
            const endTime = toMillis(sig.expiresAt);
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
                const payoutRate = userConfig ? Math.abs(parseInt(userConfig.winLossPercentage, 10)) : 100;
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

    const fetchBinanceHistory = async (sym, iv) => {
        const intervalMap = { '1': '1m', '5': '5m', '15': '15m', '30': '30m', '60': '1h', 'D': '1d', 'W': '1w' };
        const binanceInterval = intervalMap[iv] || '1m';
        const binanceSymbol = sym.replace('/', '').toUpperCase();
        
        try {
            console.log(`[Chart] Fetching Binance history for ${binanceSymbol} (${binanceInterval})...`);
            const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${binanceInterval}&limit=100`);
            if (!response.ok) throw new Error(`Binance HTTP error: ${response.status}`);
            const data = await response.json();
            return data.map(item => ({
                time: Math.floor(item[0] / 1000),
                open: parseFloat(item[1]),
                high: parseFloat(item[2]),
                low: parseFloat(item[3]),
                close: parseFloat(item[4])
            }));
        } catch (e) {
            console.error('[Chart] Error fetching Binance history:', e);
            return null;
        }
    };

    const startWebSocket = (sym, iv) => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }

        const intervalMap = { '1': '1m', '5': '5m', '15': '15m', '30': '30m', '60': '1h', 'D': '1d', 'W': '1w' };
        const binanceInterval = intervalMap[iv] || '1m';
        const binanceSymbol = sym.replace('/', '').toLowerCase();
        
        const wsUrl = `wss://stream.binance.com:9443/ws/${binanceSymbol}@kline_${binanceInterval}`;
        
        try {
            console.log(`[Chart] Connecting WebSocket for ${binanceSymbol} (${binanceInterval})...`);
            const socket = new WebSocket(wsUrl);
            socketRef.current = socket;
            
            socket.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.e === 'kline') {
                        const k = msg.k;
                        const wsCandle = {
                            time: Math.floor(k.t / 1000),
                            open: parseFloat(k.o),
                            high: parseFloat(k.h),
                            low: parseFloat(k.l),
                            close: parseFloat(k.c)
                        };
                        
                        latestRealPriceRef.current = wsCandle.close;
                        latestRealCandleRef.current = wsCandle;
                        
                        // If signal is NOT active and NOT recovering, update chart directly
                        if (!signalStateRef.current.isActive && !isRecoveringRef.current) {
                            const candles = candlesDataRef.current;
                            if (candles.length > 0) {
                                const lastCandle = candles[candles.length - 1];
                                if (wsCandle.time > lastCandle.time) {
                                    // New candle started
                                    candles.push(wsCandle);
                                    if (candles.length > 500) candles.shift();
                                    seriesRef.current.setData(candles);
                                } else {
                                    // Update current candle
                                    candles[candles.length - 1] = {
                                        ...wsCandle,
                                        high: Math.max(lastCandle.high, wsCandle.high),
                                        low: Math.min(lastCandle.low, wsCandle.low)
                                    };
                                    seriesRef.current.update(candles[candles.length - 1]);
                                }
                                if (onCandlesUpdate) onCandlesUpdate([...candles]);
                            }
                        }
                    }
                } catch (err) {
                    console.error('[Chart] Error parsing WebSocket message:', err);
                }
            };
            
            socket.onerror = (err) => {
                console.error('[Chart] WebSocket error:', err);
            };
            
            socket.onclose = () => {
                console.log('[Chart] WebSocket closed');
            };
        } catch (err) {
            console.error('[Chart] WebSocket connection failed:', err);
        }
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

        hasRebiasedRef.current = false; // Reset bias on chart rebuild
        isRecoveringRef.current = false; // Reset recovery on chart rebuild
        latestRealPriceRef.current = basePrice;

        const setupChartData = async () => {
            if (useCustomPrice) {
                // Custom price mode: use mock generator with custom price
                const initialCandles = generateInitialCandles(basePrice);
                candlesDataRef.current = initialCandles;
                series.setData(initialCandles);
                chart.timeScale().fitContent();
                if (onCandlesUpdate) onCandlesUpdate(initialCandles);
            } else {
                // Live market mode: load real history and start WebSocket
                const initialCandles = generateInitialCandles(basePrice);
                candlesDataRef.current = initialCandles;
                series.setData(initialCandles);
                chart.timeScale().fitContent();

                const history = await fetchBinanceHistory(symbol, interval);
                if (history && history.length > 0) {
                    candlesDataRef.current = history;
                    series.setData(history);
                    chart.timeScale().fitContent();
                    if (onCandlesUpdate) onCandlesUpdate(history);
                    
                    const lastHist = history[history.length - 1];
                    latestRealPriceRef.current = lastHist.close;
                }
                startWebSocket(symbol, interval);
            }
        };

        setupChartData();

        // please do not change or do not remove it can be used in the future
        // const TICK_MS = 1000;
        const TICK_MS = 250;

        updateIntervalRef.current = setInterval(() => {
            if (!seriesRef.current || candlesDataRef.current.length === 0) return;

            const sigState = signalStateRef.current;
            const nowMs = Date.now();
            const nowSec = Math.floor(nowMs / 1000);
            const intervalSeconds = getIntervalSeconds(interval);
            let lastCandle = candlesDataRef.current[candlesDataRef.current.length - 1];
            let lastPrice = lastCandle.close;

            // Target price to drift towards
            const realPrice = useCustomPrice
                ? (currentRateRef.current ? parseFloat(String(currentRateRef.current).replace(/,/g, '')) : lastPrice)
                : (latestRealPriceRef.current || lastPrice);

            let newClose;

            if (sigState.isActive) {
                const endTime = sigState.isTradingSignal ? sigState.endTime : sigState.signalEndTime;
                const remaining = endTime - nowMs;
                const PUSH_THRESHOLD = 3000; // Last 3 seconds — give more time to complete

                if (remaining <= PUSH_THRESHOLD && remaining > -1000) {
                    // ─── GRADUAL PUSH TOWARDS TARGET PRICE (LAST ~3 SECONDS) ───
                    if (!sigState.pushStarted) {
                        signalStateRef.current.lastPriceAtPushStart = lastPrice;
                        signalStateRef.current.pushStarted = true;
                        signalStateRef.current.pushStartTime = nowMs;
                    }

                    const pushDuration = Math.max(1500, endTime - sigState.pushStartTime);
                    const pushElapsed = nowMs - sigState.pushStartTime;
                    const pushProgress = Math.min(1, Math.max(0, pushElapsed / pushDuration));

                    // Target price at this moment (linear interpolation from start → target)
                    const expectedPrice = sigState.lastPriceAtPushStart + (sigState.targetPrice - sigState.lastPriceAtPushStart) * pushProgress;
                    // Move directly towards target with good speed — creates visible gradual candle movement
                    const gap = expectedPrice - lastPrice;
                    const stepSize = gap * 0.35; // 35% per 250ms tick → visible but smooth
                    newClose = lastPrice + stepSize;
                } else if (remaining <= PUSH_THRESHOLD) {
                    // ─── PUSH FULLY COMPLETE (past grace period) → fall back to normal/recovery ───
                    signalStateRef.current.isActive = false;
                    signalStateRef.current.pushStarted = false;
                    signalStateRef.current.isTradingSignal = false;
                    
                    if (useCustomPrice) {
                        const followSpeed = 0.02;
                        const diff = isNaN(realPrice - lastPrice) ? 0 : realPrice - lastPrice;
                        const drift = diff * followSpeed;
                        const volatility = lastPrice * (0.00005 + Math.random() * 0.000025);
                        newClose = lastPrice + drift + (Math.random() - 0.5) * volatility;
                    } else {
                        isRecoveringRef.current = true;
                        const diff = realPrice - lastPrice;
                        newClose = lastPrice + diff * 0.08;
                    }
                } else {
                    // ─── BEFORE THE PUSH: DRIFT TOWARDS SIGNAL TARGET EXPECTATION ───
                    const totalDur = endTime - (sigState.signalStartTime || (endTime - 10000));
                    const elapsed = nowMs - (sigState.signalStartTime || (endTime - 10000));
                    const progress = Math.min(1, Math.max(0, elapsed / totalDur));
                    const expectedPrice = sigState.startPrice + (sigState.targetPrice - sigState.startPrice) * progress;
                    const gap = expectedPrice - lastPrice;
                    const volatility = lastPrice * 0.00012;
                    newClose = lastPrice + gap * 0.08 + (Math.random() - 0.5) * volatility;
                }
            } else if (isRecoveringRef.current) {
                // ─── POST-SIGNAL RECOVERY MODE (Gently drift back to real market price) ───
                const diff = realPrice - lastPrice;
                const step = diff * 0.08; // 8% per tick towards real price
                newClose = lastPrice + step;

                // Check if close enough to hand over to WebSocket
                const pctDiff = Math.abs(newClose - realPrice) / realPrice;
                if (pctDiff < 0.001 || Math.abs(newClose - realPrice) < 0.01) {
                    isRecoveringRef.current = false;
                    newClose = realPrice;
                    console.log('[Chart] Recovery complete, WebSocket took over.');
                }
            } else {
                // ─── NORMAL MODE or FALLBACK ───
                if (useCustomPrice) {
                    // Gently drift back to real custom market price
                    const followSpeed = 0.02; // scaled for 250ms ticks
                    const diff = isNaN(realPrice - lastPrice) ? 0 : realPrice - lastPrice;
                    const drift = diff * followSpeed;
                    const volatility = lastPrice * (0.00005 + Math.random() * 0.000025); // scaled for 250ms ticks
                    newClose = lastPrice + drift + (Math.random() - 0.5) * volatility;
                } else {
                    // Normal WebSocket mode: WebSocket handles updates, but check for connection drops
                    if (socketRef.current && socketRef.current.readyState !== WebSocket.OPEN) {
                        // WebSocket is disconnected/connecting, run gentle mock drift
                        const followSpeed = 0.02;
                        const diff = isNaN(realPrice - lastPrice) ? 0 : realPrice - lastPrice;
                        const drift = diff * followSpeed;
                        const volatility = lastPrice * (0.00005 + Math.random() * 0.000025);
                        newClose = lastPrice + drift + (Math.random() - 0.5) * volatility;
                    } else {
                        // Let WebSocket handle ticks, just maintain current price
                        newClose = lastPrice;
                    }
                }
            }

            // Protect against NaN
            if (isNaN(newClose) || newClose <= 0) newClose = lastPrice;

            const moveSize = Math.abs(newClose - lastPrice);
            const wickSize = moveSize * (0.3 + Math.random() * 0.8);
            const newHigh = Math.max(lastPrice, newClose) + wickSize;
            const newLow = Math.min(lastPrice, newClose) - wickSize;

            // Only run manual updates if custom price is active, WebSocket is down, or signal/recovery is active
            if (useCustomPrice || sigState.isActive || isRecoveringRef.current || (socketRef.current && socketRef.current.readyState !== WebSocket.OPEN)) {
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
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
                seriesRef.current = null;
            }
        };
    }, [symbol, interval, useCustomPrice]); // Chart rebuilds when asset, timeframe, or price mode changes // Chart only rebuilds when asset or timeframe changes

    return (
        <div
            ref={chartContainerRef}
            style={{ width: '100%', height: '100%', minHeight: '300px', position: 'relative' }}
        />
    );
});

LightweightChart.displayName = 'LightweightChart';
export default LightweightChart;
