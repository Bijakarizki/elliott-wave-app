import { useState } from 'react'
import {
  ChevronDown, RotateCcw, Trash2, TrendingUp, TrendingDown,
  Eye, EyeOff, MousePointer, Minus, Square, GitBranch
} from 'lucide-react'
import EmitenPicker from './EmitenPicker'
import { getStockInfo } from '../utils/emiten'

const TIMEFRAMES = ['1H', '2H', '4H', '1D', '1W', '1M']
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

// Drawing tools definition
export const DRAWING_TOOLS = [
  { id: 'cursor', label: 'Cursor', icon: MousePointer, shortcut: 'V' },
  { id: 'elliott', label: 'Elliott Wave', icon: GitBranch, shortcut: 'E' },
  { id: 'fibo_ret', label: 'Fibo Retracement', icon: null, shortcut: 'F' },
  { id: 'fibo_ext', label: 'Fibo Extension', icon: null, shortcut: 'X' },
  { id: 'box', label: 'Rectangle', icon: Square, shortcut: 'B' },
  { id: 'trendline', label: 'Trendline', icon: Minus, shortcut: 'L' },
]

// Wave counting labels for Elliott
export const ELLIOTT_WAVE_TYPES = [
  { id: 'impulse_12345', label: 'Impulse (1-2-3-4-5)', points: 6 },
  { id: 'corrective_abc', label: 'Corrective (A-B-C)', points: 4 },
  { id: 'corrective_wxy', label: 'Double Three (W-X-Y)', points: 6 },
  { id: 'diagonal', label: 'Diagonal (1-2-3-4-5)', points: 6 },
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
  // Drawing tool props
  activeTool, setActiveTool,
  elliottWaveType, setElliottWaveType,
  drawings, onClearDrawings,
  // Indicators
  showStochRSI, setShowStochRSI,
  showMACD, setShowMACD,
}) {
  const [showPicker, setShowPicker] = useState(false)
  const [showElliottMenu, setShowElliottMenu] = useState(false)
  const stockInfo = getStockInfo(ticker)

  const handleSelectEmiten = (newTicker) => {
    setTicker(newTicker)
    onFetch(newTicker, timeframe)
  }

  const handleTimeframe = (tf) => {
    setTimeframe(tf)
    onFetch(ticker, tf)
  }

  const handleToolClick = (toolId) => {
    if (toolId === 'elliott') {
      setShowElliottMenu(v => !v)
      return
    }
    setActiveTool(toolId)
    setShowElliottMenu(false)
  }

  const handleElliottType = (type) => {
    setElliottWaveType(type)
    setActiveTool('elliott')
    setShowElliottMenu(false)
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

        {/* Emiten selector */}
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

        {/* Wave Mode (for auto-detection panel) */}
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

        <div className="w-px h-5 bg-border hidden md:block" />

        {/* ── DRAWING TOOLS ── */}
        <div className="hidden md:flex items-center gap-0.5 bg-surface rounded-lg p-1 border border-border relative">
          {DRAWING_TOOLS.map(tool => {
            const Icon = tool.icon
            const isActive = activeTool === tool.id
            return (
              <div key={tool.id} className="relative">
                <button
                  onClick={() => handleToolClick(tool.id)}
                  title={`${tool.label} (${tool.shortcut})`}
                  className={`px-2.5 py-1 text-xs font-mono rounded-md transition-all flex items-center gap-1 ${
                    isActive
                      ? 'bg-accent/20 text-accent border border-accent/40'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  {Icon ? <Icon size={11} /> : (
                    <span className="text-[10px] leading-none font-bold">
                      {tool.id === 'fibo_ret' ? 'FR' : 'FE'}
                    </span>
                  )}
                  <span className="hidden lg:inline">{tool.label}</span>
                </button>

                {/* Elliott wave type dropdown */}
                {tool.id === 'elliott' && showElliottMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-xl shadow-lg z-50 min-w-[200px] py-1">
                    <div className="px-3 py-1.5 text-xs text-muted font-mono border-b border-border mb-1">
                      Pilih Tipe Wave
                    </div>
                    {ELLIOTT_WAVE_TYPES.map(type => (
                      <button
                        key={type.id}
                        onClick={() => handleElliottType(type)}
                        className={`w-full text-left px-3 py-2 text-xs font-mono hover:bg-accent/10 hover:text-accent transition-colors ${
                          elliottWaveType?.id === type.id ? 'text-accent bg-accent/5' : 'text-text'
                        }`}
                      >
                        <div>{type.label}</div>
                        <div className="text-muted text-[10px]">{type.points - 1} segmen</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Actions — pushed to right */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Indicators toggle */}
          <button
            onClick={() => setShowStochRSI(!showStochRSI)}
            title="Toggle Stoch RSI"
            className={`btn-ghost flex items-center gap-1 h-8 px-2 text-xs font-mono ${showStochRSI ? 'border-purple-500/50 text-purple-400' : ''}`}
          >
            <span>StochRSI</span>
          </button>

          <button
            onClick={() => setShowMACD(!showMACD)}
            title="Toggle MACD"
            className={`btn-ghost flex items-center gap-1 h-8 px-2 text-xs font-mono ${showMACD ? 'border-blue-500/50 text-blue-400' : ''}`}
          >
            <span>MACD</span>
          </button>

          <div className="w-px h-5 bg-border" />

          <button
            onClick={() => setShowFib(!showFib)}
            title={showFib ? 'Hide Auto Fibonacci' : 'Show Auto Fibonacci'}
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
            onClick={() => { onReset(); onClearDrawings() }}
            title="Reset semua"
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

      {/* Active tool indicator */}
      {activeTool && activeTool !== 'cursor' && (
        <div className="px-4 py-1 bg-accent/5 border-b border-accent/10 flex items-center gap-2">
          <span className="text-xs text-accent font-mono">
            🖊 Tool aktif: {DRAWING_TOOLS.find(t => t.id === activeTool)?.label}
            {activeTool === 'elliott' && elliottWaveType && ` — ${elliottWaveType.label}`}
            {' '} | ESC atau V = cursor
          </span>
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
