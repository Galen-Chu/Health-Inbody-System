// 小倍數趨勢線圖 —— 依 dataviz 規格：2px 線、髰絲網格、端點標值、
// 十字線 tooltip、單系列免圖例（標題即系列名）
// forecast（可選）：虛線外推段（Holt），空心端點
// 色彩走 Uniconsign token（CSS 變數，深色模式自動切換）；系列色由 props 傳入
// 注意：SVG 屬性值不支援 var()，token 色一律經 style 屬性帶入
import { useState } from 'react'

const W = 340, H = 210, M = { top: 14, right: 46, bottom: 26, left: 44 }
const INK = 'var(--color-text-primary)', INK2 = 'var(--color-text-secondary)',
      MUTED = 'var(--color-icon-muted)', GRID = 'var(--color-border-default)',
      BASE = 'var(--color-border-strong)', SURFACE = 'var(--color-bg-surface)'

export default function TrendChart({ title, unit, data = [], color, forecast = null }) {
  // data: 依時間升序 [{date, value}]；forecast: 同格式（外推段）
  const [hover, setHover] = useState(null)

  if (data.length === 0) {
    return (
      <div style={{ width: '100%', maxWidth: W, border: `1px solid ${GRID}`, borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 13, color: INK2 }}>{title}</div>
        <div style={{ height: H - 60, display: 'grid', placeItems: 'center', color: MUTED, fontSize: 13 }}>
          尚無量測資料
        </div>
      </div>
    )
  }

  const all = forecast ? [...data, ...forecast] : data
  const xs = all.map((d) => new Date(d.date).getTime())
  const ys = all.map((d) => d.value)
  const x0 = Math.min(...xs), x1 = Math.max(...xs)
  const yMin = Math.min(...ys), yMax = Math.max(...ys)
  // 30% 緩衝：健康趨勢線貼邊會誇大變化幅度，寧可留白
  const yPad = (yMax - yMin) * 0.3 || Math.abs(yMax) * 0.1 || 1
  const lo = yMin - yPad, hi = yMax + yPad
  const px = (t) => M.left + (t - x0) / Math.max(x1 - x0, 1) * (W - M.left - M.right)
  const py = (v) => H - M.bottom - (v - lo) / (hi - lo) * (H - M.top - M.bottom)

  // 乾淨刻度：3 條
  const ticks = [0, 1, 2].map((i) => lo + (hi - lo) * (i + 0.5) / 3)

  const linePath = data.map((d, i) =>
    `${i === 0 ? 'M' : 'L'}${px(new Date(d.date).getTime()).toFixed(1)},${py(d.value).toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L${px(new Date(data[data.length - 1].date).getTime()).toFixed(1)},${H - M.bottom} L${px(new Date(data[0].date).getTime()).toFixed(1)},${H - M.bottom} Z`
  const forecastPath = forecast && forecast.length
    ? 'M' + px(new Date(data[data.length - 1].date).getTime()).toFixed(1) + ',' +
      py(data[data.length - 1].value).toFixed(1) + ' ' +
      forecast.map((d) => `L${px(new Date(d.date).getTime()).toFixed(1)},${py(d.value).toFixed(1)}`).join(' ')
    : null

  const last = data[data.length - 1]
  const fmt = (v) => Number.isInteger(v) ? v : v.toFixed(1)
  const histXs = data.map((d) => new Date(d.date).getTime())

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (W / rect.width)
    let nearest = 0, best = Infinity
    histXs.forEach((t, i) => {
      const d2 = Math.abs(px(t) - x)
      if (d2 < best) { best = d2; nearest = i }
    })
    setHover(nearest)
  }

  return (
    <div style={{ width: '100%', maxWidth: W, position: 'relative' }}>
      <div style={{ fontSize: 13, color: INK2, marginBottom: 4 }}>{title}</div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%"
        onMouseMove={onMove} onMouseLeave={() => setHover(null)}
        style={{ display: 'block', cursor: 'crosshair' }}>
        {/* 髰絲網格（實線、退後） */}
        {ticks.map((t, i) => (
          <line key={i} x1={M.left} x2={W - M.right} y1={py(t)} y2={py(t)} strokeWidth="1" style={{ stroke: GRID }} />
        ))}
        <line x1={M.left} x2={W - M.right} y1={H - M.bottom} y2={H - M.bottom} strokeWidth="1" style={{ stroke: BASE }} />
        {/* Y 軸刻度文字（muted、tabular） */}
        {ticks.map((t, i) => (
          <text key={i} x={M.left - 6} y={py(t) + 3.5} textAnchor="end" fontSize="10"
            style={{ fill: MUTED, fontVariantNumeric: 'tabular-nums' }}>{fmt(t)}</text>
        ))}
        {/* X 軸首/中/尾日期 */}
        <text x={M.left} y={H - 8} fontSize="10" style={{ fill: MUTED }}>{data[0].date.slice(5)}</text>
        <text x={W - M.right} y={H - 8} fontSize="10" textAnchor="end" style={{ fill: MUTED }}>
          {(forecast ? forecast[forecast.length - 1] : last).date.slice(5)}
        </text>
        {data.length > 2 && (() => {
          const mid = data[Math.floor((data.length - 1) / 2)]
          const midX = px(new Date(mid.date).getTime())
          return midX > M.left + 40 && midX < W - M.right - 40 ? (
            <text x={midX} y={H - 8} fontSize="10" textAnchor="middle" style={{ fill: MUTED }}>{mid.date.slice(5)}</text>
          ) : null
        })()}
        {/* 面積淡染（10%）＋ 2px 線 */}
        <path d={areaPath} style={{ fill: color, opacity: 0.1 }} />
        <path d={linePath} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
          style={{ fill: 'none', stroke: color }} />
        {/* 外推預測：虛線＋空心端點（圖例說明「預測」） */}
        {forecastPath && (
          <>
            <path d={forecastPath} strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round"
              style={{ fill: 'none', stroke: color, opacity: 0.75 }} />
            {forecast.slice(-1).map((f) => (
              <circle key={f.date} cx={px(new Date(f.date).getTime())}
                cy={py(f.value)} r="4" strokeWidth="2"
                style={{ fill: SURFACE, stroke: color }} />
            ))}
            <text x={W - M.right} y={py(forecast[forecast.length - 1].value) - 10}
              fontSize="10" textAnchor="end" style={{ fill: MUTED }}>預測 {fmt(forecast[forecast.length - 1].value)}{unit}</text>
          </>
        )}
        {/* 端點標記：實心點＋2px 表面環＋端點值（文字用 ink，非系列色） */}
        <circle cx={px(histXs[histXs.length - 1])} cy={py(last.value)} r="4" strokeWidth="2"
          style={{ fill: color, stroke: SURFACE }} />
        {!forecastPath && (
          <text x={px(histXs[histXs.length - 1]) + 8} y={py(last.value) + 3.5} fontSize="11"
            fontWeight="600" style={{ fill: INK, fontVariantNumeric: 'tabular-nums' }}>
            {fmt(last.value)}{unit}
          </text>
        )}
        {/* 十字線 hover 層 */}
        {hover !== null && (
          <>
            <line x1={px(histXs[hover])} x2={px(histXs[hover])} y1={M.top} y2={H - M.bottom}
              strokeWidth="1" style={{ stroke: BASE }} />
            <circle cx={px(histXs[hover])} cy={py(data[hover].value)} r="5" strokeWidth="2"
              style={{ fill: color, stroke: SURFACE }} />
          </>
        )}
      </svg>
      {hover !== null && (
        <div className="chart-tip"
          style={{
            left: `${(px(histXs[hover]) / W) * 100}%`, top: `${(py(data[hover].value) / H) * 100}%`,
          }}>
          {data[hover].date} · {fmt(data[hover].value)}{unit}
        </div>
      )}
    </div>
  )
}
