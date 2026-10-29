import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import TrendChart from '../components/TrendChart.jsx'

const SERIES = [
  { key: 'weight_kg', title: '體重 Weight', unit: ' kg', color: '#2a78d6' },
  { key: 'body_fat_pct', title: '體脂率 Body Fat', unit: ' %', color: '#eb6834' },
  { key: 'muscle_mass_kg', title: '肌肉量 Muscle Mass', unit: ' kg', color: '#1baf7a' },
]

export default function Trends() {
  const [metrics, setMetrics] = useState([])
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    measured_on: new Date().toISOString().slice(0, 10),
    weight_kg: '', body_fat_pct: '', muscle_mass_kg: '',
  })

  const load = () => api.getBodyMetrics()
    .then((list) => setMetrics([...list].reverse()))  // API 回傳新→舊，圖表要舊→新
    .catch(() => setMessage('載入失敗，後端未啟動？'))

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

      <div style={{ marginBottom: 20, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="date" value={form.measured_on}
          onChange={(e) => setForm({ ...form, measured_on: e.target.value })} />
        <input type="number" step="0.1" placeholder="體重 kg*" style={{ width: 100 }}
          value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} />
        <input type="number" step="0.1" placeholder="體脂 %" style={{ width: 90 }}
          value={form.body_fat_pct} onChange={(e) => setForm({ ...form, body_fat_pct: e.target.value })} />
        <input type="number" step="0.1" placeholder="肌肉量 kg" style={{ width: 110 }}
          value={form.muscle_mass_kg} onChange={(e) => setForm({ ...form, muscle_mass_kg: e.target.value })} />
        <button onClick={submit} style={{ padding: '6px 20px', cursor: 'pointer' }}>記錄量測</button>
        {message && <span style={{ color: '#2a6' }}>{message}</span>}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        {SERIES.map(({ key, title, unit, color }) => (
          <TrendChart key={key} title={title} unit={unit} color={color}
            data={metrics
              .filter((m) => m[key] != null)
              .map((m) => ({ date: m.measured_on, value: m[key] }))} />
        ))}
      </div>

      <h3>量測歷史</h3>
      {metrics.length > 0 ? (
        <table style={{ borderCollapse: 'collapse' }}>
          <thead><tr>
            <th style={{ textAlign: 'left', padding: 6 }}>日期</th>
            <th style={{ padding: 6 }}>體重 kg</th>
            <th style={{ padding: 6 }}>體脂 %</th>
            <th style={{ padding: 6 }}>肌肉量 kg</th>
          </tr></thead>
          <tbody>
            {[...metrics].reverse().map((m) => (
              <tr key={m.id}>
                <td style={{ padding: 6 }}>{m.measured_on}</td>
                <td style={{ textAlign: 'right', padding: 6 }}>{m.weight_kg}</td>
                <td style={{ textAlign: 'right', padding: 6 }}>{m.body_fat_pct ?? '—'}</td>
                <td style={{ textAlign: 'right', padding: 6 }}>{m.muscle_mass_kg ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <p style={{ color: '#57606a' }}>尚無量測資料，上方表單記錄第一筆。</p>}
    </div>
  )
}
