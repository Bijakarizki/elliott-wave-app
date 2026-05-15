import { useState, useEffect, useRef } from 'react'
import { Search, X, ChevronRight, Star } from 'lucide-react'
import { SECTORS, searchStocks } from '../utils/emiten'

export default function EmitenPicker({ currentTicker, onSelect, onClose }) {
  const [query, setQuery] = useState('')
  const [activeSector, setActiveSector] = useState('lq45')
  const [searchResults, setSearchResults] = useState([])
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (query.length > 0) {
      setSearchResults(searchStocks(query))
    } else {
      setSearchResults([])
    }
  }, [query])

  const handleSelect = (ticker) => {
    onSelect(ticker)
    onClose()
  }

  const activeSectorData = SECTORS.find(s => s.id === activeSector)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative glass rounded-2xl border border-border w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Search size={16} className="text-muted flex-shrink-0" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-text font-mono text-sm placeholder-muted outline-none"
            placeholder="Cari ticker atau nama emiten... (BBCA, Telkom, dll)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') onClose()
              if (e.key === 'Enter' && searchResults.length > 0) {
                handleSelect(searchResults[0].ticker)
              }
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-muted hover:text-text">
              <X size={14} />
            </button>
          )}
          <button onClick={onClose} className="text-muted hover:text-text ml-1">
            <X size={16} />
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="p-2 border-b border-border">
            <p className="text-xs text-muted px-2 mb-1">Hasil pencarian</p>
            <div className="space-y-0.5">
              {searchResults.map(stock => (
                <StockRow
                  key={stock.ticker}
                  stock={stock}
                  isActive={stock.ticker === currentTicker}
                  onSelect={handleSelect}
                  showSector
                />
              ))}
            </div>
          </div>
        )}

        {/* Browse by sector */}
        {!query && (
          <div className="flex flex-1 overflow-hidden">
            {/* Sector sidebar */}
            <div className="w-44 border-r border-border overflow-y-auto py-2 flex-shrink-0">
              {SECTORS.map(sector => (
                <button
                  key={sector.id}
                  onClick={() => setActiveSector(sector.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors text-xs ${
                    activeSector === sector.id
                      ? 'bg-accent/10 text-accent border-r-2 border-accent'
                      : 'text-muted hover:text-text hover:bg-border/30'
                  }`}
                >
                  <span>{sector.icon}</span>
                  <span className="font-medium truncate">{sector.label}</span>
                  {activeSector === sector.id && (
                    <ChevronRight size={12} className="ml-auto flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Stock list */}
            <div className="flex-1 overflow-y-auto p-2">
              {activeSectorData && (
                <>
                  <p className="text-xs text-muted px-2 mb-2 font-mono">
                    {activeSectorData.icon} {activeSectorData.label} — {activeSectorData.stocks.length} emiten
                  </p>
                  <div className="space-y-0.5">
                    {activeSectorData.stocks.map(stock => (
                      <StockRow
                        key={stock.ticker}
                        stock={stock}
                        isActive={stock.ticker === currentTicker}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer hint */}
        <div className="px-4 py-2.5 border-t border-border flex items-center gap-3">
          <span className="text-xs text-muted">
            <kbd className="bg-border px-1.5 py-0.5 rounded text-xs font-mono">↵</kbd> pilih
          </span>
          <span className="text-xs text-muted">
            <kbd className="bg-border px-1.5 py-0.5 rounded text-xs font-mono">Esc</kbd> tutup
          </span>
          <span className="text-xs text-muted ml-auto">
            Semua data dari Yahoo Finance • IDX
          </span>
        </div>
      </div>
    </div>
  )
}

function StockRow({ stock, isActive, onSelect, showSector }) {
  return (
    <button
      onClick={() => onSelect(stock.ticker)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors group ${
        isActive
          ? 'bg-accent/10 border border-accent/20'
          : 'hover:bg-border/40 border border-transparent'
      }`}
    >
      {/* Ticker badge */}
      <div className={`w-14 flex-shrink-0 text-xs font-mono font-bold px-2 py-0.5 rounded-md text-center ${
        isActive ? 'bg-accent text-bg' : 'bg-surface text-accent group-hover:bg-accent/10'
      }`}>
        {stock.ticker}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium truncate ${isActive ? 'text-text' : 'text-subtle group-hover:text-text'}`}>
          {stock.name}
        </p>
        {showSector && stock.sector && (
          <p className="text-xs text-muted">{stock.sectorIcon} {stock.sector}</p>
        )}
      </div>

      {/* Suffix */}
      <span className="text-xs text-muted font-mono flex-shrink-0">.JK</span>

      {isActive && <Star size={12} className="text-accent flex-shrink-0" />}
    </button>
  )
}
