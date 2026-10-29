import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import HexagonChart from '../components/HexagonChart.jsx'

const GROUP_LABELS = {
  grains: '全榖雜糧', protein: '豆魚蛋肉', dairy: '乳品',
  vegetables: '蔬菜', fruits: '水果', oils: '油脂堅果',
}

function Progress({ label, value, target, unit }) {
  const pct = Math.min(Math.round((value / target) * 100), 150)
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
        <span>{label}</span>
        <span>{Math.round(value)} / {Math.round(target)} {unit}（{pct}%）</span>
      </div>
      <div style={{ background: '#eef1f4', borderRadius: 6, height: 12 }}>
        <div style={{
          width: `${Math.min(pct, 100)}%`, height: 12, borderRadius: 6,
          background: pct > 110 ? '#d29922' : pct < 60 ? '#d1242f' : '#2da44e',
        }} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null)
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10)
    Promise.all([api.getMetrics(), api.getRecords(), api.getSummary(todayStr)])
      .then(([m, records, s]) => {
        setMetrics(m)
        setSummary(s)
        const today = records.find((r) => r.record_date === todayStr) || null
        setHexIntake(today?.servings || {})
      })
      .catch((e) => setError(String(e)))
  }, [])

  const [hexIntake, setHexIntake] = useState({})

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

      <h2>今日攝取 vs 目標</h2>
      {summary && (
        <div style={{ maxWidth: 520, marginBottom: 24 }}>
          <Progress label="熱量" value={summary.calories_total} target={summary.calorie_target} unit="kcal" />
          <Progress label="水分（飲水＋食物）"
            value={summary.water_drink_ml + summary.water_from_food_ml}
            target={metrics.water_target_ml} unit="ml" />
          <p style={{ fontSize: 13, color: '#57606a' }}>
            巨量營養：蛋白質 {summary.macros.protein_g}g · 碳水 {summary.macros.carb_g}g · 脂質 {summary.macros.fat_g}g
          </p>
        </div>
      )}

      <h2>六大類達成率</h2>
      <HexagonChart
        targets={metrics.six_groups.servings}
        intake={hexIntake}
        labels={GROUP_LABELS}
      />
      <p style={{ color: '#57606a', fontSize: 13 }}>
        六大類份量依國民飲食指南（2018）熱量階梯 {metrics.six_groups.tier} kcal 建議。
      </p>
    </div>
  )
}
