// 輕量 API client — 開發期走 Vite proxy，建置後同源
// 認證：Settings 頁設定的 token 存 localStorage，有設就自動帶 Bearer
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
    throw new Error('401 未授權：請到「設定」頁填入 API Token（部署端 HIS_API_TOKEN）')
  }
  if (!resp.ok) {
    throw new Error(`API ${path}: ${resp.status}`)
  }
  return resp.status === 204 ? null : resp.json()
}

export const api = {
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
}
