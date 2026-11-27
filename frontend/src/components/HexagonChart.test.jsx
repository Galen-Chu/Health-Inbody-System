import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import HexagonChart from './HexagonChart.jsx'

const TARGETS = { grains: 4, protein: 6, dairy: 1.5, vegetables: 4, fruits: 3, oils: 6 }
const INTAKE = { grains: 2, protein: 4 }
const LABELS = {
  grains: '全榖雜糧', protein: '豆魚蛋肉', dairy: '乳品',
  vegetables: '蔬菜', fruits: '水果', oils: '油脂堅果',
}

describe('HexagonChart', () => {
  it('renders all six group labels with achievement percentages', () => {
    render(<HexagonChart targets={TARGETS} intake={INTAKE} labels={LABELS} />)
    expect(screen.getByText('全榖雜糧')).toBeTruthy()
    expect(screen.getByText('豆魚蛋肉')).toBeTruthy()
    expect(screen.getByText('50%')).toBeTruthy()          // grains 2/4
    expect(screen.getByText('67%')).toBeTruthy()          // protein 4/6
    expect(screen.getAllByText('0%').length).toBe(4)      // 未記錄的四類
  })

  it('keeps every label anchor inside the viewBox (regression: 裁切修正)', () => {
    const { container } = render(
      <HexagonChart targets={TARGETS} intake={INTAKE} labels={LABELS} />)
    const texts = container.querySelectorAll('text')
    expect(texts.length).toBe(6)
    const HALF_LABEL = 46   // 最長標籤「豆魚蛋肉/油脂堅果」4 字 ×12px 的一半＋餘裕
    texts.forEach((t) => {
      const x = Number(t.getAttribute('x'))
      const y = Number(t.getAttribute('y'))
      expect(x).toBeGreaterThanOrEqual(HALF_LABEL)
      expect(x).toBeLessThanOrEqual(380 - HALF_LABEL)
      expect(y).toBeGreaterThanOrEqual(20)
      expect(y).toBeLessThanOrEqual(360)
    })
  })
})
