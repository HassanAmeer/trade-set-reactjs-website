

# Api Key : 20c87391-6c37-4e83-a9cb-ad52ab7a3da2

# Calling Api

```javascript
await fetch(new Request("https://api.livecoinwatch.com/coins/list"), {
  method: "POST",
  headers: new Headers({
    "content-type": "application/json",
    "x-api-key": "<YOUR_API_KEY>",
  }),
  body: JSON.stringify({
    currency: "USD",
    sort: "rank",
    order: "ascending",
    offset: 0,
    limit: 2,
    meta: false,
  }),
});
```


# Response Like This
```json
[
  {
    "code": "BTC",
    "rate": 59075.58195922644,
    "volume": 23100393182,
    "cap": 1102979514307,
    "delta": {
      "hour": 1.008,
      "day": 1.0808,
      "week": 1.2793,
      "month": 1.4754,
      "quarter": 0.4804,
      "year": 0.7455
    }
  },
  {
    "code": "ETH",
    "rate": 1933.6392223621567,
    "volume": 12686119704,
    "cap": 222928063223,
    "delta": {
      "hour": 1.0015,
      "day": 1.0386,
      "week": 1.0822,
      "month": 1.158,
      "quarter": 0.5436,
      "year": 0.7004
    }
  }
]
```






////// get by slected coins name

```js
await fetch(new Request("https://api.livecoinwatch.com/coins/map"), {
  method: "POST",
  headers: new Headers({
    "content-type": "application/json",
    "x-api-key": "<YOUR_API_KEY>",
  }),
  body: JSON.stringify({
    codes: ["ETH", "BTC","GRIN"],
    currency: "USD",
    sort: "rank",
    order: "ascending",
    offset: 0,
    limit: 0,
    meta: false,
  }),
});
```

# Response Like This
```json
[
  {
    "code": "BTC",
    "rate": 24033.24173657366,
    "volume": 14151561000,
    "cap": 459414930787,
    "delta": {
      "hour": 0.9975,
      "day": 1.0445,
      "week": 1.0454,
      "month": 1.106,
      "quarter": 0.7655,
      "year": 0.5399
    }
  },
  {
    "code": "ETH",
    "rate": 1771.4633449389692,
    "volume": 9351819221,
    "cap": 215903855069,
    "delta": {
      "hour": 1.0011,
      "day": 1.0503,
      "week": 1.0769,
      "month": 1.4474,
      "quarter": 0.7453,
      "year": 0.5691
    }
  },
  {
    "code": "GRIN",
    "rate": 0.07354315748650457,
    "volume": 998880,
    "cap": 4625806,
    "delta": {
      "hour": 0.9983,
      "day": 1.0189,
      "week": 1.1734,
      "month": 1.1519,
      "quarter": 0.7298,
      "year": 0.214
    }
  }
]
```