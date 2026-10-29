// 小倍數趨勢線圖 —— 依 dataviz 規格：2px 線、髮絲網格、端點標值、
// 十字線 tooltip、單系列免圖例（標題即系列名）
import { useState } from 'react'

const W = 340, H = 210, M = { top: 14, right: 46, bottom: 26, left: 44 }
const INK = '#0b0b0b', INK2 = '#52514e', MUTED = '#898781',
      GRID = '#e1e0d9', BASE = '#c3c2b7', SURFACE = '#ffffff'

export default function TrendChart({ title, unit, data = [], color }) {
  // data: 依時間升序 [{date: 'YYYY-MM-DD', value: number}]
  const [hover, setHover] = useState(null)   // index or null

  if (data.length === 0) {
    return (
      <div style={{ width: W, border: `1px solid ${GRID}`, borderRadius: 8, padding: 16 }}>
        <div style={{ fontSize: 13, color: INK2 }}>{title}</div>
        <div style={{ height: H - 60, display: 'grid', placeItems: 'center', color: MUTED, fontSize: 13 }}>
          尚無量測資料
        </div>
      </div>
    )
  }

  const xs = data.map((d) => new Date(d.date).getTime())
  const ys = data.map((d) => d.value)
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
    `${i === 0 ? 'M' : 'L'}${px(xs[i]).toFixed(1)},${py(d.value).toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L${px(xs[xs.length - 1]).toFixed(1)},${H - M.bottom} L${px(xs[0]).toFixed(1)},${H - M.bottom} Z`

  const last = data[data.length - 1]
  const fmt = (v) => Number.isInteger(v) ? v : v.toFixed(1)

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (W / rect.width)
    let nearest = 0, best = Infinity
    xs.forEach((t, i) => {
      const d2 = Math.abs(px(t) - x)
      if (d2 < best) { best = d2; nearest = i }
    })
    setHover(nearest)
  }

  return (
    <div style={{ width: W, position: 'relative' }}>
      <div style={{ fontSize: 13, color: INK2, marginBottom: 4 }}>{title}</div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%"
        onMouseMove={onMove} onMouseLeave={() => setHover(null)}
        style={{ display: 'block', cursor: 'crosshair' }}>
        {/* 髮絲網格（實線、退後） */}
        {ticks.map((t, i) => (
          <line key={i} x1={M.left} x2={W - M.right} y1={py(t)} y2={py(t)} stroke={GRID} strokeWidth="1" />
        ))}
        <line x1={M.left} x2={W - M.right} y1={H - M.bottom} y2={H - M.bottom} stroke={BASE} strokeWidth="1" />
        {/* Y 軸刻度文字（muted、tabular） */}
        {ticks.map((t, i) => (
          <text key={i} x={M.left - 6} y={py(t) + 3.5} textAnchor="end" fontSize="10"
            fill={MUTED} style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(t)}</text>
        ))}
        {/* X 軸首/中/尾日期 */}
        <text x={M.left} y={H - 8} fontSize="10" fill={MUTED}>{data[0].date.slice(5)}</text>
        <text x={W - M.right} y={H - 8} fontSize="10" fill={MUTED} textAnchor="end">{last.date.slice(5)}</text>
        {data.length > 2 && (() => {
          const mid = data[Math.floor((data.length - 1) / 2)]
          const midX = px(new Date(mid.date).getTime())
          return midX > M.left + 40 && midX < W - M.right - 40 ? (
            <text x={midX} y={H - 8} fontSize="10" fill={MUTED} textAnchor="middle">{mid.date.slice(5)}</text>
          ) : null
        })()}
        {/* 面積淡染（10%）＋ 2px 線 */}
        <path d={areaPath} fill={color} opacity="0.1" />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2"
          strokeLinejoin="round" strokeLinecap="round" />
        {/* 端點標記：8px 點＋2px 表面環＋端點值（文字用 ink，非系列色） */}
        <circle cx={px(xs[xs.length - 1])} cy={py(last.value)} r="4" fill={color}
          stroke={SURFACE} strokeWidth="2" />
        <text x={px(xs[xs.length - 1]) + 8} y={py(last.value) + 3.5} fontSize="11" fill={INK}
          fontWeight="600" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {fmt(last.value)}{unit}
        </text>
        {/* 十字線 hover 層 */}
        {hover !== null && (
          <>
            <line x1={px(xs[hover])} x2={px(xs[hover])} y1={M.top} y2={H - M.bottom}
              stroke={BASE} strokeWidth="1" />
            <circle cx={px(xs[hover])} cy={py(data[hover].value)} r="5" fill={color}
              stroke={SURFACE} strokeWidth="2" />
          </>
        )}
      </svg>
      {hover !== null && (
        <div style={{
          position: 'absolute', pointerEvents: 'none',
          left: `${(px(xs[hover]) / W) * 100}%`, top: `${(py(data[hover].value) / H) * 100}%`,
          transform: 'translate(-50%, -130%)',
          background: INK, color: '#fff', borderRadius: 6, padding: '3px 8px',
          fontSize: 11, whiteSpace: 'nowrap',
        }}>
          {data[hover].date} · {fmt(data[hover].value)}{unit}
        </div>
      )}
    </div>
  )
}
