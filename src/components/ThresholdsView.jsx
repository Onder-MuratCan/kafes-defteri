import { useState } from 'react'
import { PARAMS, parseNum } from '../lib.js'

const toText = (v) => (v === null || v === undefined ? '' : String(v).replace('.', ','))

export default function ThresholdsView({ thresholds, onSave }) {
  const [form, setForm] = useState(() =>
    Object.fromEntries(PARAMS.map((p) => [p.key, { min: toText(thresholds[p.key].min), max: toText(thresholds[p.key].max) }])),
  )
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)

  function set(key, side, value) {
    setForm({ ...form, [key]: { ...form[key], [side]: value } })
    setSaved(false)
  }

  function submit(e) {
    e.preventDefault()
    const next = {}
    const out = {}
    for (const p of PARAMS) {
      const min = parseNum(form[p.key].min)
      const max = parseNum(form[p.key].max)
      if (Number.isNaN(min) || Number.isNaN(max)) next[p.key] = 'Sayı girin ya da boş bırakın.'
      else if (min !== null && max !== null && min > max) next[p.key] = 'Alt eşik üst eşikten büyük olamaz.'
      out[p.key] = { min, max }
    }
    setErrors(next)
    if (Object.keys(next).length) return
    onSave(out)
    setSaved(true)
  }

  return (
    <form onSubmit={submit} className="card max-w-3xl" noValidate>
      <h2 className="text-lg font-semibold text-slate-900">Uyarı eşikleri</h2>
      <p className="mt-1 text-sm text-slate-600">
        Eşikler bilerek boş gelir. Uygun aralıklar türe, yaşa, su kaynağına ve mevsime göre değişir; değerleri
        kendi veteriner hekiminizin, yem üreticinizin ya da güvendiğiniz bir kaynağın önerisine göre girin.
        Boş bırakılan sınır için uyarı üretilmez.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="text-left text-xs text-slate-600">
            <tr>
              <th className="py-2 font-medium">Ölçüm</th>
              <th className="py-2 font-medium">Alt sınır</th>
              <th className="py-2 font-medium">Üst sınır</th>
            </tr>
          </thead>
          <tbody>
            {PARAMS.map((p) => (
              <tr key={p.key} className="border-t border-slate-100 align-top">
                <td className="py-2 pr-3 text-slate-800">
                  {p.label}
                  {p.unit && <span className="text-slate-400"> ({p.unit})</span>}
                  {errors[p.key] && <div className="text-xs text-red-700">{errors[p.key]}</div>}
                </td>
                <td className="py-2 pr-3">
                  <input
                    className="input"
                    inputMode="decimal"
                    aria-label={`${p.label} alt sınır`}
                    value={form[p.key].min}
                    onChange={(e) => set(p.key, 'min', e.target.value)}
                    placeholder="yok"
                  />
                </td>
                <td className="py-2">
                  <input
                    className="input"
                    inputMode="decimal"
                    aria-label={`${p.label} üst sınır`}
                    value={form[p.key].max}
                    onChange={(e) => set(p.key, 'max', e.target.value)}
                    placeholder="yok"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button type="submit" className="btn-primary">Eşikleri kaydet</button>
        {saved && <span className="text-sm text-emerald-700">Kaydedildi.</span>}
      </div>
    </form>
  )
}
