import { useState } from 'react'
import Dashboard from './pages/Dashboard.jsx'
import DailyLog from './pages/DailyLog.jsx'
import Settings from './pages/Settings.jsx'

const TABS = [
  { key: 'dashboard', label: 'Dashboard 儀表板' },
  { key: 'daily', label: '每日記錄 Daily Log' },
  { key: 'settings', label: '設定 Settings' },
]

export default function App() {
  const [tab, setTab] = useState('dashboard')

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <h1>🩺 Health Inbody System</h1>
      <nav style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: '8px 16px', cursor: 'pointer',
              fontWeight: tab === key ? 'bold' : 'normal',
              borderBottom: tab === key ? '2px solid #2a6' : 'none' }}>
            {label}
          </button>
        ))}
      </nav>
      {tab === 'dashboard' && <Dashboard />}
      {tab === 'daily' && <DailyLog />}
      {tab === 'settings' && <Settings />}
    </div>
  )
}
