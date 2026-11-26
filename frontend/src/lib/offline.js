// 離線容忍 · 寫入操作（POST/PUT/PATCH/DELETE）離線或斷網時進本機佇列，
// 恢復連線自動重送；讀取（GET）不佇列——本 app 的資料都在雲端。
// 重送安全性：records/body-metrics 是同日 upsert（冪等）、meals 依序附加、
// delete 冪等——全部可安全重試。
const QUEUE_KEY = 'his_offline_queue'

export function isOnline() {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

export function queueSize() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]').length
  } catch {
    return 0
  }
}

function saveQueue(items) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items))
  } catch { /* localStorage 不可用＝丟棄（與既有快取同策略） */ }
  window.dispatchEvent(new CustomEvent('his:queue', { detail: items.length }))
}

export function enqueue(path, options) {
  let items = []
  try {
    items = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  } catch { /* 起手就是壞的＝當空佇列 */ }
  items.push({ path, options, queuedAt: new Date().toISOString() })
  saveQueue(items)
}

// 重送佇列：成功的移除、失敗的保留待下次；回傳 {ok, failed}
export async function flushQueue(doFetch) {
  let items = []
  try {
    items = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  } catch {
    return { ok: 0, failed: 0 }
  }
  if (!items.length) return { ok: 0, failed: 0 }

  const remaining = []
  let ok = 0
  for (const item of items) {
    try {
      const resp = await doFetch(item.path, item.options)
      if (resp && resp.ok) ok += 1
      else remaining.push(item)
    } catch {
      remaining.push(item)
    }
  }
  saveQueue(remaining)
  return { ok, failed: remaining.length }
}
