import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import HexagonChart from '../components/HexagonChart.jsx'

const GROUP_LABELS = {
  grains: '全榖雜糧', protein: '豆魚蛋肉', dairy: '乳品',
  vegetables: '蔬菜', fruits: '水果', oils: '油脂堅果',
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null)
  const [today, setToday] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.getMetrics(), api.getRecords()])
      .then(([m, records]) => {
        setMetrics(m)
        const todayStr = new Date().toISOString().slice(0, 10)
        setToday(records.find((r) => r.record_date === todayStr) || null)
      })
      .catch((e) => setError(String(e)))
  }, [])

  if (error) return <p>⚠ 無法連上後端（請確認 uvicorn 已啟動）：{error}</p>
  if (!metrics) return <p>載入中…</p>

  const stats = [
    ['BMR 基礎代謝', `${metrics.bmr} kcal (${metrics.formula})`],
    ['TDEE 每日消耗', `${metrics.tdee} kcal`],
    ['目標熱量', `${metrics.calorie_target} kcal`],
    ['飲水目標', `${metrics.water_target_ml} ml`],
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
        {stats.map(([label, value]) => (
          <div key={label} style={{ border: '1px solid #d0d7de', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 13, color: '#57606a' }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 'bold' }}>{value}</div>
          </div>
        ))}
      </div>
      <h2>六大類達成率（{today ? today.record_date : '今日尚無記錄'}）</h2>
      <HexagonChart
        targets={metrics.six_groups.servings}
        intake={today?.servings || {}}
        labels={GROUP_LABELS}
      />
      <p style={{ color: '#57606a', fontSize: 13 }}>
        六大類份量依國民飲食指南（2018）熱量階梯 {metrics.six_groups.tier} kcal 建議。
      </p>
    </div>
  )
}
