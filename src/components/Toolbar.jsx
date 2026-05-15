import { useState } from 'react'
import { ChevronDown, RotateCcw, Trash2, TrendingUp, TrendingDown, Eye, EyeOff } from 'lucide-react'
import EmitenPicker from './EmitenPicker'
import { getStockInfo } from '../utils/emiten'

const TIMEFRAMES = ['1D', '1W', '1M']
const MODES = [
  { id: 'impulse', label: 'Impulse', icon: TrendingUp, color: 'text-green' },
  { id: 'corrective', label: 'Corrective', icon: TrendingDown, color: 'text-red' },
]
const CORRECTIVE_PATTERNS = [
  { id: 'ZIGZAG', label: 'Zigzag' },
  { id: 'FLAT_REGULAR', label: 'Flat Regular' },
  { id: 'FLAT_EXPANDED', label: 'Flat Expanded' },
  { id: 'FLAT_RUNNING', label: 'Flat Running' },
  { id: 'TRIANGLE_CONTRACTING', label: 'Triangle' },
  { id: 'DOUBLE_THREE', label: 'Double Three' },
]

export default function Toolbar({
  ticker, setTicker,
  timeframe, setTimeframe,
  waveMode, setWaveMode,
  correctivePattern, setCorrectivePattern,
  onFetch, onReset, onUndo,
  loading, error,
  showFib, setShowFib,
  wavePoints, meta,
}) {
  const [showPicker, setShowPicker] = useState(false)
  const stockInfo = getStockInfo(ticker)

  const handleSelectEmiten = (newTicker) => {
    setTicker(newTicker)
    onFetch(newTicker, timeframe)
  }

  const handleTimeframe = (tf) => {
    setTimeframe(tf)
    onFetch(ticker, tf)
  }

  return (
    <>
      <div className="glass border-b border-border px-4 py-2.5 flex items-center gap-3 flex-wrap min-h-[56px]">

        {/* Logo */}
        <div className="flex items-center gap-2 mr-1">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-bg text-xs font-bold font-mono">EW</span>
          </div>
          <span className="text-sm font-semibold text-text hidden lg:block">Elliott Wave</span>
        </div>

        <div className="w-px h-5 bg-border" />

        {/* Emiten selector button */}
        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-2.5 bg-surface border border-border hover:border-accent/50 rounded-xl px-3 py-2 transition-all group"
        >
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold font-mono text-accent">{ticker}</span>
              <span className="text-xs text-muted font-mono">.JK</span>
              {loading && (
                <div className="w-3 h-3 border-2 border-muted/30 border-t-accent rounded-full animate-spin ml-1" />
              )}
            </div>
            {stockInfo && (
              <p className="text-xs text-muted leading-tight truncate max-w-[140px]">{stockInfo.name}</p>
            )}
            {meta?.regularMarketPrice && !stockInfo?.name && (
              <p className="text-xs text-muted leading-tight">{meta.exchangeName}</p>
            )}
          </div>
          <ChevronDown size={14} className="text-muted group-hover:text-accent transition-colors flex-shrink-0" />
        </button>

        {/* Market price badge */}
        {meta?.regularMarketPrice && (
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-sm font-mono font-semibold text-text">
              {meta.regularMarketPrice.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
            </span>
            {meta.previousClose && (() => {
              const change = meta.regularMarketPrice - meta.previousClose
              const pct = (change / meta.previousClose * 100).toFixed(2)
              const isUp = change >= 0
              return (
                <span className={`text-xs font-mono ${isUp ? 'text-green' : 'text-red'}`}>
                  {isUp ? '+' : ''}{pct}%
                </span>
              )
            })()}
          </div>
        )}

        <div className="w-px h-5 bg-border" />

        {/* Timeframe */}
        <div className="flex items-center gap-0.5 bg-surface rounded-lg p-1 border border-border">
          {TIMEFRAMES.map(tf => (
            <button
              key={tf}
              onClick={() => handleTimeframe(tf)}
              className={`px-2.5 py-1 text-xs font-mono rounded-md transition-all ${
                timeframe === tf
                  ? 'bg-accent text-bg font-semibold'
                  : 'text-muted hover:text-text'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-border" />

        {/* Wave Mode */}
        <div className="flex items-center gap-0.5 bg-surface rounded-lg p-1 border border-border">
          {MODES.map(m => {
            const Icon = m.icon
            return (
              <button
                key={m.id}
                onClick={() => setWaveMode(m.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-md transition-all ${
                  waveMode === m.id
                    ? `bg-border ${m.color} font-semibold`
                    : 'text-muted hover:text-text'
                }`}
              >
                <Icon size={11} />
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            )
          })}
        </div>

        {/* Corrective pattern */}
        {waveMode === 'corrective' && (
          <select
            className="input-field text-xs h-8 py-1"
            value={correctivePattern}
            onChange={e => setCorrectivePattern(e.target.value)}
          >
            {CORRECTIVE_PATTERNS.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        )}

        {/* Actions — pushed to right */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => setShowFib(!showFib)}
            title={showFib ? 'Hide Fibonacci' : 'Show Fibonacci'}
            className={`btn-ghost flex items-center gap-1.5 h-8 px-2.5 ${showFib ? 'border-accent/50 text-accent' : ''}`}
          >
            {showFib ? <Eye size={12} /> : <EyeOff size={12} />}
            <span className="hidden md:inline text-xs">Fib</span>
          </button>

          <button
            onClick={onUndo}
            disabled={wavePoints.length === 0}
            title="Undo last point (Ctrl+Z)"
            className="btn-ghost h-8 px-2.5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <RotateCcw size={12} />
          </button>

          <button
            onClick={onReset}
            title="Reset all wave points"
            className="btn-ghost h-8 px-2.5 text-red/70 border-red/10 hover:border-red/40 hover:text-red"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Error bar */}
      {error && (
        <div className="px-4 py-1.5 bg-red/5 border-b border-red/10 flex items-center gap-2">
          <span className="text-xs text-red font-mono">⚠️ {error}</span>
        </div>
      )}

      {/* Emiten Picker Modal */}
      {showPicker && (
        <EmitenPicker
          currentTicker={ticker}
          onSelect={handleSelectEmiten}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  )
}
