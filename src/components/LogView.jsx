import { useMemo, useState } from 'react'
import TrendChart from './TrendChart.jsx'
import { AlertList, DemoBadge, StatusBadge } from './Badges.jsx'
import { PARAMS, alertsForLog, evaluate, formatDate, formatNum, paramByKey, parseNum, sortLogs, todayISO } from '../lib.js'

const emptyForm = () => ({ date: todayISO(), temp: '', ph: '', do: '', feedKg: '', mortality: '', note: '' })

export default function LogView({ cage, logs, thresholds, onAddLog, onDeleteLog }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [chartKey, setChartKey] = useState('temp')

  const cageLogs = useMemo(() => sortLogs(logs.filter((l) => l.cageId === cage.id)), [logs, cage.id])
  const hasThresholds = PARAMS.some((p) => thresholds[p.key].min !== null || thresholds[p.key].max !== null)

  function submit(e) {
    e.preventDefault()
    const next = {}
    const values = {}
    if (!form.date) next.date = 'Tarih gerekli.'
    for (const p of PARAMS) {
      const v = parseNum(form[p.key])
      if (Number.isNaN(v)) next[p.key] = 'Sayı girin.'
      else if (v !== null && p.key !== 'temp' && v < 0) next[p.key] = 'Negatif olamaz.'
      else if (v !== null && p.key === 'ph' && v > 14) next[p.key] = 'pH 0–14 arasıdır.'
      else if (v !== null && p.key === 'mortality' && !Number.isInteger(v)) next[p.key] = 'Tam sayı girin.'
      values[p.key] = v
    }
    if (!next.date && PARAMS.every((p) => values[p.key] === null)) next.form = 'En az bir ölçüm girin.'
    setErrors(next)
    if (Object.keys(next).length) return
    onAddLog({ cageId: cage.id, date: form.date, note: form.note.trim(), ...values })
    setForm({ ...emptyForm(), date: form.date })
  }

  const param = paramByKey[chartKey]
  const points = cageLogs.map((l) => ({
    id: l.id,
    date: l.date,
    value: l[chartKey],
    alert: ['low', 'high'].includes(evaluate(l[chartKey], thresholds[chartKey])),
  }))

  const totalFeed = cageLogs.reduce((s, l) => s + (l.feedKg || 0), 0)
  const totalMort = cageLogs.reduce((s, l) => s + (l.mortality || 0), 0)
  const alertDays = cageLogs.filter((l) => alertsForLog(l, thresholds).length > 0).length

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900">{cage.name}</h2>
          {cage.demo && <DemoBadge />}
          {cage.species && <span className="text-sm text-slate-500">· {cage.species}</span>}
        </div>
        {cage.note && <p className="mt-1 text-sm text-violet-800">{cage.note}</p>}
        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Kayıt" value={cageLogs.length} />
          <Stat label="Toplam yem" value={`${formatNum(totalFeed, 1)} kg`} />
          <Stat label="Toplam ölüm" value={`${formatNum(totalMort, 0)} adet`} />
          <Stat label="Uyarılı gün" value={hasThresholds ? alertDays : '–'} hint={hasThresholds ? '' : 'eşik yok'} />
        </dl>
      </div>

      <form onSubmit={submit} className="card" noValidate>
        <h3 className="mb-3 font-semibold text-slate-800">Günlük kayıt ekle</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Field label="Tarih" error={errors.date}>
            <input type="date" className="input" value={form.date} max={todayISO()} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          {PARAMS.map((p) => (
            <Field key={p.key} label={`${p.label}${p.unit ? ` (${p.unit})` : ''}`} error={errors[p.key]}>
              <input
                inputMode="decimal"
                className="input"
                value={form[p.key]}
                onChange={(e) => setForm({ ...form, [p.key]: e.target.value })}
                placeholder="–"
              />
            </Field>
          ))}
        </div>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="label" htmlFor="log-note">Not (isteğe bağlı)</label>
            <input id="log-note" className="input" value={form.note} maxLength={200} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="ör. ağ değişimi yapıldı" />
          </div>
          <button type="submit" className="btn-primary sm:w-40">Kaydet</button>
        </div>
        {errors.form && <p className="mt-2 text-xs text-red-700">{errors.form}</p>}
        <p className="mt-2 text-xs text-slate-500">Ondalık için virgül ya da nokta kullanabilirsiniz. Boş bırakılan ölçüm kaydedilmez.</p>
      </form>

      <div className="card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-slate-800">Trend</h3>
          <div className="flex flex-wrap gap-1" role="tablist" aria-label="Grafikte gösterilecek ölçüm">
            {PARAMS.map((p) => (
              <button
                key={p.key}
                type="button"
                role="tab"
                aria-selected={chartKey === p.key}
                onClick={() => setChartKey(p.key)}
                className={
                  'rounded-full px-3 py-1 text-xs font-medium ' +
                  (chartKey === p.key ? 'bg-cyan-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
                }
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <TrendChart points={points} param={param} threshold={thresholds[chartKey]} />
        <p className="mt-2 text-xs text-slate-500">
          {thresholds[chartKey].min === null && thresholds[chartKey].max === null
            ? 'Bu ölçüm için eşik tanımlı değil. “Eşikler” sekmesinden ekleyebilirsiniz.'
            : 'Kırmızı noktalar eşik dışındaki ölçümlerdir; kesikli çizgiler eşiklerdir.'}
        </p>
      </div>

      <div className="card overflow-hidden p-0">
        <h3 className="px-4 pt-4 font-semibold text-slate-800">Kayıtlar</h3>
        {cageLogs.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Bu kafes için henüz kayıt yok.</p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-600">
                <tr>
                  <th className="px-4 py-2 font-medium">Tarih</th>
                  {PARAMS.map((p) => (
                    <th key={p.key} className="px-2 py-2 font-medium">
                      {p.label}
                      {p.unit && <span className="font-normal text-slate-400"> {p.unit}</span>}
                    </th>
                  ))}
                  <th className="px-2 py-2 font-medium">Uyarı</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {[...cageLogs].reverse().map((l) => (
                  <tr key={l.id} className="border-t border-slate-100 align-top">
                    <td className="whitespace-nowrap px-4 py-2 text-slate-700">
                      {formatDate(l.date)}
                      {l.demo && <span className="ml-1"><DemoBadge /></span>}
                      {l.note && !l.demo && <div className="max-w-[12rem] truncate text-xs text-slate-500" title={l.note}>{l.note}</div>}
                    </td>
                    {PARAMS.map((p) => (
                      <td key={p.key} className="whitespace-nowrap px-2 py-2 text-slate-800">
                        {formatNum(l[p.key])} <StatusBadge status={evaluate(l[p.key], thresholds[p.key])} />
                      </td>
                    ))}
                    <td className="px-2 py-2">
                      <AlertList alerts={alertsForLog(l, thresholds)} />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button
                        type="button"
                        className="btn-danger px-2 py-1 text-xs"
                        onClick={() => {
                          if (confirm(`${formatDate(l.date)} tarihli kayıt silinsin mi?`)) onDeleteLog(l.id)
                        }}
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-700">{error}</span>}
    </label>
  )
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-lg font-semibold text-slate-900">
        {value} {hint && <span className="text-xs font-normal text-slate-400">({hint})</span>}
      </dd>
    </div>
  )
}
