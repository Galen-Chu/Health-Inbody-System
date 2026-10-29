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

  // 食物記錄狀態
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [grams, setGrams] = useState(100)
  const [meals, setMeals] = useState([])

  useEffect(() => {
    api.getRecords().then((records) => {
      const existing = records.find((r) => r.record_date === date)
      if (existing) {
        setServings(existing.servings || {})
        setWaterMl(existing.water_ml || 0)
        setNote(existing.note || '')
      }
    }).catch(() => {})
    api.listMeals(date).then(setMeals).catch(() => {})
  }, [date])

  useEffect(() => {
    if (query.trim().length < 1) { setResults([]); return }
    const timer = setTimeout(() => {
      api.searchFoods(query.trim()).then(setResults).catch(() => setResults([]))
    }, 300)  // debounce
    return () => clearTimeout(timer)
  }, [query])

  const save = async () => {
    await api.saveRecord({ record_date: date, servings, water_ml: Number(waterMl) || 0, note })
    setMessage(`✓ 已儲存 ${date}`)
  }

  const addMeal = async () => {
    if (!selected) return
    await api.addMeal({ record_date: date, food_id: selected.id, grams: Number(grams) })
    setMeals(await api.listMeals(date))
    setSelected(null); setQuery(''); setGrams(100)
    setMessage(`✓ 已加入 ${selected.name} ${grams}g`)
  }

  const removeMeal = async (id) => {
    await api.deleteMeal(id)
    setMeals(await api.listMeals(date))
  }

  const totalKcal = meals.reduce((s, m) => s + m.calories_kcal, 0)

  return (
    <div>
      <h2>每日記錄 Daily Log</h2>
      <label>
        日期 <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>

      <h3>六大類份量</h3>
      <table style={{ borderCollapse: 'collapse' }}><tbody>
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
      </tbody></table>

      <h3>食物記錄（熱量自動計算）</h3>
      <div>
        <input style={{ width: 240 }} placeholder="搜尋食物（例：雞胸肉、白米）"
          value={query} onChange={(e) => { setQuery(e.target.value); setSelected(null) }} />
        {' '}
        <select value={selected?.id ?? ''} onChange={(e) => {
          setSelected(results.find((f) => f.id === Number(e.target.value)) || null)
        }} style={{ width: 240 }}>
          <option value="">-- 搜尋結果 --</option>
          {results.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}（{f.calories_kcal_per_100g} kcal/100g）
            </option>
          ))}
        </select>
        {' '}
        {selected && (
          <>
            <input type="number" min="1" style={{ width: 70 }} value={grams}
              onChange={(e) => setGrams(e.target.value)} /> g
            {' '}
            <button onClick={addMeal}>加入</button>
            <span style={{ marginLeft: 8, color: '#57606a' }}>
              ≈ {Math.round(selected.calories_kcal_per_100g * grams / 100)} kcal
            </span>
          </>
        )}
      </div>

      {meals.length > 0 && (
        <table style={{ marginTop: 12, borderCollapse: 'collapse' }}>
          <thead><tr>
            <th style={{ textAlign: 'left', padding: 4 }}>食物</th>
            <th style={{ padding: 4 }}>公克</th>
            <th style={{ padding: 4 }}>熱量</th>
            <th style={{ padding: 4 }}>蛋白質</th>
            <th style={{ padding: 4 }}>碳水</th>
            <th style={{ padding: 4 }}>脂質</th>
            <th></th>
          </tr></thead>
          <tbody>
            {meals.map((m) => (
              <tr key={m.id}>
                <td style={{ padding: 4 }}>{m.food_name}</td>
                <td style={{ textAlign: 'right', padding: 4 }}>{m.grams}</td>
                <td style={{ textAlign: 'right', padding: 4 }}>{m.calories_kcal}</td>
                <td style={{ textAlign: 'right', padding: 4 }}>{m.protein_g}</td>
                <td style={{ textAlign: 'right', padding: 4 }}>{m.carb_g}</td>
                <td style={{ textAlign: 'right', padding: 4 }}>{m.fat_g}</td>
                <td style={{ padding: 4 }}>
                  <button onClick={() => removeMeal(m.id)}>✕</button>
                </td>
              </tr>
            ))}
            <tr>
              <td style={{ padding: 4, fontWeight: 'bold' }}>合計</td>
              <td />
              <td style={{ textAlign: 'right', padding: 4, fontWeight: 'bold' }}>{Math.round(totalKcal)}</td>
              <td colSpan={4} />
            </tr>
          </tbody>
        </table>
      )}

      <p>
        <input style={{ width: '100%' }} placeholder="備註（今天吃了什麼、狀態如何）"
          value={note} onChange={(e) => setNote(e.target.value)} />
      </p>
      <button onClick={save} style={{ padding: '8px 24px', cursor: 'pointer' }}>儲存</button>
      {message && <span style={{ marginLeft: 12, color: '#2a6' }}>{message}</span>}
    </div>
  )
}
