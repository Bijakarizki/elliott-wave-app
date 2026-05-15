/**
 * Elliott Wave Validation Engine
 * Rules based on the complete guide reference
 */

export const WAVE_COLORS = {
  0: '#8888aa',
  1: '#f0b429',
  2: '#4da6ff',
  3: '#00d084',
  4: '#a78bfa',
  5: '#f0b429',
  A: '#ff4466',
  B: '#4da6ff',
  C: '#ff4466',
  X: '#8888aa',
}

export const IMPULSE_WAVES = ['0', '1', '2', '3', '4', '5']
export const CORRECTIVE_WAVES = ['A', 'B', 'C']
export const COMPLEX_WAVES = ['W', 'X', 'Y', 'Z']

export const CORRECTIVE_PATTERNS = {
  ZIGZAG: 'Zigzag (5-3-5)',
  FLAT_REGULAR: 'Flat Regular (3-3-5)',
  FLAT_EXPANDED: 'Flat Expanded (3-3-5)',
  FLAT_RUNNING: 'Flat Running (3-3-5)',
  TRIANGLE_CONTRACTING: 'Triangle Contracting (3-3-3-3-3)',
  TRIANGLE_EXPANDING: 'Triangle Expanding (3-3-3-3-3)',
  DOUBLE_THREE: 'Double Three (W-X-Y)',
  TRIPLE_THREE: 'Triple Three (W-X-Y-X-Z)',
}

export const FIBONACCI = {
  retracement: [0.236, 0.382, 0.5, 0.618, 0.786, 1.0],
  extension: [1.0, 1.272, 1.414, 1.618, 2.0, 2.618],
}

// Calculate wave length (absolute price movement)
export function waveLength(start, end) {
  return Math.abs(end.price - start.price)
}

// Calculate retracement ratio
export function retracementRatio(wave, retrace) {
  const wLen = waveLength(wave.start, wave.end)
  if (wLen === 0) return 0
  return waveLength(retrace.start, retrace.end) / wLen
}

// Calculate extension ratio relative to a base wave
export function extensionRatio(base, extended) {
  const baseLen = waveLength(base.start, base.end)
  if (baseLen === 0) return 0
  return waveLength(extended.start, extended.end) / baseLen
}

// ─── IMPULSE VALIDATION ────────────────────────────────────────────────────

export function validateImpulse(points) {
  // points: array of { label, price, time }
  // minimum: need at least W0 + W1 end to validate
  const results = []

  if (points.length < 2) return results

  const [p0, p1, p2, p3, p4, p5] = points
  const isBullish = p1 && p1.price > p0.price

  // Helper: get price at wave point
  const p = (idx) => points[idx]?.price

  // RULE 1: Wave 2 cannot retrace beyond start of Wave 1
  if (points.length >= 3 && p2) {
    const valid = isBullish
      ? p2.price > p0.price
      : p2.price < p0.price
    results.push({
      rule: 'Rule 1',
      label: 'Wave 2 tidak melewati awal Wave 1',
      status: valid ? 'valid' : 'invalid',
      detail: valid
        ? `Wave 2 (${p2.price.toFixed(0)}) di atas awal Wave 1 (${p0.price.toFixed(0)})`
        : `⚠️ Wave 2 (${p2.price.toFixed(0)}) melewati awal Wave 1 (${p0.price.toFixed(0)}) — VIOLATED`,
    })
  }

  // RULE 2: Wave 3 cannot be the shortest
  if (points.length >= 5 && p3 && p4) {
    const w1 = waveLength(points[0], points[1])
    const w3 = waveLength(points[2], points[3])
    const w5 = points.length >= 6 ? waveLength(points[4], points[5]) : null
    const valid = w5 ? (w3 >= w1 || w3 >= w5) : true
    const shortest = w5 ? Math.min(w1, w3, w5) : Math.min(w1, w3)
    results.push({
      rule: 'Rule 2',
      label: 'Wave 3 bukan yang terpendek',
      status: valid ? 'valid' : 'invalid',
      detail: valid
        ? `W3=${w3.toFixed(0)} bukan terpendek dari W1=${w1.toFixed(0)}${w5 ? ` dan W5=${w5.toFixed(0)}` : ''}`
        : `⚠️ Wave 3 (${w3.toFixed(0)}) adalah yang terpendek! W1=${w1.toFixed(0)}${w5 ? ` W5=${w5.toFixed(0)}` : ''} — VIOLATED`,
    })
  }

  // RULE 3: Wave 4 cannot overlap Wave 1 territory
  if (points.length >= 5 && p4) {
    const valid = isBullish
      ? p4.price > p1.price
      : p4.price < p1.price
    results.push({
      rule: 'Rule 3',
      label: 'Wave 4 tidak overlap area Wave 1',
      status: valid ? 'valid' : 'invalid',
      detail: valid
        ? `Wave 4 (${p4.price.toFixed(0)}) tidak masuk area Wave 1 (${p1.price.toFixed(0)})`
        : `⚠️ Wave 4 (${p4.price.toFixed(0)}) overlap dengan Wave 1 (${p1.price.toFixed(0)}) — VIOLATED`,
    })
  }

  return results
}

