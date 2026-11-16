import { useRef, useState } from 'react'
import { normalizeState, todayISO } from '../lib.js'

export default function DataView({ state, onLoadDemo, onRemoveDemo, onImport, onClear }) {
  const fileRef = useRef(null)
  const [msg, setMsg] = useState('')
  const hasDemo = state.cages.some((c) => c.demo)

  function exportJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kafes-defteri-${todayISO()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importJson(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = normalizeState(JSON.parse(String(reader.result)))
        if (!confirm(`${parsed.cages.length} kafes ve ${parsed.logs.length} kayıt içe aktarılacak. Mevcut veriler silinecek. Devam edilsin mi?`)) return
        onImport(parsed)
        setMsg('İçe aktarıldı.')
      } catch {
        setMsg('Dosya okunamadı: geçerli bir Kafes Defteri JSON dosyası seçin.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="grid max-w-4xl gap-4 md:grid-cols-2">
      <div className="card">
        <h2 className="font-semibold text-slate-900">Demo verisi</h2>
        <p className="mt-1 text-sm text-slate-600">
          Uygulamayı denemek için 14 günlük uydurma kayıtlarla bir “Demo Kafes” ekler. Demo kayıtlar her yerde
          <span className="mx-1 rounded bg-violet-100 px-1 text-[11px] font-semibold uppercase text-violet-800">Demo</span>
          etiketiyle gösterilir ve gerçek ölçüm değildir.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={onLoadDemo} disabled={hasDemo}>
            Demo verisi yükle
          </button>
          <button type="button" className="btn-ghost" onClick={onRemoveDemo} disabled={!hasDemo}>
            Demo verisini kaldır
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-slate-900">Yedekleme</h2>
        <p className="mt-1 text-sm text-slate-600">
          Veriler yalnızca bu tarayıcının LocalStorage alanında durur. Başka cihaza taşımak ya da yedek almak için
          JSON olarak dışa aktarın.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={exportJson}>JSON dışa aktar</button>
          <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()}>JSON içe aktar</button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={importJson} />
        </div>
        {msg && <p className="mt-2 text-sm text-slate-700">{msg}</p>}
      </div>

      <div className="card md:col-span-2">
        <h2 className="font-semibold text-slate-900">Tüm verileri sil</h2>
        <p className="mt-1 text-sm text-slate-600">Kafesler, kayıtlar, eşikler ve katsayılar silinir. Geri alınamaz.</p>
        <button
          type="button"
          className="btn mt-3 border border-red-300 text-red-700 hover:bg-red-50"
          onClick={() => {
            if (confirm('Tüm veriler kalıcı olarak silinsin mi? Bu işlem geri alınamaz.')) onClear()
          }}
        >
          Tüm verileri sil
        </button>
      </div>
    </div>
  )
}
