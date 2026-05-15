import { useEffect, useRef, useCallback } from 'react'
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts'
import { WAVE_COLORS } from '../utils/elliottWave'

const CHART_OPTIONS = {
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
    scaleMargins: { top: 0.1, bottom: 0.2 },
  },
  timeScale: {
    borderColor: '#1e1e2e',
    timeVisible: true,
    secondsVisible: false,
  },
  handleScroll: true,
  handleScale: true,
}

export default function WaveChart({
  candles,
  wavePoints,
  waveMode,
  activeWaveIndex,
  onPointAdded,
  fibTargets,
  showFib,
}) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const candleSeriesRef = useRef(null)
  const markerSeriesRef = useRef(null)
  const fibLinesRef = useRef([])
  const waveLineRef = useRef(null)

  // Init chart
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      ...CHART_OPTIONS,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    })

    chartRef.current = chart

    // Candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#00d084',
      downColor: '#ff4466',
      borderUpColor: '#00d084',
      borderDownColor: '#ff4466',
      wickUpColor: '#00d08488',
      wickDownColor: '#ff446688',
    })
    candleSeriesRef.current = candleSeries

    // Wave line series
    const waveLine = chart.addLineSeries({
      color: '#f0b42966',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
    })
    waveLineRef.current = waveLine

    // Resize observer
    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.resize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        )
      }
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
    }
  }, [])

  // Load candles
  useEffect(() => {
    if (!candleSeriesRef.current || !candles?.length) return
    candleSeriesRef.current.setData(candles)
    chartRef.current?.timeScale().fitContent()
  }, [candles])

  // Handle click → add wave point
  useEffect(() => {
    const chart = chartRef.current
    const series = candleSeriesRef.current
    if (!chart || !series || !onPointAdded) return

    const handleClick = (param) => {
      if (!param.point || !param.time) return
      const price = series.coordinateToPrice(param.point.y)
      if (!price) return
      onPointAdded({ time: param.time, price: +price.toFixed(2) })
    }

    chart.subscribeClick(handleClick)
    return () => chart.unsubscribeClick(handleClick)
  }, [onPointAdded])

  // Draw wave markers + connecting line
  useEffect(() => {
    const series = candleSeriesRef.current
    const waveLine = waveLineRef.current
    if (!series || !waveLine) return

    const labels = waveMode === 'impulse'
      ? ['0', '1', '2', '3', '4', '5']
      : ['Start', 'A', 'B', 'C']

    // Markers
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

    // Connecting dashed line
    if (wavePoints.length >= 2) {
      waveLine.setData(
        wavePoints.map(pt => ({ time: pt.time, value: pt.price }))
      )
    } else {
      waveLine.setData([])
    }
  }, [wavePoints, waveMode])

  // Draw Fibonacci target lines
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    // Remove old fib lines
    fibLinesRef.current.forEach(s => {
      try { chart.removeSeries(s) } catch (_) {}
    })
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

      // Get time range from candles to draw horizontal line
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

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full tv-chart" />

      {/* Crosshair hint */}
      {activeWaveIndex !== null && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="glass px-3 py-1.5 rounded-full text-xs text-accent font-mono animate-pulse">
            Klik chart → mark Wave {waveMode === 'impulse'
              ? ['0','1','2','3','4','5'][activeWaveIndex]
              : ['Start','A','B','C'][activeWaveIndex]}
          </div>
        </div>
      )}
    </div>
  )
}
