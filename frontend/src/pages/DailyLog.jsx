import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

const GROUPS = [
  ['grains', '全榖雜糧類（碗）'], ['protein', '豆魚蛋肉類（份）'],
  ['dairy', '乳品類（杯）'], ['vegetables', '蔬菜類（份）'],
  ['fruits', '水果類（份）'], ['oils', '油脂堅果（茶匙）'],
]

export default function DailyLog() {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [servings, setServings] = useState({})
  const [waterMl, setWaterMl] = useState(0)
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.getRecords().then((records) => {
      const existing = records.find((r) => r.record_date === date)
      if (existing) {
        setServings(existing.servings || {})
        setWaterMl(existing.water_ml || 0)
        setNote(existing.note || '')
      }
    }).catch(() => {})
  }, [date])

  const save = async () => {
    await api.saveRecord({ record_date: date, servings, water_ml: Number(waterMl) || 0, note })
    setMessage(`✓ 已儲存 ${date}`)
  }

  return (
    <div>
      <h2>每日記錄 Daily Log</h2>
      <label>
        日期 <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <table style={{ marginTop: 16, borderCollapse: 'collapse' }}>
        <tbody>
          {GROUPS.map(([key, label]) => (
            <tr key={key}>
              <td style={{ padding: 6 }}>{label}</td>
              <td style={{ padding: 6 }}>
                <input type="number" step="0.5" min="0" style={{ width: 80 }}
                  value={servings[key] ?? ''}
                  onChange={(e) => setServings({ ...servings, [key]: Number(e.target.value) })} />
              </td>
            </tr>
          ))}
          <tr>
            <td style={{ padding: 6 }}>飲水（ml）</td>
            <td style={{ padding: 6 }}>
              <input type="number" min="0" style={{ width: 80 }}
                value={waterMl} onChange={(e) => setWaterMl(e.target.value)} />
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        <input style={{ width: '100%' }} placeholder="備註（今天吃了什麼、狀態如何）"
          value={note} onChange={(e) => setNote(e.target.value)} />
      </p>
      <button onClick={save} style={{ padding: '8px 24px', cursor: 'pointer' }}>儲存</button>
      {message && <span style={{ marginLeft: 12, color: '#2a6' }}>{message}</span>}
    </div>
  )
}
