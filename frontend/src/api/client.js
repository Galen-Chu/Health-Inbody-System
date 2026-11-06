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
}
