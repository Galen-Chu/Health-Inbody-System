import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

const FIELDS = [
  ['name', '姓名', 'text'],
  ['sex', '性別（male/female）', 'text'],
  ['height_cm', '身高（cm）', 'number'],
  ['weight_kg', '體重（kg）', 'number'],
  ['age', '年齡', 'number'],
  ['body_fat_pct', '體脂率 %（有 InBody 數據才填）', 'number'],
]
const SELECTS = [
  ['activity', '活動量', [['sedentary', '久坐'], ['light', '輕度（週 1-3 次）'],
    ['moderate', '中度（週 3-5 次）'], ['high', '高度（週 6-7 次）'], ['athlete', '運動員級']]],
  ['goal', '目標', [['cut', '減脂 -20%'], ['maintain', '維持'], ['bulk', '增肌 +10%']]],
]

export default function Settings() {
  const [profile, setProfile] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.getProfile().then(setProfile).catch(() => setMessage('載入失敗，後端未啟動？'))
  }, [])

  if (!profile) return <p>{message || '載入中…'}</p>

  const save = async () => {
    await api.saveProfile({ ...profile, body_fat_pct: profile.body_fat_pct || null })
    setMessage('✓ 已儲存，Dashboard 將依新數據重算')
  }

  return (
    <div>
      <h2>個人設定 Settings</h2>
      <table><tbody>
        {FIELDS.map(([key, label, type]) => (
          <tr key={key}>
            <td style={{ padding: 6 }}>{label}</td>
            <td style={{ padding: 6 }}>
              <input type={type} value={profile[key] ?? ''}
                onChange={(e) => setProfile({ ...profile, [key]: e.target.value })} />
            </td>
          </tr>
        ))}
        {SELECTS.map(([key, label, options]) => (
          <tr key={key}>
            <td style={{ padding: 6 }}>{label}</td>
            <td style={{ padding: 6 }}>
              <select value={profile[key]}
                onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}>
                {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </td>
          </tr>
        ))}
      </tbody></table>
      <button onClick={save} style={{ marginTop: 12, padding: '8px 24px', cursor: 'pointer' }}>儲存</button>
      {message && <span style={{ marginLeft: 12, color: '#2a6' }}>{message}</span>}
    </div>
  )
}
