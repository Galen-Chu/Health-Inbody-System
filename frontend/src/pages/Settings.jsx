import { useEffect, useState } from 'react'
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
  const [connected, setConnected] = useState(null)   // null=檢查中
  const [tokenInput, setTokenInput] = useState('')
  const [loginMsg, setLoginMsg] = useState('')
  const [importMode, setImportMode] = useState('merge')
  const [importMsg, setImportMsg] = useState('')
  const [exportMsg, setExportMsg] = useState('')

  const loadProfile = () => {
    setProfile(null)
    setProfileMsg('載入中…')
    api.getProfile()
      .then((p) => { setProfile(p); setProfileMsg('') })
      .catch((e) => {
        const msg = String(e.message || e)
        setProfileMsg(msg.includes('401')
          ? '未登入——請在上方「連線設定」登入後，此處會自動載入'
          : `載入失敗：${msg}`)
      })
  }

  useEffect(() => {
    (async () => {
      // 舊版 localStorage token 一次性遷移：試著用它登入（成功即改用 cookie）
      const legacy = localStorage.getItem('his_api_token')
      if (legacy) {
        await api.login(legacy).catch(() => {})
        localStorage.removeItem('his_api_token')
      }
      try {
        await api.getProfile()
        setConnected(true)
        loadProfile()
      } catch {
        setConnected(false)
      }
    })()
  }, [])

  const doLogin = async () => {
    const v = tokenInput.trim()
    if (!v) return
    setLoginMsg('登入中…')
    try {
      await api.login(v)
      setTokenInput('')
      setLoginMsg('✓ 已登入——這台瀏覽器會記住一年')
      setConnected(true)
      loadProfile()
    } catch (e) {
      setLoginMsg(`⚠ ${e.message || e}`)
    }
  }

  const doLogout = async () => {
    await api.logout().catch(() => {})
    setConnected(false)
    setProfile(null)
    setProfileMsg('')
    setLoginMsg('')
  }

  const onImportFile = async (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''   // 清掉選擇，同一檔可立刻重選
    if (!file) return
    if (importMode === 'replace' &&
        !window.confirm('取代模式會先清空現有的量測、每日記錄與餐點，再寫入備份內容。確定？')) {
      return
    }
    try {
      const data = JSON.parse(await file.text())
      const r = await api.importData(data, importMode)
      setImportMsg(`✓ 匯入完成：量測 ${r.body_metrics} 筆、每日記錄 ${r.daily_records} 筆、餐點 ${r.meals} 筆`)
    } catch (err) {
      setImportMsg(`⚠ 匯入失敗：${err.message || err}`)
    }
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
        {connected === null ? (
          <p className="hint">檢查連線中…</p>
        ) : connected ? (
          <>
            <p className="hint">
              ✓ 已登入（此瀏覽器會記住一年，重開也不會消失）· 目前網址：{window.location.origin}
            </p>
            <button onClick={doLogout} className="btn btn-secondary">登出</button>
          </>
        ) : (
          <>
            <p className="hint">
              部署端有設 HIS_API_TOKEN 時需登入一次（值＝Vercel 環境變數那組）；登入後這台瀏覽器會記住一年。
              本機開發為開放模式，免登入。
            </p>
            <div className="form-inline">
              <input
                type="password" placeholder="API Token" className="input" style={{ width: 260 }}
                value={tokenInput} onChange={(e) => setTokenInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') doLogin() }} />
              <button onClick={doLogin} className="btn btn-primary">登入</button>
              {loginMsg && (
                <span className={loginMsg.startsWith('⚠') ? 'msg-err' : 'msg-ok'}>{loginMsg}</span>
              )}
            </div>
            <p className="hint" style={{ marginBottom: 0 }}>
              小提醒：token 跟著「網址」走——目前網址是 {window.location.origin}，
              請一律使用主網域（加到書籤），從 Vercel 後台點進去的部署網址會是另一個站、不共用登入。
            </p>
          </>
        )}
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
        <button onClick={() => api.exportData('json').catch((e) => setExportMsg(`⚠ ${e.message || e}`))}
          className="btn btn-secondary"><IconOpen size={16} /> 下載 JSON</button>
        {' '}
        <button onClick={() => api.exportData('csv').catch((e) => setExportMsg(`⚠ ${e.message || e}`))}
          className="btn btn-secondary"><IconOpen size={16} /> 下載 CSV (ZIP)</button>
        {exportMsg && <span className="msg-err" style={{ marginLeft: 12 }}>{exportMsg}</span>}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>資料匯入 Data Import</h3>
        <p className="hint">
          還原上方「下載 JSON」產生的備份檔。<b>合併</b>＝備份內出現的日期覆蓋現有同日資料，其他日期不動；
          <b>取代</b>＝清空現有量測／每日記錄／餐點後整檔寫入（食物資料庫不受影響）。兩種模式皆可重複執行。
        </p>
        <div className="form-inline">
          <select className="select" style={{ width: 110 }} value={importMode}
            aria-label="匯入模式" onChange={(e) => setImportMode(e.target.value)}>
            <option value="merge">合併</option>
            <option value="replace">取代</option>
          </select>
          <input type="file" accept=".json,application/json" className="input"
            style={{ maxWidth: 280 }} aria-label="備份檔" onChange={onImportFile} />
          {importMsg && (
            <span className={importMsg.startsWith('⚠') ? 'msg-err' : 'msg-ok'}>{importMsg}</span>
          )}
        </div>
      </div>
    </div>
  )
}
