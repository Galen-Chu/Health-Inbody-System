import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import localDateStr from '../lib/localDate.js'
import portionChips from '../lib/portions.js'
import IconSearch from '../icons/IconSearch.js'
import IconPlus from '../icons/IconPlus.js'
import IconClose from '../icons/IconClose.js'
import IconStar from '../icons/IconStar.js'
import IconWaterDrop from '../icons/IconWaterDrop.js'

const GROUPS = [
  ['grains', '全榖雜糧類（碗）'], ['protein', '豆魚蛋肉類（份）'],
  ['dairy', '乳品類（杯）'], ['vegetables', '蔬菜類（份）'],
  ['fruits', '水果類（份）'], ['oils', '油脂堅果（茶匙）'],
]

const MEAL_TIMES = [
  ['any', '不限'], ['breakfast', '早餐'], ['lunch', '午餐'],
  ['dinner', '晚餐'], ['snack', '點心'],
]
const MEAL_LABEL = Object.fromEntries(MEAL_TIMES)

export default function DailyLog() {
  const today = localDateStr()
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
  const [mealTime, setMealTime] = useState('any')
  const [meals, setMeals] = useState([])
  const [editing, setEditing] = useState(null)   // {id, grams, meal} 行內編輯
  const [recents, setRecents] = useState([])
  const [units, setUnits] = useState({})
  const [favorites, setFavorites] = useState(
    JSON.parse(localStorage.getItem('his_fav_foods') || '[]'))

  const toggleFavorite = (food) => {
    const exists = favorites.some((f) => f.id === food.id)
    const next = exists
      ? favorites.filter((f) => f.id !== food.id)
      : [...favorites, food]
    setFavorites(next)
    localStorage.setItem('his_fav_foods', JSON.stringify(next))
  }

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
    api.getRecentFoods().then(setRecents).catch(() => {})
  }, [date])

  useEffect(() => {
    api.getSixGroupUnits().then(setUnits).catch(() => {})
  }, [])

  useEffect(() => {
    if (query.trim().length < 1) { setResults([]); return }
    const timer = setTimeout(() => {
      api.searchFoods(query.trim()).then(setResults).catch(() => setResults([]))
    }, 300)  // debounce
    return () => clearTimeout(timer)
  }, [query])

  const save = async () => {
    const r = await api.saveRecord(
      { record_date: date, servings, water_ml: Number(waterMl) || 0, note })
      .catch((e) => { setMessage(`⚠ ${e.message || e}`); return null })
    if (!r) return
    setMessage(r.queued ? '離線中——已排隊，連線後自動同步' : `✓ 已儲存 ${date}`)
  }

  const removeRecord = async () => {
    if (!window.confirm(`刪除 ${date} 的每日記錄（六大類/飲水/備註）？餐點不受影響。`)) return
    const r = await api.deleteRecord(date)
      .catch((e) => { setMessage(`⚠ ${e.message || e}`); return null })
    if (!r) return
    setServings({}); setWaterMl(0); setNote('')
    setMessage(r.queued ? '離線中——刪除已排隊同步' : `✓ 已刪除 ${date} 的記錄`)
  }

  const addMeal = async () => {
    if (!selected) return
    const entry = { record_date: date, food_id: selected.id, grams: Number(grams), meal: mealTime }
    const r = await api.addMeal(entry).catch((e) => { setMessage(`⚠ ${e.message || e}`); return null })
    if (!r) return
    setSelected(null); setQuery(''); setGrams(100)
    if (r.queued) {
      setMessage(`離線中——${selected.name} 已排隊，連線後自動同步`)
      return
    }
    setMeals(await api.listMeals(date))
    setMessage(`✓ 已加入 ${selected.name} ${grams}g`)
  }

  const removeMeal = async (id) => {
    await api.deleteMeal(id)
    setMeals(await api.listMeals(date))
  }

  const saveEdit = async () => {
    const r = await api.updateMeal(editing.id, {
      grams: Number(editing.grams), meal: editing.meal,
    }).catch((e) => { setMessage(`⚠ ${e.message || e}`); return null })
    if (!r) return
    if (r.queued) {
      setMessage('離線中——修改已排隊同步')
      setEditing(null)
      return
    }
    setEditing(null)
    setMeals(await api.listMeals(date))
    setMessage('✓ 已修正餐點')
  }

  const estimateFromMeals = async () => {
    const s = await api.getSummary(date)
    if (s.servings_estimate && Object.keys(s.servings_estimate).length) {
      setServings({ ...servings, ...s.servings_estimate })
      setMessage('✓ 已從餐點自動估算六大類（可再手動微調）')
    } else {
      setMessage('本日尚無餐點記錄可估算')
    }
  }

  const totalKcal = meals.reduce((s, m) => s + m.calories_kcal, 0)
  const isFav = selected && favorites.some((f) => f.id === selected.id)

  return (
    <div>
      <h2>每日記錄 Daily Log</h2>

      <div className="card">
        <div className="form-inline" style={{ marginBottom: 8 }}>
          <label htmlFor="dl-date" className="hint">日期</label>
          <input id="dl-date" type="date" className="input" value={date}
            onChange={(e) => setDate(e.target.value)} />
        </div>

        <h3 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          六大類份量
          <button onClick={estimateFromMeals} className="btn btn-secondary btn-sm">
            從餐點自動估算
          </button>
        </h3>
        {GROUPS.map(([key, label]) => (
          <div className="field-row" key={key}>
            <label htmlFor={`sv-${key}`}>{label}</label>
            <input id={`sv-${key}`} type="number" step="0.5" min="0" className="input"
              style={{ width: 100 }} value={servings[key] ?? ''}
              onChange={(e) => setServings({ ...servings, [key]: Number(e.target.value) })} />
          </div>
        ))}
        <div className="field-row">
          <label htmlFor="dl-water">飲水（ml）</label>
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <input id="dl-water" type="number" min="0" className="input" style={{ width: 100 }}
              value={waterMl} onChange={(e) => setWaterMl(e.target.value)} />
            <button onClick={() => setWaterMl(Number(waterMl) + 250)} className="btn btn-secondary btn-sm"
              title="+250 ml"><IconWaterDrop size={14} /> 250</button>
            <button onClick={() => setWaterMl(Number(waterMl) + 500)} className="btn btn-secondary btn-sm"
              title="+500 ml"><IconWaterDrop size={14} /> 500</button>
          </span>
        </div>

        <h3>備註</h3>
        <input className="input" style={{ width: '100%' }}
          placeholder="今天吃了什麼、狀態如何" value={note}
          onChange={(e) => setNote(e.target.value)} />

        <div style={{ marginTop: 16 }}>
          <button onClick={save} className="btn btn-primary">儲存</button>
          {' '}
          <button onClick={removeRecord} className="btn btn-danger">刪除本日記錄</button>
          {message && <span className="msg-ok" style={{ marginLeft: 12 }}>{message}</span>}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>食物記錄（熱量自動計算）</h3>

        {(favorites.length > 0 || recents.length > 0) && (
          <div className="chip-row">
            {favorites.length > 0 && <span className="hint">最愛</span>}
            {favorites.map((f) => (
              <button key={f.id} onClick={() => setSelected(f)} className="chip chip-fav">
                <IconStar size={13} /> {f.name}
              </button>
            ))}
            {recents.length > 0 && <span className="hint" style={{ marginLeft: 8 }}>最近</span>}
            {recents.filter((r) => !favorites.some((f) => f.id === r.id))
              .slice(0, 5).map((f) => (
              <button key={f.id} onClick={() => setSelected(f)} className="chip">{f.name}</button>
            ))}
          </div>
        )}

        <div className="form-inline">
          <span className="search-box">
            <IconSearch size={16} />
            <input className="input" style={{ width: 220 }} placeholder="搜尋食物（例：雞胸肉、白米）"
              value={query} onChange={(e) => { setQuery(e.target.value); setSelected(null) }} />
          </span>
          <select className="select" style={{ minWidth: 220 }} value={selected?.id ?? ''}
            onChange={(e) => {
              setSelected(results.find((f) => f.id === Number(e.target.value)) || null)
            }}>
            <option value="">-- 搜尋結果 --</option>
            {results.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}（{f.calories_kcal_per_100g} kcal/100g）
              </option>
            ))}
          </select>
          {selected && (
            <>
              <select className="select" style={{ width: 90 }} value={mealTime}
                aria-label="餐點時段" onChange={(e) => setMealTime(e.target.value)}>
                {MEAL_TIMES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
              </select>
              <input type="number" min="1" className="input" style={{ width: 80 }} value={grams}
                onChange={(e) => setGrams(e.target.value)} />
              {portionChips(selected.category, units).map((c) => (
                <button key={c.label} onClick={() => setGrams(c.grams)}
                  className="btn btn-secondary btn-sm" title={c.hint}>
                  {c.label}
                </button>
              ))}
              <span className="hint">g ≈ {Math.round(selected.calories_kcal_per_100g * grams / 100)} kcal</span>
              <button onClick={addMeal} className="btn btn-primary btn-sm">
                <IconPlus size={15} /> 加入
              </button>
              <button onClick={() => toggleFavorite(selected)} className="btn btn-ghost btn-icon"
                title={isFav ? '移除最愛' : '加入最愛'} aria-label={isFav ? '移除最愛' : '加入最愛'}
                style={{ color: isFav ? 'var(--color-icon-brand)' : 'var(--color-icon-muted)' }}>
                <IconStar size={20} />
              </button>
            </>
          )}
        </div>

        {meals.length > 0 && (
          <div className="table-wrap" style={{ marginTop: 12 }}>
            <table className="table">
              <thead><tr>
                <th>食物</th><th>時段</th><th className="num">公克</th><th className="num">熱量</th>
                <th className="num">蛋白質</th><th className="num">碳水</th><th className="num">脂質</th><th />
              </tr></thead>
              <tbody>
                {meals.map((m) => (
                  <tr key={m.id}>
                    <td>{m.food_name}</td>
                    {editing && editing.id === m.id ? (
                      <>
                        <td>
                          <select className="select" style={{ width: 80 }} value={editing.meal}
                            aria-label="編輯時段" onChange={(e) => setEditing({ ...editing, meal: e.target.value })}>
                            {MEAL_TIMES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                          </select>
                        </td>
                        <td className="num">
                          <input type="number" min="1" className="input" style={{ width: 70 }}
                            value={editing.grams}
                            onChange={(e) => setEditing({ ...editing, grams: e.target.value })} />
                        </td>
                        <td colSpan={4} />
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <button onClick={saveEdit} className="btn btn-primary btn-sm">存</button>{' '}
                          <button onClick={() => setEditing(null)} className="btn btn-secondary btn-sm">取消</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{MEAL_LABEL[m.meal] || m.meal}</td>
                        <td className="num">{m.grams}</td>
                        <td className="num">{m.calories_kcal}</td>
                        <td className="num">{m.protein_g}</td>
                        <td className="num">{m.carb_g}</td>
                        <td className="num">{m.fat_g}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <button onClick={() => setEditing({ id: m.id, grams: m.grams, meal: m.meal || 'any' })}
                            className="btn btn-secondary btn-sm" title="修正公克/時段"
                            aria-label={`編輯 ${m.food_name}`}>
                            ✎
                          </button>{' '}
                          <button onClick={() => removeMeal(m.id)} className="btn btn-danger btn-sm"
                            aria-label={`刪除 ${m.food_name}`}>
                            <IconClose size={14} />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                <tr className="total">
                  <td>合計</td>
                  <td />
                  <td />
                  <td className="num">{Math.round(totalKcal)}</td>
                  <td colSpan={4} />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