// ─── GUIDELINES (Fibonacci) ────────────────────────────────────────────────

export function getImpulseGuidelines(points) {
  const hints = []
  if (points.length < 2) return hints

  const [p0, p1, p2, p3, p4, p5] = points
  const isBullish = p1 && p1.price > p0.price

  // Wave 2 retracement of Wave 1
  if (p2 && p1) {
    const w1 = waveLength(points[0], points[1])
    const w2 = waveLength(points[1], points[2])
    const ratio = w1 > 0 ? w2 / w1 : 0
    const pct = (ratio * 100).toFixed(1)
    const inZone = ratio >= 0.382 && ratio <= 0.886
    hints.push({
      label: 'Wave 2 Retracement',
      value: `${pct}% dari Wave 1`,
      status: inZone ? 'valid' : 'warn',
      detail: 'Ideal: 50–78.6% | Ekstrem: 38.2–88.6%',
      targets: getFibTargets(p1.price, p0.price, [0.382, 0.5, 0.618, 0.786], isBullish ? 'down' : 'up'),
    })
  }

  // Wave 3 extension of Wave 1
  if (p3 && p2) {
    const w1 = waveLength(points[0], points[1])
    const w3 = waveLength(points[2], points[3])
    const ratio = w1 > 0 ? w3 / w1 : 0
    const pct = (ratio * 100).toFixed(1)
    const inZone = ratio >= 1.0
    hints.push({
      label: 'Wave 3 Extension',
      value: `${pct}% dari Wave 1`,
      status: inZone ? 'valid' : 'warn',
      detail: 'Ideal: 161.8% | Range: 127–261.8%',
      targets: getFibTargets(p2.price, p1.price, [1.0, 1.272, 1.618, 2.0, 2.618], isBullish ? 'up' : 'down'),
    })
  }

  // Wave 4 retracement of Wave 3
  if (p4 && p3) {
    const w3 = waveLength(points[2], points[3])
    const w4 = waveLength(points[3], points[4])
    const ratio = w3 > 0 ? w4 / w3 : 0
    const pct = (ratio * 100).toFixed(1)
    const inZone = ratio >= 0.236 && ratio <= 0.5
    hints.push({
      label: 'Wave 4 Retracement',
      value: `${pct}% dari Wave 3`,
      status: inZone ? 'valid' : 'warn',
      detail: 'Ideal: 23.6–50%',
      targets: getFibTargets(p3.price, p2.price, [0.236, 0.382, 0.5], isBullish ? 'down' : 'up'),
    })
  }

  // Wave 5 projection
  if (p5 && p4) {
    const w1 = waveLength(points[0], points[1])
    const w5 = waveLength(points[4], points[5])
    const ratio = w1 > 0 ? w5 / w1 : 0
    const pct = (ratio * 100).toFixed(1)
    const inZone = ratio >= 0.382 && ratio <= 1.618
    hints.push({
      label: 'Wave 5 Projection',
      value: `${pct}% dari Wave 1`,
      status: inZone ? 'valid' : 'warn',
      detail: 'Ideal: 61.8–100% dari W1',
      targets: getFibTargets(p4.price, p3.price, [0.618, 1.0, 1.272, 1.618], isBullish ? 'up' : 'down'),
    })
  }

  return hints
}

