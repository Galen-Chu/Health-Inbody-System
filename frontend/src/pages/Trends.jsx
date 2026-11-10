import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import TrendChart from '../components/TrendChart.jsx'

// 系列色＝Uniconsign 色階，經 dataviz 六項檢查驗證（見 global.css --chart-*）
const SERIES = [
  { key: 'weight_kg', title: '體重 Weight', unit: ' kg', color: 'var(--chart-c1)' },
  { key: 'body_fat_pct', title: '體脂率 Body Fat', unit: ' %', color: 'var(--chart-c2)' },
  { key: 'muscle_mass_kg', title: '肌肉量 Muscle Mass', unit: ' kg', color: 'var(--chart-c3)' },
]

const RANGES = [['30', '30 天'], ['90', '90 天'], ['all', '全部']]

export default function Trends() {
  const [metrics, setMetrics] = useState([])
  const [forecasts, setForecasts] = useState({})   // {weight_kg: [...], ...}
  const [range, setRange] = useState('all')
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    measured_on: new Date().toISOString().slice(0, 10),
    weight_kg: '', body_fat_pct: '', muscle_mass_kg: '',
  })

  const load = () => Promise.all([
    api.getBodyMetrics(),
    api.getWeightTrend('weight_kg'),
    api.getWeightTrend('body_fat_pct'),
    api.getWeightTrend('muscle_mass_kg'),
  ])
    .then(([list, ...trends]) => {
      setMetrics([...list].reverse())   // API 回傳新→舊，圖表要舊→新
      setForecasts({
        weight_kg: trends[0].forecast,
        body_fat_pct: trends[1].forecast,
        muscle_mass_kg: trends[2].forecast,
      })
    })
    .catch((e) => setMessage(`載入失敗：${e.message || e}`))

  useEffect(() => { load() }, [])

  const submit = async () => {
    if (!form.weight_kg) { setMessage('⚠ 體重為必填'); return }
    await api.addBodyMetric({
      measured_on: form.measured_on,
      weight_kg: Number(form.weight_kg),
      body_fat_pct: form.body_fat_pct ? Number(form.body_fat_pct) : null,
      muscle_mass_kg: form.muscle_mass_kg ? Number(form.muscle_mass_kg) : null,
    })
    setMessage('✓ 已記錄量測')
    setForm({ ...form, weight_kg: '', body_fat_pct: '', muscle_mass_kg: '' })
    load()
  }

  return (
    <div>
      <h2>身體組成趨勢 Body Trends</h2>

      <div className="card">
        <div className="form-inline" style={{ marginBottom: 10 }}>
          <span className="hint">範圍</span>
          <div className="seg">
            {RANGES.map(([key, label]) => (
              <button key={key} className={range === key ? 'active' : ''}
                onClick={() => setRange(key)}>{label}</button>
            ))}
          </div>
        </div>
        <div className="form-inline">
          <input type="date" className="input" value={form.measured_on}
            onChange={(e) => setForm({ ...form, measured_on: e.target.value })} />
          <input type="number" step="0.1" className="input" placeholder="體重 kg*" style={{ width: 110 }}
            value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} />
          <input type="number" step="0.1" className="input" placeholder="體脂 %" style={{ width: 100 }}
            value={form.body_fat_pct} onChange={(e) => setForm({ ...form, body_fat_pct: e.target.value })} />
          <input type="number" step="0.1" className="input" placeholder="肌肉量 kg" style={{ width: 120 }}
            value={form.muscle_mass_kg} onChange={(e) => setForm({ ...form, muscle_mass_kg: e.target.value })} />
          <button onClick={submit} className="btn btn-primary">記錄量測</button>
          {message && <span className={message.startsWith('⚠') ? 'msg-warn' : 'msg-ok'}>{message}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
        {SERIES.map(({ key, title, unit, color }) => {
          const cutoff = range === 'all' ? null
            : new Date(Date.now() - Number(range) * 86400_000).toISOString().slice(0, 10)
          return (
            <TrendChart key={key} title={title} unit={unit} color={color}
              forecast={forecasts[key] || null}
              data={metrics
                .filter((m) => m[key] != null && (!cutoff || m.measured_on >= cutoff))
                .map((m) => ({ date: m.measured_on, value: m[key] }))} />
          )
        })}
      </div>

      <h3>量測歷史</h3>
      {metrics.length > 0 ? (
        <div className="table-wrap">
          <table className="table">
            <thead><tr>
              <th>日期</th><th className="num">體重 kg</th><th className="num">體脂 %</th><th className="num">肌肉量</th>
            </tr></thead>
            <tbody>
              {[...metrics].reverse().map((m) => (
                <tr key={m.id}>
                  <td>{m.measured_on}</td>
                  <td className="num">{m.weight_kg}</td>
                  <td className="num">{m.body_fat_pct ?? '—'}</td>
                  <td className="num">{m.muscle_mass_kg ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="empty">尚無量測資料，上方表單記錄第一筆。</p>}
    </div>
  )
}
