// 六大類六邊形雷達圖 —— 重現原專案的互動六邊形（SVG 數學座標，非手調）
// props: targets {grains: 份...}, intake {grains: 份...}, labels {grains: '全榖雜糧類'...}
// 色彩走 Uniconsign token（經 style 屬性，SVG 屬性不支援 var()）
const GROUP_ORDER = ['grains', 'protein', 'dairy', 'vegetables', 'fruits', 'oils']
const SIZE = 320
const CENTER = SIZE / 2
const R_MAX = 130

const GRID = 'var(--color-border-default)'
const TEXT = 'var(--color-text-secondary)'
const SERIES = 'var(--chart-c1)'   // 單一系列（達成率），系列色=綠

function point(index, ratio) {
  const angle = (-90 + index * 60) * (Math.PI / 180)
  const r = R_MAX * Math.min(ratio, 1.15) // 超過 100% 略微外擴
  return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)]
}

export default function HexagonChart({ targets = {}, intake = {}, labels = {} }) {
  const gridPolygons = [0.25, 0.5, 0.75, 1.0].map((ratio) =>
    GROUP_ORDER.map((_, i) => point(i, ratio).join(',')).join(' '))
  const dataPoints = GROUP_ORDER.map((g) => {
    const target = targets[g] ?? 1
    return (intake[g] ?? 0) / target
  })
  const dataPolygon = dataPoints.map((ratio, i) => point(i, ratio).join(',')).join(' ')

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
        const [x, y] = point(i, 1.28)
        const pct = Math.round((dataPoints[i] || 0) * 100)
        return (
          <text key={g} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
            fontSize="12" style={{ fill: TEXT }}>
            {labels[g] || g} {pct}%
          </text>
        )
      })}
    </svg>
  )
}