// ─── CORRECTIVE VALIDATION ────────────────────────────────────────────────

export function validateCorrective(points, pattern) {
  const results = []
  if (points.length < 2) return results

  const [pA_start, pA_end, pB_end, pC_end] = points

  if (pattern === 'ZIGZAG') {
    // B cannot retrace more than 61.8% of A
    if (pB_end && pA_end) {
      const wA = waveLength(pA_start, pA_end)
      const wB = waveLength(pA_end, pB_end)
      const ratio = wA > 0 ? wB / wA : 0
      const valid = ratio <= 0.618
      results.push({
        rule: 'Zigzag Rule',
        label: 'Wave B max 61.8% dari Wave A',
        status: valid ? 'valid' : 'invalid',
        detail: valid
          ? `B retrace ${(ratio * 100).toFixed(1)}% dari A ✓`
          : `⚠️ B retrace ${(ratio * 100).toFixed(1)}% — melebihi 61.8% (bukan zigzag murni)`,
      })
    }
    // C should equal or exceed A
    if (pC_end && pB_end) {
      const wA = waveLength(pA_start, pA_end)
      const wC = waveLength(pB_end, pC_end)
      const ratio = wA > 0 ? wC / wA : 0
      results.push({
        rule: 'Zigzag C Target',
        label: 'Wave C vs Wave A',
        status: ratio >= 0.618 ? 'valid' : 'warn',
        detail: `C = ${(ratio * 100).toFixed(1)}% dari A | Ideal: 100–161.8%`,
      })
    }
  }

  if (pattern === 'FLAT_REGULAR' || pattern === 'FLAT_EXPANDED' || pattern === 'FLAT_RUNNING') {
    if (pB_end && pA_end) {
      const wA = waveLength(pA_start, pA_end)
      const wB = waveLength(pA_end, pB_end)
      const ratio = wA > 0 ? wB / wA : 0
      const pct = (ratio * 100).toFixed(1)

      if (pattern === 'FLAT_REGULAR') {
        const valid = ratio >= 0.9 && ratio <= 1.05
        results.push({
          rule: 'Flat Regular Rule',
          label: 'Wave B ≈ awal Wave A (90–105%)',
          status: valid ? 'valid' : 'warn',
          detail: `B = ${pct}% dari A`,
        })
      }
      if (pattern === 'FLAT_EXPANDED') {
        const valid = ratio > 1.0
        results.push({
          rule: 'Flat Expanded Rule',
          label: 'Wave B > awal Wave A (>100%)',
          status: valid ? 'valid' : 'warn',
          detail: valid ? `B = ${pct}% dari A ✓ (expanded)` : `B = ${pct}% — belum melewati awal A`,
        })
      }
      if (pattern === 'FLAT_RUNNING') {
        const valid = ratio > 1.0
        results.push({
          rule: 'Flat Running Rule',
          label: 'Wave B > awal Wave A, C tidak capai akhir A',
          status: valid ? 'valid' : 'warn',
          detail: `B = ${pct}% dari A — tren sangat kuat`,
        })
      }
    }
  }

  if (pattern === 'TRIANGLE_CONTRACTING' || pattern === 'TRIANGLE_EXPANDING') {
    results.push({
      rule: 'Triangle Info',
      label: 'Segitiga butuh 5 sub-wave (A-B-C-D-E)',
      status: 'info',
      detail: 'Muncul di Wave 4 atau Wave B. Thrust setelah E biasanya ≈ lebar terlebar triangle.',
    })
  }

  return results
}

// ─── FIBONACCI TARGET CALCULATOR ──────────────────────────────────────────

export function getFibTargets(startPrice, refPrice, levels, direction) {
  const range = Math.abs(startPrice - refPrice)
  return levels.map(level => {
    const target = direction === 'up'
      ? startPrice + range * level
      : startPrice - range * level
    return { level, price: target }
  })
}

