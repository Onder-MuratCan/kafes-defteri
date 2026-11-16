// Kafes Defteri: veri modeli, doğrulama ve yardımcı fonksiyonlar.

export const STORAGE_KEY = 'kafes-defteri:v1'

// Günlük kayıtta tutulan ölçümler. Eşikler bu anahtarlar üzerinden tanımlanır.
export const PARAMS = [
  { key: 'temp', label: 'Sıcaklık', unit: '°C', step: '0.1' },
  { key: 'ph', label: 'pH', unit: '', step: '0.01' },
  { key: 'do', label: 'Çözünmüş oksijen', unit: 'mg/L', step: '0.1' },
  { key: 'feedKg', label: 'Yem', unit: 'kg', step: '0.1' },
  { key: 'mortality', label: 'Ölüm', unit: 'adet', step: '1' },
]

export const paramByKey = Object.fromEntries(PARAMS.map((p) => [p.key, p]))

// Bilerek boş başlar: kaynağı doğrulanmamış varsayılan eşik konmaz.
// Kullanıcı kendi türü ve işletmesi için geçerli değerleri girer.
export function emptyThresholds() {
  return Object.fromEntries(PARAMS.map((p) => [p.key, { min: null, max: null }]))
}

export function emptyState() {
  return {
    cages: [],
    logs: [],
    thresholds: emptyThresholds(),
    // W = a · L^b katsayıları da boş başlar.
    lengthWeight: { a: null, b: null },
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    return normalizeState(JSON.parse(raw))
  } catch {
    return emptyState()
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

// İçe aktarılan veya eski sürümden kalan veriyi güvenli biçime getirir.
export function normalizeState(input) {
  const base = emptyState()
  if (!input || typeof input !== 'object') return base
  const cages = Array.isArray(input.cages)
    ? input.cages.filter((c) => c && typeof c.id === 'string' && typeof c.name === 'string')
    : []
  const cageIds = new Set(cages.map((c) => c.id))
  const logs = Array.isArray(input.logs)
    ? input.logs.filter((l) => l && typeof l.id === 'string' && cageIds.has(l.cageId))
    : []
  const thresholds = emptyThresholds()
  for (const p of PARAMS) {
    const t = input.thresholds?.[p.key]
    if (t) {
      thresholds[p.key] = { min: toNumOrNull(t.min), max: toNumOrNull(t.max) }
    }
  }
  const lw = input.lengthWeight || {}
  return {
    cages,
    logs,
    thresholds,
    lengthWeight: { a: toNumOrNull(lw.a), b: toNumOrNull(lw.b) },
  }
}

function toNumOrNull(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

// Türkçe klavyede ondalık virgül yaygın: "7,5" -> 7.5
// Boş metin -> null, geçersiz metin -> NaN
export function parseNum(text) {
  if (text === null || text === undefined) return null
  const s = String(text).trim().replace(',', '.')
  if (s === '') return null
  if (!/^-?\d*\.?\d+(e-?\d+)?$/i.test(s)) return NaN
  return Number(s)
}

export function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function todayISO() {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}

export function formatDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

export function formatNum(v, digits = 2) {
  if (v === null || v === undefined || Number.isNaN(v)) return '–'
  return Number(v).toLocaleString('tr-TR', { maximumFractionDigits: digits })
}

// Bir değeri eşiğe göre değerlendirir: 'low' | 'high' | 'ok' | null (eşik ya da değer yok)
export function evaluate(value, threshold) {
  if (value === null || value === undefined || Number.isNaN(value)) return null
  const { min, max } = threshold || {}
  if (min === null && max === null) return null
  if (min !== null && value < min) return 'low'
  if (max !== null && value > max) return 'high'
  return 'ok'
}

// Bir kayıttaki tüm eşik dışı ölçümleri döndürür.
export function alertsForLog(log, thresholds) {
  const out = []
  for (const p of PARAMS) {
    const status = evaluate(log[p.key], thresholds[p.key])
    if (status === 'low' || status === 'high') out.push({ key: p.key, status })
  }
  return out
}

export function sortLogs(logs) {
  return [...logs].sort((a, b) => (a.date === b.date ? a.createdAt - b.createdAt : a.date < b.date ? -1 : 1))
}

// Boy-ağırlık ilişkisi: W = a · L^b
export function weightFromLength(L, a, b) {
  if (![L, a, b].every((x) => typeof x === 'number' && Number.isFinite(x))) return null
  if (L <= 0 || a <= 0) return null
  return a * Math.pow(L, b)
}

// "24,5 25.1; 26" gibi metinden boy listesi çıkarır. Ayraç: boşluk, satır sonu veya noktalı virgül.
export function parseLengths(text) {
  const parts = String(text || '')
    .split(/[\s;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const values = []
  const invalid = []
  for (const p of parts) {
    const n = parseNum(p)
    if (typeof n === 'number' && Number.isFinite(n) && n > 0) values.push(n)
    else invalid.push(p)
  }
  return { values, invalid }
}

// Demo verisi: gerçek ölçüm değildir, arayüzü denemek için üretilmiş örnek sayılardır.
export function buildDemo() {
  const cageId = uid()
  const cage = {
    id: cageId,
    name: 'Demo Kafes',
    species: 'Örnek tür',
    note: 'Bu kafes ve kayıtları uydurma demo verisidir; gerçek ölçüm değildir.',
    demo: true,
    createdAt: Date.now(),
  }
  const logs = []
  const start = new Date()
  start.setDate(start.getDate() - 13)
  for (let i = 0; i < 14; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const off = d.getTimezoneOffset()
    const iso = new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
    const wave = Math.sin(i / 2)
    logs.push({
      id: uid(),
      cageId,
      date: iso,
      temp: round(20 + wave * 1.5 + i * 0.1, 1),
      ph: round(7.9 + Math.cos(i / 3) * 0.15, 2),
      do: round(7 - wave * 0.8 - (i === 9 ? 2.6 : 0), 1),
      feedKg: round(40 + i * 0.8, 1),
      mortality: i === 9 ? 12 : (i * 7) % 4,
      note: 'Demo',
      demo: true,
      createdAt: Date.now() + i,
    })
  }
  return { cage, logs }
}

function round(v, d) {
  const f = Math.pow(10, d)
  return Math.round(v * f) / f
}
