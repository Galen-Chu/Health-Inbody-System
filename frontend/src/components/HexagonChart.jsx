// 六大類六邊形雷達圖 —— 重現原專案的互動六邊形（SVG 數學座標，非手調）
// props: targets {grains: 份...}, intake {grains: 份...}, labels {grains: '全榖雜糧類'...}
// 色彩走 Uniconsign token（經 style 屬性，SVG 屬性不支援 var()）
//
// 版面（2026-11-27 修正）：標籤半徑必須讓「標籤寬度/2 + x」留在 viewBox 內——
// 舊版 320×320 + 標籤半徑 166.4 造成上/下標籤整個裁切、左右貼邊。
const GROUP_ORDER = ['grains', 'protein', 'dairy', 'vegetables', 'fruits', 'oils']
const SIZE = 380
const CENTER = SIZE / 2
const R_MAX = 125
const LABEL_R = 152          // 標籤錨點半徑（含雙行文字的留白）
const LINE_H = 13            // 雙行標籤行高

// 每份量單位（與後端 engine/six_groups.py GROUPS 同源——tooltip 顯示「實際/目標 單位」用）
const UNITS = {
  grains: '碗', protein: '份', dairy: '杯',
  vegetables: '份', fruits: '份', oils: '茶匙',
}

const GRID = 'var(--color-border-default)'
const TEXT = 'var(--color-text-secondary)'
const SERIES = 'var(--chart-c1)'   // 單一系列（達成率），系列色=綠

function point(index, ratio) {
  const angle = (-90 + index * 60) * (Math.PI / 180)
  const r = R_MAX * Math.min(ratio, 1.15) // 超過 100% 略微外擴
  return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)]
}

function labelPoint(index) {
  const angle = (-90 + index * 60) * (Math.PI / 180)
  return [CENTER + LABEL_R * Math.cos(angle), CENTER + LABEL_R * Math.sin(angle)]
}

export default function HexagonChart({ targets = {}, intake = {}, labels = {} }) {
  const gridPolygons = [0.25, 0.5, 0.75, 1.0].map((ratio) =>
    GROUP_ORDER.map((_, i) => point(i, ratio).join(',')).join(' '))
  const dataPoints = GROUP_ORDER.map((g) => {
    const target = targets[g] ?? 1
    return (intake[g] ?? 0) / target
  })
  const dataPolygon = dataPoints.map((ratio, i) => point(i, ratio).join(',')).join(' ')

  // 雙行標籊的首行位移：頂點往上抬、底點往下留、側點垂直置中
  const DY_NAME = [-LINE_H - 1, -7, -7, -1, -7, -7]

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="六大類達成率六邊形圖"
      style={{ width: '100%', maxWidth: SIZE, height: 'auto', display: 'block' }}>
      {gridPolygons.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" strokeWidth="1" style={{ stroke: GRID }} />
      ))}
      {GROUP_ORDER.map((_, i) => {
        const [x, y] = point(i, 1)
        return <line key={i} x1={CENTER} y1={CENTER} x2={x} y2={y} strokeWidth="1" style={{ stroke: GRID }} />
      })}
      <polygon points={dataPolygon} strokeWidth="2" style={{ fill: SERIES, fillOpacity: 0.35, stroke: SERIES }} />
      {GROUP_ORDER.map((g, i) => {
        const [x, y] = labelPoint(i)
        const pct = Math.round((dataPoints[i] || 0) * 100)
        const eaten = intake[g] ?? 0
        return (
          <g key={g}>
            {/* 原生 tooltip：滑鼠/長按顯示「實際 / 目標 單位」 */}
            <title>{`${labels[g] || g}：${eaten} / ${targets[g] ?? '—'} ${UNITS[g] || ''}`}</title>
            <text x={x} y={y} textAnchor="middle" fontSize="12" style={{ fill: TEXT }}>
              <tspan x={x} dy={DY_NAME[i]}>{labels[g] || g}</tspan>
              <tspan x={x} dy={LINE_H} fontSize="11"
                style={{ fill: TEXT, fontVariantNumeric: 'tabular-nums' }}>{pct}%</tspan>
            </text>
          </g>
        )
      })}
    </svg>
  )
}
