import { describe, expect, it } from 'vitest'
import portionChips from './portions.js'

const UNITS = {
  grains: { label: '全榖雜糧類', unit: '碗', grams: 200 },
  protein: { label: '豆魚蛋肉類', unit: '份', grams: 35 },
}

describe('portionChips', () => {
  it('builds half/one/two serving buttons with grams', () => {
    const chips = portionChips('grains', UNITS)
    expect(chips).toEqual([
      { label: '½ 碗', grams: 100, hint: '全榖雜糧類 ½ 碗 ≈ 100g' },
      { label: '1 碗', grams: 200, hint: '全榖雜糧類 1 碗 ≈ 200g' },
      { label: '2 碗', grams: 400, hint: '全榖雜糧類 2 碗 ≈ 400g' },
    ])
  })

  it('rounds non-integer grams (protein 35g × 0.5)', () => {
    expect(portionChips('protein', UNITS)[0].grams).toBe(18)
  })

  it('returns empty for categories without units (other)', () => {
    expect(portionChips('other', UNITS)).toEqual([])
    expect(portionChips('grains', {})).toEqual([])
    expect(portionChips('grains', null)).toEqual([])
  })
})
