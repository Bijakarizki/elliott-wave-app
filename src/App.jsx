import { useState, useCallback, useMemo, useEffect } from 'react'
import WaveChart from './components/WaveChart'
import ValidationPanel from './components/ValidationPanel'
import Toolbar from './components/Toolbar'
import { fetchStockData, generateMockData } from './utils/fetchData'
import {
  validateImpulse,
  validateCorrective,
  getImpulseGuidelines,
  checkAlternation,
  getNextWaveTargets,
} from './utils/elliottWave'

const MAX_IMPULSE_POINTS = 6
const MAX_CORRECTIVE_POINTS = 4

export default function App() {
  const [ticker, setTicker] = useState('BBCA')
  const [timeframe, setTimeframe] = useState('1D')
  const [waveMode, setWaveMode] = useState('impulse')
  const [correctivePattern, setCorrectivePattern] = useState('ZIGZAG')
  const [candles, setCandles] = useState([])
  const [meta, setMeta] = useState(null)
  const [wavePoints, setWavePoints] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showFib, setShowFib] = useState(true)
  const [usingMock, setUsingMock] = useState(false)

  const maxPoints = waveMode === 'impulse' ? MAX_IMPULSE_POINTS : MAX_CORRECTIVE_POINTS
  const activeWaveIndex = wavePoints.length < maxPoints ? wavePoints.length : null

  const handleFetch = useCallback(async (sym = ticker, tf = timeframe) => {
    setLoading(true)
    setError(null)
    setWavePoints([])
    setUsingMock(false)

    try {
      const { candles: data, meta: m } = await fetchStockData(sym, tf)
      setCandles(data)
      setMeta(m)
    } catch (err) {
      console.warn('Fetch failed, using mock:', err.message)
      setUsingMock(true)
      const { candles: mock, meta: mockMeta } = generateMockData(sym)
      setCandles(mock)
      setMeta(mockMeta)
      setError(`Data real tidak tersedia — menampilkan simulasi (${err.message})`)
    } finally {
      setLoading(false)
    }
  }, [ticker, timeframe])

  // Auto-load on mount
  useEffect(() => { handleFetch() }, [])

  // Keyboard shortcut: Ctrl+Z = undo
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        setWavePoints(prev => prev.slice(0, -1))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handlePointAdded = useCallback((point) => {
    setWavePoints(prev => {
      if (prev.length >= maxPoints) return prev
      if (prev.some(p => p.time === point.time)) return prev
      return [...prev, point]
    })
  }, [maxPoints])

  const handleUndo = useCallback(() => setWavePoints(prev => prev.slice(0, -1)), [])
  const handleReset = useCallback(() => setWavePoints([]), [])

  const handleSetWaveMode = useCallback((mode) => {
    setWaveMode(mode)
    setWavePoints([])
  }, [])

  const { rules, guidelines, alternation, nextTargets } = useMemo(() => {
    if (wavePoints.length < 2) return { rules: [], guidelines: [], alternation: null, nextTargets: [] }

    if (waveMode === 'impulse') {
      return {
        rules: validateImpulse(wavePoints),
        guidelines: getImpulseGuidelines(wavePoints),
        alternation: wavePoints.length >= 5 ? checkAlternation(wavePoints) : null,
        nextTargets: getNextWaveTargets(wavePoints, 'impulse'),
      }
    }
    return {
      rules: validateCorrective(wavePoints, correctivePattern),
      guidelines: [],
      alternation: null,
      nextTargets: getNextWaveTargets(wavePoints, 'corrective'),
    }
  }, [wavePoints, waveMode, correctivePattern])

  const fibTargets = useMemo(() => showFib ? nextTargets : [], [nextTargets, showFib])

  return (
    <div className="flex flex-col h-screen bg-bg overflow-hidden">
      <Toolbar
        ticker={ticker}
        setTicker={setTicker}
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        waveMode={waveMode}
        setWaveMode={handleSetWaveMode}
        correctivePattern={correctivePattern}
        setCorrectivePattern={setCorrectivePattern}
        onFetch={handleFetch}
        onReset={handleReset}
        onUndo={handleUndo}
        loading={loading}
        error={error}
        showFib={showFib}
        setShowFib={setShowFib}
        wavePoints={wavePoints}
        meta={meta}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Chart */}
        <div className="flex-1 relative overflow-hidden">
          {candles.length === 0 && !loading ? (
            <EmptyState onFetch={() => handleFetch()} />
          ) : (
            <WaveChart
              candles={candles}
              wavePoints={wavePoints}
              waveMode={waveMode}
              activeWaveIndex={activeWaveIndex}
              onPointAdded={activeWaveIndex !== null ? handlePointAdded : null}
              fibTargets={fibTargets}
              showFib={showFib}
            />
          )}

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-bg/60 backdrop-blur-sm">
              <div className="glass rounded-xl px-5 py-3 flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                <span className="text-sm text-subtle font-mono">Mengambil data {ticker}.JK...</span>
              </div>
            </div>
          )}

          {/* Mock badge */}
          {usingMock && !loading && (
            <div className="absolute bottom-3 left-3 pointer-events-none">
              <span className="tag-warn px-2 py-1 text-xs">⚠ DATA SIMULASI</span>
            </div>
          )}

          {/* Wave progress */}
          {candles.length > 0 && !loading && (
            <div className="absolute bottom-3 right-3 glass rounded-xl px-3 py-2 pointer-events-none">
              <WaveProgress
                wavePoints={wavePoints}
                maxPoints={maxPoints}
                waveMode={waveMode}
                activeWaveIndex={activeWaveIndex}
              />
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-72 border-l border-border p-3 overflow-hidden flex flex-col bg-surface/30">
          <ValidationPanel
            rules={rules}
            guidelines={guidelines}
            alternation={alternation}
            nextTargets={nextTargets}
            wavePoints={wavePoints}
            waveMode={waveMode}
          />
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onFetch }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
        <span className="text-3xl">📈</span>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-text mb-1">Elliott Wave Analyzer</h2>
        <p className="text-sm text-muted max-w-xs leading-relaxed">
          Pilih emiten IDX dari toolbar, lalu klik titik-titik di chart untuk mulai marking wave.
        </p>
      </div>
      <button onClick={onFetch} className="btn-primary">Mulai dengan BBCA</button>
    </div>
  )
}

function WaveProgress({ wavePoints, maxPoints, waveMode, activeWaveIndex }) {
  const labels = waveMode === 'impulse' ? ['0','1','2','3','4','5'] : ['S','A','B','C']
  const colors = ['#f0b429','#00d084','#4da6ff','#a78bfa','#f0b429','#00d084']

  return (
    <div className="flex items-center gap-1.5">
      {labels.map((label, i) => (
        <div
          key={i}
          className={`wave-badge text-xs transition-all duration-200 ${
            i < wavePoints.length ? 'text-bg scale-110' :
            i === activeWaveIndex ? 'border-2 border-accent text-accent animate-pulse' :
            'border border-border text-muted'
          }`}
          style={i < wavePoints.length ? { background: colors[i] || '#8888aa' } : {}}
        >
          {label}
        </div>
      ))}
      <span className="text-xs text-muted font-mono ml-1">{wavePoints.length}/{maxPoints}</span>
    </div>
  )
}
