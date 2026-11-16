import { useEffect, useState } from 'react'
import CageList from './components/CageList.jsx'
import LogView from './components/LogView.jsx'
import ThresholdsView from './components/ThresholdsView.jsx'
import BiomassView from './components/BiomassView.jsx'
import DataView from './components/DataView.jsx'
import { buildDemo, emptyState, loadState, saveState, uid } from './lib.js'

const TABS = [
  { key: 'log', label: 'Günlük' },
  { key: 'thresholds', label: 'Eşikler' },
  { key: 'biomass', label: 'Biyokütle' },
  { key: 'data', label: 'Veri' },
]

export default function App() {
  const [state, setState] = useState(loadState)
  const [tab, setTab] = useState('log')
  const [selectedId, setSelectedId] = useState(() => state.cages[0]?.id ?? null)
  const [saveFailed, setSaveFailed] = useState(false)

  useEffect(() => {
    setSaveFailed(!saveState(state))
  }, [state])

  // Seçili kafes silinirse ilk kafese geç.
  useEffect(() => {
    if (!state.cages.some((c) => c.id === selectedId)) setSelectedId(state.cages[0]?.id ?? null)
  }, [state.cages, selectedId])

  const selected = state.cages.find((c) => c.id === selectedId) || null

  const addCage = ({ name, species }) => {
    const cage = { id: uid(), name, species, createdAt: Date.now() }
    setState((s) => ({ ...s, cages: [...s.cages, cage] }))
    setSelectedId(cage.id)
  }
  const deleteCage = (id) =>
    setState((s) => ({ ...s, cages: s.cages.filter((c) => c.id !== id), logs: s.logs.filter((l) => l.cageId !== id) }))
  const addLog = (log) => setState((s) => ({ ...s, logs: [...s.logs, { ...log, id: uid(), createdAt: Date.now() }] }))
  const deleteLog = (id) => setState((s) => ({ ...s, logs: s.logs.filter((l) => l.id !== id) }))

  const loadDemo = () => {
    const { cage, logs } = buildDemo()
    setState((s) => ({ ...s, cages: [...s.cages, cage], logs: [...s.logs, ...logs] }))
    setSelectedId(cage.id)
    setTab('log')
  }
  const removeDemo = () =>
    setState((s) => {
      const demoIds = new Set(s.cages.filter((c) => c.demo).map((c) => c.id))
      return { ...s, cages: s.cages.filter((c) => !c.demo), logs: s.logs.filter((l) => !demoIds.has(l.cageId)) }
    })

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="" className="h-9 w-9" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">Kafes Defteri</h1>
              <p className="text-xs text-slate-500">Balık çiftliği için günlük su kalitesi, yem ve ölüm kaydı</p>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto" aria-label="Bölümler">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-current={tab === t.key ? 'page' : undefined}
                className={
                  'whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ' +
                  (tab === t.key ? 'bg-cyan-700 text-white' : 'text-slate-700 hover:bg-slate-100')
                }
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {saveFailed && (
        <div className="bg-red-50 px-4 py-2 text-center text-sm text-red-800">
          Veriler tarayıcıya kaydedilemedi (LocalStorage kapalı ya da dolu). Sayfayı kapatmadan önce “Veri” sekmesinden JSON yedeği alın.
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6">
        {tab === 'log' && (
          <div className="grid gap-4 *:min-w-0 lg:grid-cols-[300px_1fr]">
            <CageList
              cages={state.cages}
              logs={state.logs}
              thresholds={state.thresholds}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onAdd={addCage}
              onDelete={deleteCage}
            />
            {selected ? (
              <LogView
                key={selected.id}
                cage={selected}
                logs={state.logs}
                thresholds={state.thresholds}
                onAddLog={addLog}
                onDeleteLog={deleteLog}
              />
            ) : (
              <div className="card flex min-h-[200px] items-center justify-center text-center text-sm text-slate-500">
                Kayıt girmek için soldan bir kafes ekleyin ya da seçin.
              </div>
            )}
          </div>
        )}
        {tab === 'thresholds' && (
          <ThresholdsView thresholds={state.thresholds} onSave={(thresholds) => setState((s) => ({ ...s, thresholds }))} />
        )}
        {tab === 'biomass' && (
          <BiomassView lengthWeight={state.lengthWeight} onSaveCoefficients={(lengthWeight) => setState((s) => ({ ...s, lengthWeight }))} />
        )}
        {tab === 'data' && (
          <DataView
            state={state}
            onLoadDemo={loadDemo}
            onRemoveDemo={removeDemo}
            onImport={(next) => setState(next)}
            onClear={() => setState(emptyState())}
          />
        )}
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-8 text-xs text-slate-400">
        Veriler yalnızca bu tarayıcıda (LocalStorage) saklanır. Eşik ve katsayılar kullanıcı tarafından girilir; uygulama
        veteriner ya da uzman görüşünün yerini tutmaz.
      </footer>
    </div>
  )
}
