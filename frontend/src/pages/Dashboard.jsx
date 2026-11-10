import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import HexagonChart from '../components/HexagonChart.jsx'
import IconCheck from '../icons/IconCheck.js'
import IconExclamation from '../icons/IconExclamation.js'
import IconLightning from '../icons/IconLightning.js'

const GROUP_LABELS = {
  grains: '全榖雜糧', protein: '豆魚蛋肉', dairy: '乳品',
  vegetables: '蔬菜', fruits: '水果', oils: '油脂堅果',
}

function Progress({ label, value, target, unit }) {
  const pct = Math.min(Math.round((value / target) * 100), 150)
  const color = pct > 110 ? 'var(--color-status-warning)'
    : pct < 60 ? 'var(--color-status-danger)' : 'var(--color-status-success)'
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
        <span>{label}</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.round(value)} / {Math.round(target)} {unit}（{pct}%）</span>
      </div>
      <div className="progress" style={{ marginTop: 4 }}>
        <div className="progress-bar" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
      </div>
    </div>
  )
}

const REC_ICON = { warning: IconExclamation, positive: IconCheck, info: IconLightning }
const REC_ICON_COLOR = {
  warning: 'var(--color-status-warning)',
  positive: 'var(--color-status-success)',
  info: 'var(--color-status-info)',
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null)
  const [summary, setSummary] = useState(null)
  const [recs, setRecs] = useState([])
  const [error, setError] = useState('')
  const [hexIntake, setHexIntake] = useState({})

  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10)
    Promise.all([api.getMetrics(), api.getRecords(), api.getSummary(todayStr),
                 api.getRecommendations(todayStr)])
      .then(([m, records, s, r]) => {
        setMetrics(m)
        setSummary(s)
        setRecs(r.recommendations || [])
        const today = records.find((r2) => r2.record_date === todayStr) || null
        setHexIntake(today?.servings || {})
      })
      .catch((e) => setError(e.message || String(e)))
  }, [])

  if (error) return <p className="msg-err">⚠ 載入失敗：{error}</p>
  if (!metrics) return <p className="empty">載入中…</p>

  const stats = [
    ['BMR 基礎代謝', `${metrics.bmr} kcal (${metrics.formula})`],
    ['TDEE 每日消耗', `${metrics.tdee} kcal`],
    ['目標熱量', `${metrics.calorie_target} kcal`],
    ['飲水目標', `${metrics.water_target_ml} ml`],
  ]

  return (
    <div>
      <div className="stat-grid">
        {stats.map(([label, value]) => (
          <div key={label} className="stat">
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value}</div>
          </div>
        ))}
      </div>

      <h2>今日攝取 vs 目標</h2>
      {summary && (
        <div className="card" style={{ maxWidth: 520 }}>
          <Progress label="熱量" value={summary.calories_total} target={summary.calorie_target} unit="kcal" />
          <Progress label="水分（飲水＋食物）"
            value={summary.water_drink_ml + summary.water_from_food_ml}
            target={metrics.water_target_ml} unit="ml" />
          <p className="hint" style={{ marginBottom: 0 }}>
            巨量營養：蛋白質 {summary.macros.protein_g}g · 碳水 {summary.macros.carb_g}g · 脂質 {summary.macros.fat_g}g
          </p>
        </div>
      )}

      <h2>今日建議 Recommendations</h2>
      {recs.length > 0 ? (
        <ul className="rec-list">
          {recs.map((r, i) => {
            const Icon = REC_ICON[r.level] || REC_ICON.info
            return (
              <li key={i} className={r.level === 'positive' ? 'positive' : ''}>
                <span aria-hidden style={{ color: REC_ICON_COLOR[r.level] || REC_ICON_COLOR.info, flexShrink: 0 }}>
                  <Icon size={20} />
                </span>
                <div>
                  <div className="rec-zh">{r.zh}</div>
                  <div className="rec-en">{r.en}</div>
                </div>
              </li>
            )
          })}
        </ul>
      ) : <p className="empty">尚無建議（請先記錄今日飲食）。</p>}

      <h2>六大類達成率</h2>
      <div className="card" style={{ display: 'flex', justifyContent: 'center' }}>
        <HexagonChart
          targets={metrics.six_groups.servings}
          intake={hexIntake}
          labels={GROUP_LABELS}
        />
      </div>
      <p className="hint">
        六大類份量依國民飲食指南（2018）熱量階梯 {metrics.six_groups.tier} kcal 建議。
      </p>
    </div>
  )
}
