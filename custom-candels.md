# Custom Candle Signaling Protocol

This document outlines the technical implementation for the "No-Jump" smooth market manipulation system.

### 1. Goal
Provide a 100% realistic trading experience where admin-forced market moves are indistinguishable from real market data. This includes smooth entry/exit and precise profit-to-percentage matching.

### 2. Smooth Transitions (The "No-Jump" Rule)
The chart MUST NOT reset when the real market price updates.
- **Entry**: When a signal starts, the first custom candle MUST take the `close` price of the last real candle as its `open` price.
- **Exit**: When a signal ends, the last custom candle's price becomes the baseline for the next real-world tick. No price gaps are allowed.

### 3. Target Percentage Alignment
The price movement must reach a specific percentage calculated by:
`Target Price = Start Price * (1 + (Payout % / 100))`
This ensures that the visual profit shown on the chart at the moment of closing matches the financial profit credited to the user's balance.

### 4. Trigger on Action
Custom candles MUST NOT activate just because a signal is active. They MUST only start moving when the user explicitly clicks **BUY / LONG** or **SELL / SHORT**. 
- This ensures the market stays stable until the user enters their position.
- The movement ratio is calculated based on the investment amount and the payout percentage.

### 5. Selective Enforcement
- **Asset Filtering**: Only the specific `symbol` selected by the admin (e.g., `XAU/USD`) will display custom candles.
- **User Filtering**: Only targeted users see the movement.
- **Realism**: Movements are scaled down (e.g., Payout / 40) to prevent oversized, unrealistic candles.

### 6. Zigzag Wave Behavior
Movement must follow a 3-wave cycle with reduced amplitude (0.08 scaling) and slow transition speeds (0.05) to ensure the graph looks professional and organic.

### 7. Development Checklist
- [x] Remove `currentRate` dependency from Chart initialization to prevent resets.
- [x] Implement persistent `signalStateRef` for price continuity.
- [x] Match visual candle height to admin-defined payout ratios.
- [x] Sync chart "Stop" state with User "Trade Close" action.
- [x] Trigger custom candles ONLY on user button click.