export function getNextWaveTargets(points, mode) {
  if (!points || points.length < 2) return []

  const last = points[points.length - 1]
  const prev = points[points.length - 2]
  const isBullish = points[1]?.price > points[0]?.price

  if (mode === 'impulse') {
    const waveCount = points.length - 1 // number of completed waves

    if (waveCount === 1) {
      // Predicting Wave 2: retracement of Wave 1
      return getFibTargets(last.price, prev.price, [0.382, 0.5, 0.618, 0.786], isBullish ? 'down' : 'up')
        .map(t => ({ ...t, label: `W2 target (${(t.level * 100).toFixed(1)}%)` }))
    }
    if (waveCount === 2) {
      // Predicting Wave 3: extension of Wave 1
      const w1Range = Math.abs(points[1].price - points[0].price)
      return [1.272, 1.618, 2.0, 2.618].map(level => ({
        level,
        price: isBullish ? last.price + w1Range * level : last.price - w1Range * level,
        label: `W3 target (${(level * 100).toFixed(1)}%)`,
      }))
    }
    if (waveCount === 3) {
      // Predicting Wave 4: retracement of Wave 3
      return getFibTargets(last.price, prev.price, [0.236, 0.382, 0.5], isBullish ? 'down' : 'up')
        .map(t => ({ ...t, label: `W4 target (${(t.level * 100).toFixed(1)}%)` }))
    }
    if (waveCount === 4) {
      // Predicting Wave 5: projection based on Wave 1
      const w1Range = Math.abs(points[1].price - points[0].price)
      return [0.618, 1.0, 1.272].map(level => ({
        level,
        price: isBullish ? last.price + w1Range * level : last.price - w1Range * level,
        label: `W5 target (${(level * 100).toFixed(1)}% of W1)`,
      }))
    }
  }

  if (mode === 'corrective') {
    const waveCount = points.length - 1
    if (waveCount === 1) {
      return getFibTargets(last.price, prev.price, [0.382, 0.5, 0.618], isBullish ? 'down' : 'up')
        .map(t => ({ ...t, label: `WB target (${(t.level * 100).toFixed(1)}%)` }))
    }
    if (waveCount === 2) {
      const wARange = Math.abs(points[1].price - points[0].price)
      return [0.618, 1.0, 1.272, 1.618].map(level => ({
        level,
        price: isBullish ? last.price - wARange * level : last.price + wARange * level,
        label: `WC target (${(level * 100).toFixed(1)}% of WA)`,
      }))
    }
  }

  return []
}

// ─── ALTERNATION CHECK ────────────────────────────────────────────────────

export function checkAlternation(points) {
  if (points.length < 5) return null

  const [p0, p1, p2, p3, p4] = points
  const w2Range = waveLength(p1, p2)
  const w4Range = waveLength(p3, p4)
  const w2Pct = waveLength(p0, p1) > 0 ? w2Range / waveLength(p0, p1) : 0
  const w4Pct = waveLength(p2, p3) > 0 ? w4Range / waveLength(p2, p3) : 0

  const w2Sharp = w2Pct >= 0.5  // deep = sharp
  const w4Sharp = w4Pct >= 0.5

  if (w2Sharp && !w4Sharp) {
    return { status: 'valid', message: 'Alternation OK: W2 tajam (zigzag) → W4 datar (flat) ✓' }
  }
  if (!w2Sharp && w4Sharp) {
    return { status: 'valid', message: 'Alternation OK: W2 datar → W4 tajam ✓' }
  }
  return {
    status: 'warn',
    message: `Alternation kurang jelas: W2=${(w2Pct * 100).toFixed(0)}% W4=${(w4Pct * 100).toFixed(0)}%`,
  }
}

// ─── OVERALL VALIDATION SUMMARY ──────────────────────────────────────────

export function getValidationSummary(rules) {
  const invalid = rules.filter(r => r.status === 'invalid').length
  const warn = rules.filter(r => r.status === 'warn').length
  const valid = rules.filter(r => r.status === 'valid').length

  if (invalid > 0) return { status: 'invalid', label: `${invalid} Rules Violated`, color: 'red' }
  if (warn > 0) return { status: 'warn', label: `${warn} Guidelines Missed`, color: 'accent' }
  if (valid > 0) return { status: 'valid', label: 'All Rules Passed', color: 'green' }
  return { status: 'idle', label: 'Mark wave points to validate', color: 'muted' }
}
