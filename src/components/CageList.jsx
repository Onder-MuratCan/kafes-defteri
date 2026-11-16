import { useState } from 'react'
import { AlertList, DemoBadge } from './Badges.jsx'
import { alertsForLog, formatDate, sortLogs } from '../lib.js'

export default function CageList({ cages, logs, thresholds, selectedId, onSelect, onAdd, onDelete }) {
  const [name, setName] = useState('')
  const [species, setSpecies] = useState('')
  const [error, setError] = useState('')

  function submit(e) {
    e.preventDefault()
    const n = name.trim()
    if (!n) {
      setError('Kafes adı boş olamaz.')
      return
    }
    if (cages.some((c) => c.name.toLocaleLowerCase('tr') === n.toLocaleLowerCase('tr'))) {
      setError('Bu adla bir kafes zaten var.')
      return
    }
    onAdd({ name: n, species: species.trim() })
    setName('')
    setSpecies('')
    setError('')
  }

  return (
    <div className="card">
      <h2 className="mb-3 text-base font-semibold text-slate-800">Kafesler</h2>

      <form onSubmit={submit} className="mb-4 space-y-2" noValidate>
        <div>
          <label className="label" htmlFor="cage-name">Kafes adı</label>
          <input id="cage-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="ör. K-3" maxLength={40} />
        </div>
        <div>
          <label className="label" htmlFor="cage-species">Tür (isteğe bağlı)</label>
          <input id="cage-species" className="input" value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="ör. levrek" maxLength={40} />
        </div>
        {error && <p className="text-xs text-red-700">{error}</p>}
        <button type="submit" className="btn-primary w-full">+ Kafes ekle</button>
      </form>

      {cages.length === 0 ? (
        <p className="text-sm text-slate-500">Henüz kafes yok. Yukarıdan ekleyin ya da “Veri” sekmesinden demo verisi yükleyin.</p>
      ) : (
        <ul className="space-y-2">
          {cages.map((c) => {
            const cageLogs = sortLogs(logs.filter((l) => l.cageId === c.id))
            const last = cageLogs[cageLogs.length - 1]
            const alerts = last ? alertsForLog(last, thresholds) : []
            const active = c.id === selectedId
            return (
              <li key={c.id}>
                <div
                  className={
                    'rounded-lg border p-3 transition ' +
                    (active ? 'border-cyan-600 bg-cyan-50' : 'border-slate-200 hover:border-slate-300')
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onSelect(c.id)}>
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-slate-900">{c.name}</span>
                        {c.demo && <DemoBadge />}
                      </div>
                      <div className="text-xs text-slate-500">
                        {c.species || 'Tür belirtilmedi'} · {cageLogs.length} kayıt
                        {last && ` · son ${formatDate(last.date)}`}
                      </div>
                    </button>
                    <button
                      type="button"
                      className="btn-danger px-2 py-1 text-xs"
                      onClick={() => {
                        if (confirm(`"${c.name}" kafesi ve ${cageLogs.length} kaydı silinsin mi?`)) onDelete(c.id)
                      }}
                      aria-label={`${c.name} kafesini sil`}
                    >
                      Sil
                    </button>
                  </div>
                  {alerts.length > 0 && (
                    <div className="mt-2">
                      <AlertList alerts={alerts} />
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
