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





in simple wording: abh admin idher se signal 1m se jitni der k liye bhi signal on kary ga to user side se jis currency k oper signal set kiya he or jin jin users k liye kiya he to un ko abh udher signal is tarha kam karen gy k jub users same admin k kahny per currency select kary ga trade page se or wohi users jo admin ne add kiye ho gy k is ko kitna profit ho to user phir buy long button per click kary to 10 seconds start hoty hen jo k currently features he udher se admin users ko bataey ga k buy karna he ya sell to idher users bhi same buy krey ga ya admin k kahny per sell jis kisam k signal ho gy sell karny k liye ya buy karny k liye to jub 10 seconds button k click per start ho to candles markete k hisab se jo akhri wala candle ho ga akhri candle se bus akhri 2 seconds me admin wala custom candle behave kary jesy admin ne up signal on kiya ho ya down signal on kiya ho or candle us k agaey gai amount k mutabik custom behave kary  or candle usi tarha behave ker k dekhey keh user ne bhi jo signal on ho buy k liye up wala to same profit ho jesy admin ne users k liye select kiya ho ga or ager user ne upposite direction me trade lagai ho to loss ho jessa keh up signal per sell kry to or down signal per buy kary to loss ho kiyo k jo admin ne signal diye ho gy user uposite direction kar dy ghalti se to loss hi banta he. or jub custom signal candle start ho to candle jump ni hony chahiye last original candle se akhri 2 seconds me same profite ya loss k liye custom candle behave kary jo admin ne set kiye ho or phir button k clck per timer wala short khatam hoty hi again admin k custom candle jaha per end howey ho wahi se markete k mutabik candles apni jaga per any shoro ho jaey or koi jumping na ho 

currently issues: currently same users same currency select hony k bawajod users side se signal on hoty howey bhi candles akhri 2 seconds me custom behave ni kar rahi or loss bhhi ho raha he her baar 

in prompt: 
# 🕯️ Custom Candle Final Logic Blueprint
### 1. Active Targeted Signaling
- **Scope**: Targeted manipulation applies ONLY if:
  - The admin has activated a signal for the **exact currency** viewed by the user.
  - The specific **User ID** is included in the admin's targeted list.
  - The user has an **active open trade** (countdown running).
### 2. The 10-Second Trade Lifecycle
- **Phase 1: Organic Monitoring (0-8 Seconds)**:
  - The chart displays **real market data**.
  - Small jitters are added to keep the chart "alive," but the price follows the global market rate.
  - No manipulation is visible during this phase.
  
- **Phase 2: The Custom Push (Last 2 Seconds)**:
  - The engine transitions to "Push Mode."
  - Using the **Last Price** at the 8-second mark as a starting point (to prevent jumps).
  - The price is smoothly interpolated toward the `TargetPrice` required to fulfill the Admin's win/loss decision.
  - This 2-second movement appears as a natural last-second market surge or dip.
### 3. Directional Enforcement
- **Win Condition**: If User Direction (BUY/SELL) matches Admin Signal (UP/DOWN) -> **PROFIT** (calculated via admin-set percentage).
- **Loss Condition**: If User Direction goes against Admin Signal -> **FORCED LOSS**.
- **No-Jump Rule**: The manipulation always starts from the *current* candle position. There is never a visual "teleportation" or jumping of candles.
### 4. Post-Trade Recovery
- Once the trade concludes, the chart resumes following the **Real Market Rate** smoothly.
- It drifts back to the correct global price without any sudden snapping, maintaining a clean visual flow.
---
**Current Status**: 
- [x] Implemented in `LightweightChart.jsx`
- [x] 100% Deterministic Outcome in `Trade.jsx`
- [x] Smooth 2-second transition active.

