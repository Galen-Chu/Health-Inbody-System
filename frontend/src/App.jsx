import { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard.jsx'
import DailyLog from './pages/DailyLog.jsx'
import Trends from './pages/Trends.jsx'
import Settings from './pages/Settings.jsx'
import BrandLogoH from './icons/BrandLogoH.js'
import IconDashboard from './icons/IconDashboard.js'
import IconDiary from './icons/IconDiary.js'
import IconArrowUpRight from './icons/IconArrowUpRight.js'
import IconFingerprint from './icons/IconFingerprint.js'
import IconSun from './icons/IconSun.js'
import IconMoon from './icons/IconMoon.js'

const TABS = [
  { key: 'dashboard', label: '儀表板', icon: IconDashboard },
  { key: 'daily', label: '每日記錄', icon: IconDiary },
  { key: 'trends', label: '身體趨勢', icon: IconArrowUpRight },
  { key: 'settings', label: '設定', icon: IconFingerprint },
]

function useTab() {
  const [tab, setTab] = useState(() => window.location.hash.slice(1) || 'dashboard')
  useEffect(() => {
    const onHash = () => setTab(window.location.hash.slice(1) || 'dashboard')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const go = (key) => { setTab(key); window.location.hash = key }
  return [tab, go]
}

function useTheme() {
  // 初始：使用者選過的 > 系統偏好；切換寫入 <html data-theme>（tokens.css 支援強制覆寫）
  const [theme, setTheme] = useState(() => localStorage.getItem('his_theme')
    || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('his_theme', theme) } catch { /* 忽略 */ }
  }, [theme])
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))]
}

export default function App() {
  const [tab, go] = useTab()
  const [theme, toggleTheme] = useTheme()

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="brand">
          <BrandLogoH size={28} title="Health Inbody System" />
          <span className="brand-title">Health Inbody System</span>
        </span>
        <span className="spacer" />
        <button className="btn btn-ghost btn-icon" onClick={toggleTheme}
          title={theme === 'dark' ? '切換淺色模式' : '切換深色模式'} aria-label="切換色彩模式">
          {theme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
        </button>
      </header>

      <nav className="app-nav" aria-label="主導覽">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} className={tab === key ? 'active' : ''}
            onClick={() => go(key)}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon size={18} /> {label}
            </span>
          </button>
        ))}
      </nav>

      <main className="app-main">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'daily' && <DailyLog />}
        {tab === 'trends' && <Trends />}
        {tab === 'settings' && <Settings />}
      </main>

      <nav className="tab-bar" aria-label="主導覽">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} className={tab === key ? 'active' : ''} onClick={() => go(key)}>
            <Icon size={22} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
