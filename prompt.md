**Context:**
I am working on a React.js application for a trading platform. I have a file named `Trade.jsx` which contains a `handlePlaceTrade` function. In this function, users place a trade (BUY/SELL) with a specific amount and a countdown timer starts. 

I have a "Trade Control" system where an admin can manipulate the outcome of a trade by setting a `winLossPercentage` for a **specific user** on a **specific currency/symbol** (e.g., BTC). This configuration comes from Firebase `admin_set/market_signal`.

**The Current Flow (How it works right now):**
When a user clicks BUY/SELL, the `handlePlaceTrade` function deducts the entire trade amount (e.g., $10) from their balance immediately. It starts a `setInterval` timer. When the timer reaches `0`, it fetches the fresh config from Firebase (`liveConfig`), extracts the `winLossPercentage` for that specific user, calculates the dollar amount based on the percentage, and updates the user's balance.

**The Bug/Issue:**
Currently, the logic to calculate the final win/loss amount (inside the `setInterval` completion block) looks like this:
```javascript
const rawPct = liveConfig?.affectedUsersMap?.[user?.id]?.winLossPercentage;
const winLossPct = (rawPct !== undefined && rawPct !== null) ? parseFloat(rawPct) : 0;
const isWin = winLossPct >= 0;
const dollarAmount = Math.abs(amount * winLossPct / 100);

const totalReturn = isWin ? amount + dollarAmount : amount - dollarAmount;
if (totalReturn > 0) await updateUser({ balance: increment(totalReturn) });
```

**The Problem with this code:**
1. If the user trades on a currency that the admin did **not** set for them (Mismatched Symbol), or if the user is **not** in the admin's target list, `rawPct` becomes `undefined`.
2. The code then defaults `winLossPct` to `0`. 
3. Because it's `0`, the user receives `100%` of their original stake back (`amount + 0`). It acts as a tie/organic outcome.
4. **This is wrong.** If a user is not specifically targeted for that exact currency, they must suffer a **100% loss** by default (they lose their entire stake).

**The Requirements for Fixing (What you need to do):**
Please provide the updated code for `Trade.jsx` (specifically the outcome evaluation part and the timer completion part) that strictly follows these rules:

1. **Rule 1 (Default 100% Loss for normal users):** If the user's name is NOT in the admin's `affectedUsersMap`, OR if the user selects a currency that DOES NOT EXACTLY MATCH the admin's active signal currency, the user must suffer a **100% loss** on their trade amount. Since the $10 was already deducted upfront, the system should return $0 (they lose everything).

2. **Rule 2 (Controlled Profit for special users):** If the user matches the active currency AND their `winLossPercentage` is positive (e.g., `+7`), they should get their original $10 stake back PLUS a $0.70 profit. Total returned to balance: `$10.70`.

3. **Rule 3 (Controlled Loss for special users - EXTREMELY IMPORTANT):** If the user matches the active currency AND their `winLossPercentage` is negative (e.g., `-7`), they must **NOT** lose their entire $10 stake. Because they are a special user, they should only lose 7% of the stake (which is $0.70). Since the $10 was already deducted upfront, the system must refund the remaining `$9.30` back to their balance. The total loss from their balance must ONLY be $0.70, not the full $10.

**Please rewrite the outcome evaluation logic in `Trade.jsx` so that it correctly identifies symbol mismatches and enforces the 100% default loss, while properly refunding the correct amount for special targeted users (both for partial profit and partial loss).**
