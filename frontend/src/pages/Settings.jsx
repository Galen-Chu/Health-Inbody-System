import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client.js'
import IconOpen from '../icons/IconOpen.js'

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
  const [profileMsg, setProfileMsg] = useState('')
  const [message, setMessage] = useState('')
  const [tokenMsg, setTokenMsg] = useState('')
  const retryTimer = useRef(null)

  const loadProfile = () => {
    setProfile(null)
    setProfileMsg('載入中…')
    api.getProfile()
      .then((p) => { setProfile(p); setProfileMsg('') })
      .catch((e) => {
        const msg = String(e.message || e)
        setProfileMsg(msg.includes('401')
          ? '未連線（401）——請在上方「連線設定」填入 API Token（＝部署端 HIS_API_TOKEN 的值），存好後此處會自動重試'
          : `載入失敗：${msg}`)
      })
  }
  useEffect(loadProfile, [])
  useEffect(() => () => clearTimeout(retryTimer.current), [])

  // token 一變（貼上/修改）就存好並自動重試連線，不再需要手動重新整理
  const onTokenChange = (e) => {
    const v = e.target.value.trim()
    if (v) localStorage.setItem('his_api_token', v)
    else localStorage.removeItem('his_api_token')
    setTokenMsg(v ? '✓ 已儲存，自動重試連線…' : '已清除')
    clearTimeout(retryTimer.current)
    retryTimer.current = setTimeout(loadProfile, 600)
  }

  const save = async () => {
    try {
      await api.saveProfile({ ...profile, body_fat_pct: profile.body_fat_pct || null })
      setMessage('✓ 已儲存，Dashboard 將依新數據重算')
    } catch (e) {
      setMessage(`⚠ 儲存失敗：${e.message || e}`)
    }
  }

  return (
    <div>
      <h2>設定 Settings</h2>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>連線設定 Connection</h3>
        <p className="hint">
          部署端（Vercel）有設 HIS_API_TOKEN 時必填——填部署時設定的同一組值；本機開發留空即可。
        </p>
        <input
          type="password" placeholder="API Token" className="input" style={{ width: 280 }}
          defaultValue={localStorage.getItem('his_api_token') || ''}
          onChange={onTokenChange} />
        {tokenMsg && <span className="msg-ok" style={{ marginLeft: 12 }}>{tokenMsg}</span>}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>個人資料 Profile</h3>
        {profile ? (
          <>
            {FIELDS.map(([key, label, type]) => (
              <div className="field-row" key={key}>
                <label htmlFor={`f-${key}`}>{label}</label>
                <input id={`f-${key}`} type={type} className="input"
                  value={profile[key] ?? ''}
                  onChange={(e) => setProfile({ ...profile, [key]: e.target.value })} />
              </div>
            ))}
            {SELECTS.map(([key, label, options]) => (
              <div className="field-row" key={key}>
                <label htmlFor={`s-${key}`}>{label}</label>
                <select id={`s-${key}`} className="select" value={profile[key]}
                  onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}>
                  {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}
            <div style={{ marginTop: 12 }}>
              <button onClick={save} className="btn btn-primary">儲存</button>
              {message && <span style={{ marginLeft: 12 }} className={message.startsWith('⚠') ? 'msg-err' : 'msg-ok'}>{message}</span>}
            </div>
          </>
        ) : (
          <p className="empty">
            {profileMsg}{' '}
            {profileMsg !== '載入中…' && <button onClick={loadProfile} className="btn btn-secondary btn-sm">重新載入</button>}
          </p>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>資料匯出 Data Export</h3>
        <p className="hint">全量下載量測、餐點與每日記錄（CSV 為三表 ZIP）——換機／備份用。</p>
        <button onClick={() => api.exportData('json').catch((e) => setTokenMsg(`⚠ ${e}`))}
          className="btn btn-secondary"><IconOpen size={16} /> 下載 JSON</button>
        {' '}
        <button onClick={() => api.exportData('csv').catch((e) => setTokenMsg(`⚠ ${e}`))}
          className="btn btn-secondary"><IconOpen size={16} /> 下載 CSV (ZIP)</button>
      </div>
    </div>
  )
}
