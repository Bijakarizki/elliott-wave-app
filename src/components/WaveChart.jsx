import { useEffect, useRef, useCallback, useState } from 'react'
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts'
import { WAVE_COLORS } from '../utils/elliottWave'

// ─── Indicator math helpers ────────────────────────────────────────────────

function calcRSI(closes, period = 14) {
  const result = new Array(closes.length).fill(null)
  if (closes.length < period + 1) return result
  let gains = 0, losses = 0
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff >= 0) gains += diff; else losses -= diff
  }
  let avgGain = gains / period
  let avgLoss = losses / period
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    const g = diff >= 0 ? diff : 0
    const l = diff < 0 ? -diff : 0
    avgGain = (avgGain * (period - 1) + g) / period
    avgLoss = (avgLoss * (period - 1) + l) / period
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  }
  return result
}

function calcStochRSI(closes, rsiPeriod = 14, stochPeriod = 14, kPeriod = 3, dPeriod = 3) {
  const rsi = calcRSI(closes, rsiPeriod)
  const stochK = new Array(closes.length).fill(null)
  for (let i = rsiPeriod + stochPeriod - 1; i < rsi.length; i++) {
    const window = rsi.slice(i - stochPeriod + 1, i + 1).filter(v => v !== null)
    if (window.length < stochPeriod) continue
    const minRSI = Math.min(...window)
    const maxRSI = Math.max(...window)
    stochK[i] = maxRSI === minRSI ? 0 : ((rsi[i] - minRSI) / (maxRSI - minRSI)) * 100
  }
  // Smooth K
  const smoothK = new Array(closes.length).fill(null)
  for (let i = kPeriod - 1; i < stochK.length; i++) {
    const window = stochK.slice(i - kPeriod + 1, i + 1).filter(v => v !== null)
    if (window.length === kPeriod) smoothK[i] = window.reduce((a, b) => a + b, 0) / kPeriod
  }
  // D line (MA of smoothK)
  const smoothD = new Array(closes.length).fill(null)
  for (let i = dPeriod - 1; i < smoothK.length; i++) {
    const window = smoothK.slice(i - dPeriod + 1, i + 1).filter(v => v !== null)
    if (window.length === dPeriod) smoothD[i] = window.reduce((a, b) => a + b, 0) / dPeriod
  }
  return { k: smoothK, d: smoothD }
}

function calcEMA(closes, period) {
  const result = new Array(closes.length).fill(null)
  if (closes.length < period) return result
  let sum = 0
  for (let i = 0; i < period; i++) sum += closes[i]
  result[period - 1] = sum / period
  const mult = 2 / (period + 1)
  for (let i = period; i < closes.length; i++) {
    result[i] = (closes[i] - result[i - 1]) * mult + result[i - 1]
  }
  return result
}

function calcMACD(closes, fast = 12, slow = 26, signal = 9) {
  const emaFast = calcEMA(closes, fast)
  const emaSlow = calcEMA(closes, slow)
  const macdLine = closes.map((_, i) =>
    emaFast[i] !== null && emaSlow[i] !== null ? emaFast[i] - emaSlow[i] : null
  )
  // Signal: EMA of macd
  const validStart = macdLine.findIndex(v => v !== null)
  const signalLine = new Array(closes.length).fill(null)
  if (validStart >= 0) {
    const macdValues = macdLine.slice(validStart)
    const emaSignal = calcEMA(macdValues, signal)
    for (let i = 0; i < emaSignal.length; i++) {
      signalLine[validStart + i] = emaSignal[i]
    }
  }
  const histogram = closes.map((_, i) =>
    macdLine[i] !== null && signalLine[i] !== null ? macdLine[i] - signalLine[i] : null
  )
  return { macd: macdLine, signal: signalLine, histogram }
}

// ─── Chart options ──────────────────────────────────────────────────────────

const BASE_CHART_OPTIONS = {
  layout: {
    background: { color: '#0a0a0f' },
    textColor: '#8888aa',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 11,
  },
  grid: {
    vertLines: { color: '#1a1a2e', style: LineStyle.Dotted },
    horzLines: { color: '#1a1a2e', style: LineStyle.Dotted },
  },
  crosshair: {
    mode: CrosshairMode.Normal,
    vertLine: { color: '#f0b42944', width: 1, style: LineStyle.Dashed },
    horzLine: { color: '#f0b42944', width: 1, style: LineStyle.Dashed },
  },
  rightPriceScale: {
    borderColor: '#1e1e2e',
    scaleMargins: { top: 0.05, bottom: 0.05 },
  },
  timeScale: {
    borderColor: '#1e1e2e',
    timeVisible: true,
    secondsVisible: false,
  },
  handleScroll: true,
  handleScale: true,
}

