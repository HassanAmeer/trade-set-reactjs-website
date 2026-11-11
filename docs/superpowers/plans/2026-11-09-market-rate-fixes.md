# Market Rate Accuracy Fixes — Implementation Plan

> For agentic workers: implement tasks in order; each task ends with a build check.

**Goal:** Every asset on the site shows the latest rate with a real change percentage, correct units, and a graceful fallback when a provider fails or is rate-limited.

**Architecture:** Keep the existing client-side Firestore caching model. Normalise provider data at fetch time (metals units, quote changes), derive missing change percentages from a ~24h Firestore baseline, write config updates as field patches so parallel tabs cannot clobber each other, and add provider backoff plus a last-known-good localStorage cache.

**Tech Stack:** React 19, Vite, Firebase Firestore, LiveCoinWatch, metals.dev, TwelveData, exchangerate-api.

**Spec:** this file (design approved in chat on 2026-11-09).

## Global Constraints

- Free API tiers only: LiveCoinWatch (10k credits/day), TwelveData Basic (8 req/min, 800/day), metals.dev Free (100 req/month).
- Never show a fabricated `Math.random()` change percentage.
- Base metals display per metric tonne; precious metals per troy ounce.
- Existing Firestore doc shapes stay readable (`coins_rates_*`, `admin_set/coins_config`).
- No other session's code may be reverted; `git status` before commit.

---

### Task 1: Provider normalisation (`src/services/api.js`)

**Files:** Modify `src/services/api.js`

**Interfaces (produces):**
- `fetchMetalsBundle(): Promise<{ metals: Record<string, number>, currencies: Record<string, number>, timestamps: object }>` — base metals converted to USD per metric tonne (`lme_* × 32150.7466`), precious metals as USD per troy ounce.
- `fetchStockQuotes(symbols: string[]): Promise<Record<string, {price, change, percent_change, previous_close}>>` — TwelveData `/quote` map.
- `fetchMetalMarkets()` kept, delegates to `fetchMetalsBundle()`.
- `fetchForexMarkets()` no longer fabricates change (`'0.00%'`).

- [ ] Add `TROY_OUNCES_PER_METRIC_TONNE = 32150.7466` and `BASE_METAL_KEYS`.
- [ ] Use `DCU40FCSUKCJAJ3WJVJI9823WJVJI` as `METALS_DEV_KEY`.
- [ ] `fetchMetalsBundle` throws an `Error` with `.status` on HTTP failure.
- [ ] `fetchStockQuotes` joins symbols with commas and returns the raw map.

### Task 2: Market context (`src/context/MarketContext.jsx`)

**Files:** Modify `src/context/MarketContext.jsx`

**Interfaces:**
- Consumes Task 1 functions.
- Produces context value `{ assets, loading, refreshData, selectedAsset, setSelectedAsset, setIsActive, syncConfig, lastUpdated }`.
- Every asset gets `change` as a display string (`'+0.00%'` / `'-0.00%'`) and `updatedAt` (ms epoch).

- [ ] Helpers: `parseRateNumber`, `formatChange`, `computeChangePct` (rejects non-finite or `|pct| > 40`).
- [ ] `buildForexFromCachedRaw(raw, extraForex)` reads `raw.baseline` and `raw.baselineAt`; invert sign for `*/USD` pairs.
- [ ] `buildMetalsFromCachedRaw(rates, extraMetals, baseline)` looks up keys by metal symbol (`XAU`→gold … `LD`→lead) and computes change against baseline.
- [ ] `buildStocksFromCachedRaw(rawRates, extraStocks, deletedStocks)` uses `percent_change` or `previous_close`.
- [ ] One `fetchMetalsBundle()` call updates both forex and metals docs and both `lastSyncedAt` fields.
- [ ] Baseline rule: keep stored baseline while `< 48h` old, else baseline = previous `rates` at `syncedAt`.
- [ ] Provider backoff map: 5 min on generic failure, 6 h on HTTP 429 / quota text; skip fetch while backed off.
- [ ] Config writes use `setDoc(doc(db, 'admin_set', 'coins_config'), patch, { merge: true })`.
- [ ] Stocks use `fetchStockQuotes` instead of `/price`.
- [ ] Initial state hydrates `market_last_good_assets_v1` from localStorage; save after a load that read any real data.
- [ ] Refresh `FALLBACK_*` constants to measured 2026-11-09 values and label `isLive:false`.
- [ ] Expose `lastUpdated`.

### Task 3: Admin coins panel (`src/pages/admin/AdminCoinsSettings.jsx`)

**Files:** Modify `src/pages/admin/AdminCoinsSettings.jsx`

- [ ] Force-sync metals/forex uses `fetchMetalsBundle()`; stores normalised metals + baseline.
- [ ] Force-sync stocks uses `fetchStockQuotes`.
- [ ] Force-sync writes config with `{ merge: true }`.
- [ ] `addCoin` removes the re-added id from `deletedCoins` (crypto `CODEUSDT`, forex `fx-code`, stocks `stock-CODE`).
- [ ] Admin live-rate display understands normalised base-metal values (already key-based, no unit change).

### Task 4: Data cleanup (one-off, backed up)

- [ ] Export `admin_set/coins_custom_rates` to `/tmp/opencode/custom_rates_backup_<date>.json`.
- [ ] Remove only the known demo values (BTC 99,999, gold 4,358.10, silver 70.45, platinum 1804.50, palladium 1371.50, copper 6.47, NVDA 212.45, TSLA 411.15, matching demo memory files).
- [ ] Leave `useCustomPrice` untouched (currently `false` everywhere).

### Task 5: Verification

- [ ] `npm run build` passes.
- [ ] Spot-check BTC, GBP/USD, gold, copper, AMZN against live APIs.
- [ ] Confirm no `Math.random` change remains in rate code.
- [ ] `git status` shows only intended files.
