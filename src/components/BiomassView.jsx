import { useState } from 'react'
import { formatNum, parseLengths, parseNum, weightFromLength } from '../lib.js'

const toText = (v) => (v === null || v === undefined ? '' : String(v).replace('.', ','))

export default function BiomassView({ lengthWeight, onSaveCoefficients }) {
  const [a, setA] = useState(toText(lengthWeight.a))
  const [b, setB] = useState(toText(lengthWeight.b))
  const [lengths, setLengths] = useState('')
  const [count, setCount] = useState('')
  const [saved, setSaved] = useState(false)

  const aNum = parseNum(a)
  const bNum = parseNum(b)
  const nNum = parseNum(count)
  const { values, invalid } = parseLengths(lengths)

  const coefOk = typeof aNum === 'number' && aNum > 0 && typeof bNum === 'number' && Number.isFinite(bNum)
  const countOk = nNum === null || (Number.isInteger(nNum) && nNum >= 0)

  const weights = coefOk ? values.map((L) => weightFromLength(L, aNum, bNum)) : []
  const meanW = weights.length ? weights.reduce((s, w) => s + w, 0) / weights.length : null
  const meanL = values.length ? values.reduce((s, v) => s + v, 0) / values.length : null
  const total = meanW !== null && typeof nNum === 'number' && countOk ? (meanW * nNum) / 1000 : null

  return (
    <div className="grid max-w-5xl gap-4 lg:grid-cols-2">
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-900">Boy-ağırlık biyokütle hesabı</h2>
        <p className="mt-1 text-sm text-slate-600">
          Balıkçılık biyolojisinde kullanılan boy-ağırlık ilişkisi:
        </p>
        <p className="my-3 rounded-lg bg-slate-50 py-3 text-center font-mono text-lg text-slate-900">
          W = a · L<sup>b</sup>
        </p>
        <p className="text-sm text-slate-600">
          <b>a</b> ve <b>b</b> türe ve popülasyona özgüdür; bu uygulama varsayılan katsayı vermez. Değerleri kendi
          tartım-ölçüm verinizden (log W = log a + b · log L regresyonu) ya da türünüz için yayımlanmış bir
          kaynaktan girin. Burada <b>L santimetre</b>, <b>W gram</b> kabul edilir; katsayıların bu birimlerle
          hesaplandığından emin olun.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="label">a katsayısı</span>
            <input className="input" inputMode="decimal" value={a} onChange={(e) => { setA(e.target.value); setSaved(false) }} placeholder="kaynağınızdan girin" />
          </label>
          <label className="block">
            <span className="label">b katsayısı</span>
            <input className="input" inputMode="decimal" value={b} onChange={(e) => { setB(e.target.value); setSaved(false) }} placeholder="kaynağınızdan girin" />
          </label>
        </div>
        {(Number.isNaN(aNum) || Number.isNaN(bNum) || (aNum !== null && aNum <= 0)) && (
          <p className="mt-2 text-xs text-red-700">a pozitif bir sayı, b bir sayı olmalı.</p>
        )}
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            className="btn-ghost"
            disabled={!coefOk}
            onClick={() => {
              onSaveCoefficients({ a: aNum, b: bNum })
              setSaved(true)
            }}
          >
            Katsayıları kaydet
          </button>
          {saved && <span className="text-sm text-emerald-700">Kaydedildi.</span>}
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-slate-800">Örneklem ve sonuç</h3>
        <label className="mt-3 block">
          <span className="label">Örnek balık boyları (cm): boşluk, satır sonu ya da “;” ile ayırın</span>
          <textarea className="input h-28 font-mono" value={lengths} onChange={(e) => setLengths(e.target.value)} placeholder={'24,5\n25,1\n26'} />
        </label>
        {invalid.length > 0 && <p className="mt-1 text-xs text-red-700">Okunamayan değerler: {invalid.join(', ')}</p>}
        <label className="mt-3 block">
          <span className="label">Kafesteki tahmini balık sayısı (adet)</span>
          <input className="input" inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} placeholder="ör. 12000" />
        </label>
        {!countOk && <p className="mt-1 text-xs text-red-700">Balık sayısı negatif olmayan bir tam sayı olmalı.</p>}

        <dl className="mt-4 grid grid-cols-2 gap-3">
          <Result label="Ölçülen balık" value={values.length ? `${values.length} adet` : '–'} />
          <Result label="Ortalama boy" value={meanL !== null ? `${formatNum(meanL, 1)} cm` : '–'} />
          <Result label="Ortalama ağırlık" value={meanW !== null ? `${formatNum(meanW, 1)} g` : '–'} />
          <Result label="Toplam biyokütle" value={total !== null ? `${formatNum(total, 1)} kg` : '–'} highlight />
        </dl>
        {!coefOk && <p className="mt-3 text-xs text-slate-500">Sonuç için önce a ve b katsayılarını girin.</p>}
        <p className="mt-3 text-xs text-slate-500">
          Ortalama ağırlık, her balığın ağırlığı ayrı hesaplanıp ortalaması alınarak bulunur (ortalama boyun ağırlığı
          değil, çünkü ilişki doğrusal değildir). Sonuç bir tahmindir; örneklem küçükse ve kafes karışık boyluysa hata büyür.
        </p>
      </div>
    </div>
  )
}

function Result({ label, value, highlight }) {
  return (
    <div className={'rounded-lg p-3 ' + (highlight ? 'bg-cyan-50' : 'bg-slate-50')}>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={'text-lg font-semibold ' + (highlight ? 'text-cyan-800' : 'text-slate-900')}>{value}</dd>
    </div>
  )
}
