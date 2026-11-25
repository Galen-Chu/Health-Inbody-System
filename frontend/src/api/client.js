// 輕量 API client — 開發期走 Vite proxy，建置後同源
// 認證：登入後的 his_session cookie（HttpOnly，瀏覽器自動帶）為主；
// localStorage 的舊 token 僅在設定頁做一次性遷移（登入成功後清除）
function authHeaders() {
  const token = localStorage.getItem('his_api_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, options = {}) {
  const resp = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    ...options,
  })
  if (resp.status === 401) {
    throw new Error('401 未授權：請到「設定」頁登入（Token＝部署端 HIS_API_TOKEN）')
  }
  if (!resp.ok) {
    let detail = ''
    try { detail = (await resp.json())?.detail || '' } catch { /* 非 JSON 回應 */ }
    throw new Error(`API ${path}: ${resp.status}${detail ? ` — ${detail}` : ''}`)
  }
  return resp.status === 204 ? null : resp.json()
}

export const api = {
  // 認證 session（cookie 由瀏覽器自動保存，效期一年）
  getAuthStatus: () => request('/auth/status'),
  login: (token) => request('/auth/login', { method: 'POST', body: JSON.stringify({ token }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getProfile: () => request('/profile'),
  saveProfile: (profile) => request('/profile', { method: 'PUT', body: JSON.stringify(profile) }),
  getMetrics: () => request('/metrics'),
  getRecords: (params = '') => request(`/records${params}`),
  saveRecord: (record) => request('/records', { method: 'POST', body: JSON.stringify(record) }),
  getBodyMetrics: () => request('/body-metrics'),
  addBodyMetric: (m) => request('/body-metrics', { method: 'POST', body: JSON.stringify(m) }),
  // 食物資料庫與餐點
  searchFoods: (q, category = '') => request(`/foods?q=${encodeURIComponent(q)}${category ? `&category=${category}` : ''}`),
  addMeal: (meal) => request('/meals', { method: 'POST', body: JSON.stringify(meal) }),
  listMeals: (day) => request(`/meals?day=${day}`),
  deleteMeal: (id) => request(`/meals/${id}`, { method: 'DELETE' }),
  getSummary: (day) => request(`/summary/${day}`),
  getRecommendations: (day) => request(`/recommendations/${day}`),
  getWeightTrend: (metric = 'weight_kg', horizon = 14) =>
    request(`/trend/weight?metric=${metric}&horizon=${horizon}`),
  getRecentFoods: () => request('/foods/recent'),
  // 資料匯出：帶認證的 blob 下載（<a> 標籤無法帶 Authorization）
  exportData: async (format = 'json') => {
    const resp = await fetch(`/api/export?format=${format}`, {
      headers: authHeaders(),
    })
    if (!resp.ok) throw new Error(`export failed: ${resp.status}`)
    const blob = await resp.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `his_export.${format === 'csv' ? 'zip' : 'json'}`
    a.click()
    URL.revokeObjectURL(url)
  },
  // 資料匯入：還原 /api/export 的 JSON 備份（merge=同日合併 / replace=整檔取代）
  importData: (data, mode = 'merge') =>
    request(`/import?mode=${mode}`, { method: 'POST', body: JSON.stringify(data) }),
}
