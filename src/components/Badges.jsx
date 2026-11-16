import { paramByKey } from '../lib.js'

export function StatusBadge({ status }) {
  if (status === 'low') return <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">Düşük</span>
  if (status === 'high') return <span className="rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-semibold text-red-800">Yüksek</span>
  return null
}

export function DemoBadge() {
  return (
    <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violet-800">
      Demo
    </span>
  )
}

export function AlertList({ alerts }) {
  if (!alerts.length) return null
  return (
    <div className="flex flex-wrap gap-1">
      {alerts.map((a) => (
        <span
          key={a.key}
          className={
            'rounded-full px-2 py-0.5 text-[11px] font-semibold ' +
            (a.status === 'high' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800')
          }
        >
          {paramByKey[a.key].label} {a.status === 'high' ? '↑' : '↓'}
        </span>
      ))}
    </div>
  )
}
