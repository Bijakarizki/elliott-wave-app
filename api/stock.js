/**
 * Vercel Serverless Function — Yahoo Finance Proxy
 * Route: /api/stock?ticker=BBCA&interval=1d&range=1y
 *
 * Intervals: 1d, 1wk, 1mo, 60m, 1h
 * Ranges: 1mo, 3mo, 6mo, 1y, 2y, 5y
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { ticker, interval = '1d', range = '1y' } = req.query

  if (!ticker) {
    return res.status(400).json({ error: 'ticker is required' })
  }

  // Normalize: BBCA → BBCA.JK
  const symbol = normalizeTicker(ticker)

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}&events=history`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Yahoo Finance error: ${response.status}`,
        symbol,
      })
    }

    const data = await response.json()
    const result = data?.chart?.result?.[0]

    if (!result) {
      return res.status(404).json({ error: 'No data found', symbol })
    }

    // Parse OHLCV
    const timestamps = result.timestamp || []
    const quote = result.indicators?.quote?.[0] || {}
    const { open, high, low, close, volume } = quote

    if (!timestamps.length) {
      return res.status(404).json({ error: 'Empty data', symbol })
    }

    const candles = timestamps
      .map((t, i) => ({
        time: t,
        open: open?.[i] != null ? +open[i].toFixed(2) : null,
        high: high?.[i] != null ? +high[i].toFixed(2) : null,
        low: low?.[i] != null ? +low[i].toFixed(2) : null,
        close: close?.[i] != null ? +close[i].toFixed(2) : null,
        volume: volume?.[i] ?? 0,
      }))
      .filter(c => c.open && c.high && c.low && c.close)
      .sort((a, b) => a.time - b.time)

    // Meta info
    const meta = {
      symbol: result.meta?.symbol,
      currency: result.meta?.currency,
      exchangeName: result.meta?.exchangeName,
      regularMarketPrice: result.meta?.regularMarketPrice,
      previousClose: result.meta?.previousClose,
    }

    // Cache 15 minutes for daily, 5 min for intraday
    const cacheSeconds = interval === '1d' || interval === '1wk' || interval === '1mo' ? 900 : 300
    res.setHeader('Cache-Control', `s-maxage=${cacheSeconds}, stale-while-revalidate`)

    return res.status(200).json({ candles, meta, count: candles.length })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal error' })
  }
}

function normalizeTicker(ticker) {
  const t = ticker.trim().toUpperCase()
  if (t.includes('.')) return t  // already has suffix
  return `${t}.JK`               // IDX default
}
