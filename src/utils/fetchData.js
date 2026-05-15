/**
 * Fetch OHLC data via Vercel serverless proxy (/api/stock)
 * No CORS issues, no API key needed
 */

const INTERVAL_MAP = {
  '1H': '60m',
  '2H': '1h',   // 2H uses 1h interval with aggregation
  '4H': '1h',
  '1D': '1d',
  '1W': '1wk',
  '1M': '1mo',
}

const RANGE_MAP = {
  '1H': '5d',
  '2H': '30d',
  '4H': '60d',
  '1D': '2y',
  '1W': '5y',
  '1M': '10y',
}

const CANDLE_AGGREGATION = {
  '2H': 2,
}

function aggregateCandles(candles, factor) {
  if (!factor || factor <= 1) return candles
  const result = []
  for (let i = 0; i < candles.length; i += factor) {
    const group = candles.slice(i, i + factor)
    if (group.length === 0) continue
    result.push({
      time: group[0].time,
      open: group[0].open,
      high: Math.max(...group.map(c => c.high)),
      low: Math.min(...group.map(c => c.low)),
      close: group[group.length - 1].close,
      volume: group.reduce((s, c) => s + (c.volume || 0), 0),
    })
  }
  return result
}

export async function fetchStockData(ticker, timeframe = '1D') {
  const interval = INTERVAL_MAP[timeframe] || '1d'
  const range = RANGE_MAP[timeframe] || '2y'

  const url = `/api/stock?ticker=${encodeURIComponent(ticker)}&interval=${interval}&range=${range}`

  const response = await fetch(url)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || `Error ${response.status}`)
  }

  if (!data.candles?.length) {
    throw new Error('Data kosong — cek ticker')
  }

  const aggFactor = CANDLE_AGGREGATION[timeframe]
  const candles = aggFactor ? aggregateCandles(data.candles, aggFactor) : data.candles

  return { candles, meta: data.meta }
}

export function generateMockData(ticker = 'BBCA', bars = 300) {
  const basePrice = {
    BBCA: 9200, BBRI: 4500, BMRI: 7000, BBNI: 5500,
    TLKM: 3800, ASII: 5200, GOTO: 55, BUKA: 120,
    BYAN: 18000, ADRO: 2800, ANTM: 1600, MDKA: 2500,
  }[ticker.toUpperCase()] || 3000

  let price = basePrice
  const now = Math.floor(Date.now() / 1000)
  const daySeconds = 86400
  const candles = []

  for (let i = bars; i >= 0; i--) {
    const time = now - i * daySeconds
    const trend = Math.sin(i / 30) * 0.003
    const open = price * (1 + trend + (Math.random() - 0.5) * 0.015)
    const close = open * (1 + trend + (Math.random() - 0.48) * 0.018)
    const high = Math.max(open, close) * (1 + Math.random() * 0.008)
    const low = Math.min(open, close) * (1 - Math.random() * 0.008)
    price = close

    candles.push({
      time,
      open: +open.toFixed(0),
      high: +high.toFixed(0),
      low: +low.toFixed(0),
      close: +close.toFixed(0),
      volume: Math.floor(Math.random() * 80000000 + 5000000),
    })
  }

  return {
    candles: candles.sort((a, b) => a.time - b.time),
    meta: { symbol: `${ticker}.JK`, currency: 'IDR', exchangeName: 'IDX (Simulasi)' },
  }
}
