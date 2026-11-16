import { formatDate, formatNum } from '../lib.js'

// Bağımlılıksız, basit SVG çizgi grafiği. Eşikler kesikli çizgiyle gösterilir.
export default function TrendChart({ points, param, threshold }) {
  const data = points.filter((p) => typeof p.value === 'number' && Number.isFinite(p.value))

  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">
        Bu ölçüm için henüz kayıt yok.
      </div>
    )
  }

  const W = 640
  const H = 240
  const pad = { l: 48, r: 16, t: 16, b: 32 }
  const iw = W - pad.l - pad.r
  const ih = H - pad.t - pad.b

  const lines = [threshold?.min, threshold?.max].filter((v) => v !== null && v !== undefined)
  const values = [...data.map((d) => d.value), ...lines]
  let lo = Math.min(...values)
  let hi = Math.max(...values)
  if (lo === hi) {
    lo -= 1
    hi += 1
  }
  const margin = (hi - lo) * 0.1
  lo -= margin
  hi += margin

  const x = (i) => pad.l + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw)
  const y = (v) => pad.t + ih - ((v - lo) / (hi - lo)) * ih

  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(' ')
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => lo + (hi - lo) * t)
  const unit = param.unit ? ` ${param.unit}` : ''

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`${param.label} trend grafiği`}
    >
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#e2e8f0" />
          <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#64748b">
            {formatNum(t, 1)}
          </text>
        </g>
      ))}

      {threshold?.min !== null && threshold?.min !== undefined && (
        <ThresholdLine y={y(threshold.min)} x1={pad.l} x2={W - pad.r} label={`alt ${formatNum(threshold.min)}`} />
      )}
      {threshold?.max !== null && threshold?.max !== undefined && (
        <ThresholdLine y={y(threshold.max)} x1={pad.l} x2={W - pad.r} label={`üst ${formatNum(threshold.max)}`} />
      )}

      <path d={path} fill="none" stroke="#0e7490" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <circle
          key={d.id}
          cx={x(i)}
          cy={y(d.value)}
          r="4"
          fill={d.alert ? '#dc2626' : '#0e7490'}
          stroke="#fff"
          strokeWidth="1.5"
        >
          <title>{`${formatDate(d.date)}: ${formatNum(d.value)}${unit}`}</title>
        </circle>
      ))}

      <text x={pad.l} y={H - 8} fontSize="11" fill="#64748b">
        {formatDate(data[0].date)}
      </text>
      {data.length > 1 && (
        <text x={W - pad.r} y={H - 8} textAnchor="end" fontSize="11" fill="#64748b">
          {formatDate(data[data.length - 1].date)}
        </text>
      )}
    </svg>
  )
}

function ThresholdLine({ y, x1, x2, label }) {
  return (
    <g>
      <line x1={x1} x2={x2} y1={y} y2={y} stroke="#dc2626" strokeDasharray="6 4" strokeWidth="1.5" />
      <text x={x2 - 4} y={y - 4} textAnchor="end" fontSize="11" fill="#dc2626">
        {label}
      </text>
    </g>
  )
}