// ─── Elliott wave label sets ────────────────────────────────────────────────

const WAVE_LABEL_SETS = {
  impulse_12345: ['0', '1', '2', '3', '4', '5'],
  corrective_abc: ['Start', 'A', 'B', 'C'],
  corrective_wxy: ['W', 'X', 'Y'],
  diagonal: ['0', '1', '2', '3', '4', '5'],
}

// ─── Fibo levels ────────────────────────────────────────────────────────────

const FIBO_RETRACEMENT_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]
const FIBO_EXTENSION_LEVELS = [0, 0.618, 1, 1.272, 1.414, 1.618, 2, 2.618]

// ─── Main component ─────────────────────────────────────────────────────────

export default function WaveChart({
  candles,
  wavePoints,
  waveMode,
  activeWaveIndex,
  onPointAdded,
  fibTargets,
  showFib,
  // Drawing tool state
  activeTool,
  setActiveTool,
  elliottWaveType,
  drawings,
  setDrawings,
  // Indicators
  showStochRSI,
  showMACD,
}) {
  const mainContainerRef = useRef(null)
  const stochContainerRef = useRef(null)
  const macdContainerRef = useRef(null)

  const mainChartRef = useRef(null)
  const stochChartRef = useRef(null)
  const macdChartRef = useRef(null)

  const candleSeriesRef = useRef(null)
  const fibLinesRef = useRef([])
  const waveLineRef = useRef(null)

  // Stoch RSI series
  const stochKRef = useRef(null)
  const stochDRef = useRef(null)
  // MACD series
  const macdLineRef = useRef(null)
  const macdSignalRef = useRef(null)
  const macdHistRef = useRef(null)

  // Drawing state
  const drawingStateRef = useRef({ phase: 'idle', points: [], tempSeries: [] })
  const canvasOverlayRef = useRef(null)
  const svgOverlayRef = useRef(null)

  // ── Init main chart ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mainContainerRef.current) return
    const chart = createChart(mainContainerRef.current, {
      ...BASE_CHART_OPTIONS,
      width: mainContainerRef.current.clientWidth,
      height: mainContainerRef.current.clientHeight,
      rightPriceScale: {
        ...BASE_CHART_OPTIONS.rightPriceScale,
        scaleMargins: { top: 0.05, bottom: 0.05 },
      },
    })
    mainChartRef.current = chart

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#00d084',
      downColor: '#ff4466',
      borderUpColor: '#00d084',
      borderDownColor: '#ff4466',
      wickUpColor: '#00d08488',
      wickDownColor: '#ff446688',
    })
    candleSeriesRef.current = candleSeries

    const waveLine = chart.addLineSeries({
      color: '#f0b42966',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
    })
    waveLineRef.current = waveLine

    const ro = new ResizeObserver(() => {
      if (mainContainerRef.current && mainChartRef.current) {
        mainChartRef.current.resize(
          mainContainerRef.current.clientWidth,
          mainContainerRef.current.clientHeight
        )
      }
    })
    ro.observe(mainContainerRef.current)

    return () => {
      ro.disconnect()
      chart.remove()
      mainChartRef.current = null
    }
  }, [])

  // ── Init Stoch RSI chart ────────────────────────────────────────────────────
  useEffect(() => {
    if (!showStochRSI || !stochContainerRef.current) return
    const chart = createChart(stochContainerRef.current, {
      ...BASE_CHART_OPTIONS,
      width: stochContainerRef.current.clientWidth,
      height: stochContainerRef.current.clientHeight,
      rightPriceScale: {
        ...BASE_CHART_OPTIONS.rightPriceScale,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: { ...BASE_CHART_OPTIONS.timeScale, visible: false },
    })
    stochChartRef.current = chart

    stochKRef.current = chart.addLineSeries({
      color: '#a78bfa',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      title: 'K',
    })
    stochDRef.current = chart.addLineSeries({
      color: '#f9a8d4',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      title: 'D',
    })

    // OB/OS lines
    const ob = chart.addLineSeries({ color: '#ff446633', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
    const os = chart.addLineSeries({ color: '#00d08433', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })

    const ro = new ResizeObserver(() => {
      if (stochContainerRef.current && stochChartRef.current) {
        stochChartRef.current.resize(stochContainerRef.current.clientWidth, stochContainerRef.current.clientHeight)
      }
    })
    ro.observe(stochContainerRef.current)

    // Store ob/os on chart for later use with candle times
    chart._ob = ob
    chart._os = os

    return () => {
      ro.disconnect()
      chart.remove()
      stochChartRef.current = null
      stochKRef.current = null
      stochDRef.current = null
    }
  }, [showStochRSI])

  // ── Init MACD chart ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showMACD || !macdContainerRef.current) return
    const chart = createChart(macdContainerRef.current, {
      ...BASE_CHART_OPTIONS,
      width: macdContainerRef.current.clientWidth,
      height: macdContainerRef.current.clientHeight,
      rightPriceScale: {
        ...BASE_CHART_OPTIONS.rightPriceScale,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: { ...BASE_CHART_OPTIONS.timeScale, visible: true },
    })
    macdChartRef.current = chart

    macdLineRef.current = chart.addLineSeries({
      color: '#60a5fa',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      title: 'MACD',
    })
    macdSignalRef.current = chart.addLineSeries({
      color: '#f97316',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      title: 'Signal',
    })
    macdHistRef.current = chart.addHistogramSeries({
      color: '#00d08466',
      priceLineVisible: false,
      lastValueVisible: false,
      title: 'Hist',
    })

    const ro = new ResizeObserver(() => {
      if (macdContainerRef.current && macdChartRef.current) {
        macdChartRef.current.resize(macdContainerRef.current.clientWidth, macdContainerRef.current.clientHeight)
      }
    })
    ro.observe(macdContainerRef.current)

    return () => {
      ro.disconnect()
      chart.remove()
      macdChartRef.current = null
      macdLineRef.current = null
      macdSignalRef.current = null
      macdHistRef.current = null
    }
  }, [showMACD])

  // ── Load candles + sync charts + compute indicators ────────────────────────
  useEffect(() => {
    if (!candleSeriesRef.current || !candles?.length) return
    candleSeriesRef.current.setData(candles)
    mainChartRef.current?.timeScale().fitContent()

    const closes = candles.map(c => c.close)
    const times = candles.map(c => c.time)

    // ── Stoch RSI ──
    if (showStochRSI && stochKRef.current && stochDRef.current) {
      const { k, d } = calcStochRSI(closes)
      const kData = k.map((v, i) => v !== null ? { time: times[i], value: v } : null).filter(Boolean)
      const dData = d.map((v, i) => v !== null ? { time: times[i], value: v } : null).filter(Boolean)
      stochKRef.current.setData(kData)
      stochDRef.current.setData(dData)

      // OB/OS horizontal lines
      if (stochChartRef.current?._ob && times.length >= 2) {
        const t0 = times[0], tN = times[times.length - 1]
        stochChartRef.current._ob.setData([{ time: t0, value: 80 }, { time: tN, value: 80 }])
        stochChartRef.current._os.setData([{ time: t0, value: 20 }, { time: tN, value: 20 }])
      }
      stochChartRef.current?.timeScale().fitContent()
    }

    // ── MACD ──
    if (showMACD && macdLineRef.current && macdSignalRef.current && macdHistRef.current) {
      const { macd, signal, histogram } = calcMACD(closes)
      macdLineRef.current.setData(
        macd.map((v, i) => v !== null ? { time: times[i], value: v } : null).filter(Boolean)
      )
      macdSignalRef.current.setData(
        signal.map((v, i) => v !== null ? { time: times[i], value: v } : null).filter(Boolean)
      )
      macdHistRef.current.setData(
        histogram.map((v, i) => v !== null ? { time: times[i], value: v, color: v >= 0 ? '#00d08466' : '#ff446666' } : null).filter(Boolean)
      )
      macdChartRef.current?.timeScale().fitContent()
    }

    // Sync time scales
    const syncCharts = () => {
      const range = mainChartRef.current?.timeScale().getVisibleLogicalRange()
      if (!range) return
      stochChartRef.current?.timeScale().setVisibleLogicalRange(range)
      macdChartRef.current?.timeScale().setVisibleLogicalRange(range)
    }
    mainChartRef.current?.timeScale().subscribeVisibleLogicalRangeChange(syncCharts)
    return () => mainChartRef.current?.timeScale().unsubscribeVisibleLogicalRangeChange(syncCharts)

  }, [candles, showStochRSI, showMACD])

  // ── Wave click handler (original mode) ─────────────────────────────────────
  useEffect(() => {
    const chart = mainChartRef.current
    const series = candleSeriesRef.current
    if (!chart || !series || !onPointAdded || activeTool !== 'cursor') return

    const handleClick = (param) => {
      if (!param.point || !param.time) return
      const price = series.coordinateToPrice(param.point.y)
      if (!price) return
      onPointAdded({ time: param.time, price: +price.toFixed(2) })
    }

    chart.subscribeClick(handleClick)
    return () => chart.unsubscribeClick(handleClick)
  }, [onPointAdded, activeTool])

  // ── Drawing tool click handler ──────────────────────────────────────────────
  useEffect(() => {
    const chart = mainChartRef.current
    const series = candleSeriesRef.current
    if (!chart || !series) return
    if (!['fibo_ret', 'fibo_ext', 'box', 'trendline', 'elliott'].includes(activeTool)) return

    const state = drawingStateRef.current

    const handleClick = (param) => {
      if (!param.point || !param.time) return
      const price = series.coordinateToPrice(param.point.y)
      if (!price) return
      const pt = { time: param.time, price: +price.toFixed(2) }

      if (activeTool === 'fibo_ret' || activeTool === 'fibo_ext') {
        if (state.phase === 'idle') {
          state.phase = 'point1'
          state.points = [pt]
        } else if (state.phase === 'point1') {
          state.points.push(pt)
          // Commit drawing
          const [p1, p2] = state.points
          const newDrawing = {
            id: Date.now(),
            type: activeTool,
            points: [p1, p2],
            levels: activeTool === 'fibo_ret' ? FIBO_RETRACEMENT_LEVELS : FIBO_EXTENSION_LEVELS,
          }
          setDrawings(prev => [...prev, newDrawing])
          state.phase = 'idle'
          state.points = []
          setActiveTool('cursor')
        }
      } else if (activeTool === 'trendline') {
        if (state.phase === 'idle') {
          state.phase = 'point1'
          state.points = [pt]
        } else {
          state.points.push(pt)
          const [p1, p2] = state.points
          setDrawings(prev => [...prev, { id: Date.now(), type: 'trendline', points: [p1, p2] }])
          state.phase = 'idle'
          state.points = []
          setActiveTool('cursor')
        }
      } else if (activeTool === 'box') {
        if (state.phase === 'idle') {
          state.phase = 'point1'
          state.points = [pt]
        } else {
          state.points.push(pt)
          const [p1, p2] = state.points
          setDrawings(prev => [...prev, { id: Date.now(), type: 'box', points: [p1, p2] }])
          state.phase = 'idle'
          state.points = []
          setActiveTool('cursor')
        }
      } else if (activeTool === 'elliott') {
        const maxPts = (elliottWaveType?.points || 6)
        state.points.push(pt)
        if (state.points.length >= maxPts) {
          setDrawings(prev => [...prev, {
            id: Date.now(),
            type: 'elliott',
            waveType: elliottWaveType,
            points: [...state.points],
          }])
          state.points = []
          state.phase = 'idle'
          setActiveTool('cursor')
        }
      }
    }

    chart.subscribeClick(handleClick)
    return () => chart.unsubscribeClick(handleClick)
  }, [activeTool, elliottWaveType, setDrawings, setActiveTool])

  // ── Render drawings (fibo, trendline, box, elliott) ─────────────────────────
  const drawingSeriesRef = useRef([])
  useEffect(() => {
    const chart = mainChartRef.current
    if (!chart || !candles?.length) return

    // Remove old drawing series
    drawingSeriesRef.current.forEach(s => { try { chart.removeSeries(s) } catch (_) {} })
    drawingSeriesRef.current = []

    const allTimes = candles.map(c => c.time)
    const t0 = allTimes[0]
    const tN = allTimes[allTimes.length - 1]

    drawings.forEach(d => {
      if (d.type === 'fibo_ret' || d.type === 'fibo_ext') {
        const [p1, p2] = d.points
        const diff = p2.price - p1.price
        const base = d.type === 'fibo_ret' ? p2.price : p1.price
        const dir = d.type === 'fibo_ret' ? -1 : 1;
        (d.levels || FIBO_RETRACEMENT_LEVELS).forEach(level => {
          const price = d.type === 'fibo_ret'
            ? p2.price + (p1.price - p2.price) * level
            : p1.price + (p2.price - p1.price) * level
          const s = chart.addLineSeries({
            color: level === 0.618 ? '#f0b429aa' : level === 0.5 ? '#4da6ffaa' : '#8888aa55',
            lineWidth: 1,
            lineStyle: level === 0 || level === 1 ? LineStyle.Solid : LineStyle.Dashed,
            priceLineVisible: false,
            lastValueVisible: true,
            title: `${(level * 100).toFixed(1)}%`,
          })
          s.setData([{ time: t0, value: price }, { time: tN, value: price }])
          drawingSeriesRef.current.push(s)
        })
      } else if (d.type === 'trendline') {
        const [p1, p2] = d.points
        const s = chart.addLineSeries({
          color: '#f0b429cc',
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        })
        s.setData([{ time: p1.time, value: p1.price }, { time: p2.time, value: p2.price }])
        drawingSeriesRef.current.push(s)
      } else if (d.type === 'box') {
        const [p1, p2] = d.points
        const topPrice = Math.max(p1.price, p2.price)
        const botPrice = Math.min(p1.price, p2.price)
        const tStart = Math.min(p1.time, p2.time)
        const tEnd = Math.max(p1.time, p2.time)
        // Draw 4 sides as line series
        const boxColor = '#4da6ff55'
        // Top line
        const top = chart.addLineSeries({ color: '#4da6ffaa', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
        top.setData([{ time: tStart, value: topPrice }, { time: tEnd, value: topPrice }])
        // Bottom line
        const bot = chart.addLineSeries({ color: '#4da6ffaa', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
        bot.setData([{ time: tStart, value: botPrice }, { time: tEnd, value: botPrice }])
        drawingSeriesRef.current.push(top, bot)
      } else if (d.type === 'elliott') {
        const labels = WAVE_LABEL_SETS[d.waveType?.id] || WAVE_LABEL_SETS['impulse_12345']
        const colors = ['#f0b429', '#00d084', '#4da6ff', '#a78bfa', '#f0b429', '#00d084']
        d.points.forEach((pt, i) => {
          const s = chart.addLineSeries({
            color: colors[i % colors.length] + 'cc',
            lineWidth: i === 0 ? 0 : 2,
            priceLineVisible: false,
            lastValueVisible: true,
            title: labels[i] || String(i),
          })
          if (i === 0) {
            s.setData([{ time: pt.time, value: pt.price }])
          } else {
            s.setData([
              { time: d.points[i - 1].time, value: d.points[i - 1].price },
              { time: pt.time, value: pt.price },
            ])
          }
          drawingSeriesRef.current.push(s)
        })
      }
    })
  }, [drawings, candles])

  // ── Original wave markers ───────────────────────────────────────────────────
  useEffect(() => {
    const series = candleSeriesRef.current
    const waveLine = waveLineRef.current
    if (!series || !waveLine) return

    const labels = waveMode === 'impulse'
      ? ['0', '1', '2', '3', '4', '5']
      : ['Start', 'A', 'B', 'C']

    const markers = wavePoints.map((pt, i) => ({
      time: pt.time,
      position: i % 2 === 0
        ? (waveMode === 'impulse' ? 'belowBar' : 'aboveBar')
        : (waveMode === 'impulse' ? 'aboveBar' : 'belowBar'),
      color: WAVE_COLORS[labels[i]] || '#f0b429',
      shape: 'circle',
      text: labels[i] || String(i),
      size: 1,
    }))

    series.setMarkers(markers)

    if (wavePoints.length >= 2) {
      waveLine.setData(wavePoints.map(pt => ({ time: pt.time, value: pt.price })))
    } else {
      waveLine.setData([])
    }
  }, [wavePoints, waveMode])

  // ── Auto Fibonacci targets ──────────────────────────────────────────────────
  useEffect(() => {
    const chart = mainChartRef.current
    if (!chart) return
    fibLinesRef.current.forEach(s => { try { chart.removeSeries(s) } catch (_) {} })
    fibLinesRef.current = []
    if (!showFib || !fibTargets?.length) return
    fibTargets.forEach(({ level, price, label }) => {
      const series = chart.addLineSeries({
        color: '#f0b42933',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        priceLineVisible: false,
        lastValueVisible: true,
        title: label || `${(level * 100).toFixed(1)}%`,
      })
      const allTimes = candles?.map(c => c.time) || []
      if (allTimes.length >= 2) {
        series.setData([
          { time: allTimes[0], value: price },
          { time: allTimes[allTimes.length - 1], value: price },
        ])
      }
      fibLinesRef.current.push(series)
    })
  }, [fibTargets, showFib, candles])

  // ── ESC key to reset tool ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' || e.key === 'v' || e.key === 'V') {
        setActiveTool('cursor')
        drawingStateRef.current = { phase: 'idle', points: [], tempSeries: [] }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setActiveTool])

  // ── Cursor style ────────────────────────────────────────────────────────────
  const getCursor = () => {
    if (activeTool === 'cursor') return 'default'
    return 'crosshair'
  }

  const indicatorCount = (showStochRSI ? 1 : 0) + (showMACD ? 1 : 0)
  const mainHeightClass = indicatorCount === 0
    ? 'flex-1'
    : indicatorCount === 1
    ? 'h-[55%]'
    : 'h-[45%]'

  const indicatorHeightClass = indicatorCount === 1 ? 'h-[45%]' : 'h-[27%]'

  return (
    <div className="relative w-full h-full flex flex-col" style={{ cursor: getCursor() }}>
      {/* Main chart */}
      <div ref={mainContainerRef} className={`w-full ${mainHeightClass} tv-chart`} />

      {/* Stoch RSI panel */}
      {showStochRSI && (
        <div className="w-full border-t border-border" style={{ height: indicatorCount === 1 ? '45%' : '27%' }}>
          <div className="flex items-center gap-2 px-3 py-1 border-b border-border/50">
            <span className="text-[10px] font-mono text-purple-400">STOCH RSI (14,14,3,3)</span>
            <span className="text-[9px] text-purple-400">▬ K</span>
            <span className="text-[9px] text-pink-400">▬ D</span>
            <span className="text-[9px] text-red/60">── OB 80</span>
            <span className="text-[9px] text-green/60">── OS 20</span>
          </div>
          <div ref={stochContainerRef} className="w-full" style={{ height: 'calc(100% - 26px)' }} />
        </div>
      )}

      {/* MACD panel */}
      {showMACD && (
        <div className="w-full border-t border-border" style={{ height: indicatorCount === 1 ? '45%' : '27%' }}>
          <div className="flex items-center gap-2 px-3 py-1 border-b border-border/50">
            <span className="text-[10px] font-mono text-blue-400">MACD (12,26,9)</span>
            <span className="text-[9px] text-blue-400">▬ MACD</span>
            <span className="text-[9px] text-orange-400">▬ Signal</span>
            <span className="text-[9px] text-muted">▮ Histogram</span>
          </div>
          <div ref={macdContainerRef} className="w-full" style={{ height: 'calc(100% - 26px)' }} />
        </div>
      )}

      {/* Crosshair hint for wave marking */}
      {activeTool === 'cursor' && activeWaveIndex !== null && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none z-10">
          <div className="glass px-3 py-1.5 rounded-full text-xs text-accent font-mono animate-pulse">
            Klik chart → mark Wave {waveMode === 'impulse'
              ? ['0','1','2','3','4','5'][activeWaveIndex]
              : ['Start','A','B','C'][activeWaveIndex]}
          </div>
        </div>
      )}

      {/* Drawing tool hint */}
      {activeTool !== 'cursor' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none z-10">
          <div className="glass px-3 py-1.5 rounded-full text-xs text-yellow-400 font-mono">
            {activeTool === 'fibo_ret' && (drawingStateRef.current.phase === 'idle' ? 'Klik titik HIGH' : 'Klik titik LOW')}
            {activeTool === 'fibo_ext' && (drawingStateRef.current.phase === 'idle' ? 'Klik titik awal wave' : 'Klik titik akhir wave')}
            {activeTool === 'trendline' && (drawingStateRef.current.phase === 'idle' ? 'Klik titik awal garis' : 'Klik titik akhir garis')}
            {activeTool === 'box' && (drawingStateRef.current.phase === 'idle' ? 'Klik pojok pertama kotak' : 'Klik pojok kedua kotak')}
            {activeTool === 'elliott' && `Elliott Wave: klik ${(elliottWaveType?.points || 6) - drawingStateRef.current.points.length} titik lagi`}
          </div>
        </div>
      )}
    </div>
  )
}
