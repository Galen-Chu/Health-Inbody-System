import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import TrendChart from './TrendChart.jsx'

const DATA = [
  { date: '2026-10-01', value: 71.5 },
  { date: '2026-10-15', value: 70.8 },
  { date: '2026-10-28', value: 70.2 },
]

describe('TrendChart（冒煙測試）', () => {
  it('有資料時渲染標題與端點值', () => {
    render(<TrendChart title="體重 Weight" unit=" kg"
      color="#2a78d6" data={DATA} />)
    expect(screen.getByText('體重 Weight')).toBeTruthy()
    // 端點值 70.2 kg（text 元素內含格式化數字＋單位）
    expect(screen.getByText((_, el) => el?.tagName === 'text'
      && el.textContent === '70.2 kg')).toBeTruthy()
  })

  it('無資料時顯示空狀態訊息', () => {
    render(<TrendChart title="體脂率" unit=" %" color="#eb6834" data={[]} />)
    expect(screen.getByText('尚無量測資料')).toBeTruthy()
  })
})
