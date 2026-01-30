export function pad2(n: number) {
  return String(n).padStart(2, '0')
}

export function todayYmd() {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function isValidYmd(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s)
}

export function parseYmdToDate(s: string) {
  if (!isValidYmd(s)) return null
  const [yy, mm, dd] = s.split('-').map((v) => Number(v))
  if (!yy || !mm || !dd) return null
  const d = new Date(yy, mm - 1, dd)
  if (Number.isNaN(d.getTime())) return null
  return d
}

export function clampYmd(dateYmd: string, minYmd: string, maxYmd: string) {
  const d = parseYmdToDate(dateYmd)
  const min = parseYmdToDate(minYmd)
  const max = parseYmdToDate(maxYmd)
  if (!d || !min || !max) return maxYmd
  const t = d.getTime()
  if (t < min.getTime()) return minYmd
  if (t > max.getTime()) return maxYmd
  return dateYmd
}

export function addDaysYmd(baseYmd: string, days: number) {
  const d = parseYmdToDate(baseYmd)
  if (!d) return baseYmd
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

