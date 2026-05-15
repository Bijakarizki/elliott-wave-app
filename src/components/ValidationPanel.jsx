import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import { getValidationSummary } from '../utils/elliottWave'

const StatusIcon = ({ status, size = 14 }) => {
  if (status === 'valid') return <CheckCircle size={size} className="text-green flex-shrink-0" />
  if (status === 'invalid') return <XCircle size={size} className="text-red flex-shrink-0" />
  if (status === 'warn') return <AlertTriangle size={size} className="text-accent flex-shrink-0" />
  return <Info size={size} className="text-blue flex-shrink-0" />
}

const StatusTag = ({ status }) => {
  if (status === 'valid') return <span className="tag-valid">VALID</span>
  if (status === 'invalid') return <span className="tag-invalid">VIOLATED</span>
  if (status === 'warn') return <span className="tag-warn">GUIDELINE</span>
  return <span className="tag-info">INFO</span>
}

export default function ValidationPanel({ rules, guidelines, alternation, nextTargets, wavePoints, waveMode }) {
  const summary = getValidationSummary(rules)
  const hasData = wavePoints.length >= 2

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1">

      {/* Summary badge */}
      <div className={`glass rounded-xl p-3 flex items-center gap-3 ${
        summary.status === 'valid' ? 'glow-green border-green/20' :
        summary.status === 'invalid' ? 'glow-red border-red/20' :
        summary.status === 'warn' ? 'glow-accent border-accent/20' : ''
      }`}>
        <StatusIcon status={summary.status} size={18} />
        <div>
          <div className="text-xs text-subtle font-mono">Status Validasi</div>
          <div className={`text-sm font-semibold font-mono ${
            summary.status === 'valid' ? 'text-green' :
            summary.status === 'invalid' ? 'text-red' :
            summary.status === 'warn' ? 'text-accent' : 'text-muted'
          }`}>{summary.label}</div>
        </div>
        <div className="ml-auto text-xs text-muted font-mono">
          {wavePoints.length} pts
        </div>
      </div>

      {!hasData && (
        <div className="text-center py-8 text-muted text-xs font-mono">
          Klik chart untuk mark wave points
        </div>
      )}

      {/* Hard Rules */}
      {rules.length > 0 && (
        <Section title="Hard Rules" icon="⚡">
          {rules.map((r, i) => (
            <RuleItem key={i} rule={r} />
          ))}
        </Section>
      )}

      {/* Alternation */}
      {alternation && (
        <Section title="Alternation" icon="↔">
          <div className={`flex items-start gap-2 p-2 rounded-lg ${
            alternation.status === 'valid' ? 'bg-green/5' : 'bg-accent/5'
          }`}>
            <StatusIcon status={alternation.status} size={13} />
            <p className="text-xs text-subtle leading-relaxed">{alternation.message}</p>
          </div>
        </Section>
      )}

      {/* Fibonacci Guidelines */}
      {guidelines.length > 0 && (
        <Section title="Fibonacci Guidelines" icon="📐">
          {guidelines.map((g, i) => (
            <div key={i} className="border border-border rounded-lg p-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text">{g.label}</span>
                <StatusTag status={g.status} />
              </div>
              <div className="text-xs font-mono text-accent">{g.value}</div>
              <div className="text-xs text-muted">{g.detail}</div>
            </div>
          ))}
        </Section>
      )}

      {/* Next Wave Targets */}
      {nextTargets.length > 0 && (
        <Section title="Target Wave Berikutnya" icon="🎯">
          <div className="space-y-1">
            {nextTargets.map((t, i) => (
              <div key={i} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                <span className="text-xs text-subtle font-mono">{t.label}</span>
                <span className="text-xs text-accent font-mono font-semibold">
                  {t.price.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Wave Points List */}
      {wavePoints.length > 0 && (
        <Section title="Wave Points" icon="📍">
          <div className="space-y-1">
            {wavePoints.map((pt, i) => {
              const labels = waveMode === 'impulse'
                ? ['0','1','2','3','4','5']
                : ['Start','A','B','C']
              return (
                <div key={i} className="flex items-center gap-2 py-1">
                  <div className="wave-badge text-bg text-xs" style={{
                    background: ['#f0b429','#00d084','#4da6ff','#a78bfa','#f0b429','#00d084'][i] || '#8888aa'
                  }}>
                    {labels[i] || i}
                  </div>
                  <span className="text-xs font-mono text-text">
                    {pt.price.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-xs text-muted ml-auto">
                    {new Date(pt.time * 1000).toLocaleDateString('id-ID', { day:'2-digit', month:'short' })}
                  </span>
                </div>
              )
            })}
          </div>
        </Section>
      )}

    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <div className="glass rounded-xl p-3 space-y-2 slide-in">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-sm">{icon}</span>
        <h3 className="text-xs font-semibold text-subtle uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function RuleItem({ rule }) {
  return (
    <div className={`flex items-start gap-2 p-2 rounded-lg ${
      rule.status === 'valid' ? 'bg-green/5 border border-green/10' :
      rule.status === 'invalid' ? 'bg-red/5 border border-red/10' :
      'bg-accent/5 border border-accent/10'
    }`}>
      <StatusIcon status={rule.status} size={13} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-text">{rule.label}</span>
          <StatusTag status={rule.status} />
        </div>
        <p className="text-xs text-muted mt-0.5 leading-relaxed">{rule.detail}</p>
      </div>
    </div>
  )
}
