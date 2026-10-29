// 輕量 API client — 開發期走 Vite proxy，建置後同源
async function request(path, options = {}) {
  const resp = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
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
}
