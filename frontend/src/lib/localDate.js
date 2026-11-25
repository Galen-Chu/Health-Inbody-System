// 當地時區的 YYYY-MM-DD。
// toISOString() 是 UTC——台灣（UTC+8）早上 8 點前會得到前一天，
// 「今天」的記錄會歸錯日；所有以今天為 key 的地方一律用這裡。
export default function localDateStr(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
