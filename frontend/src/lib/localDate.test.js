import { describe, expect, it } from 'vitest'
import localDateStr from './localDate.js'

describe('localDateStr', () => {
  it('returns the local calendar date, not UTC', () => {
    // 以本地時間構造凌晨 00:30——無論測試機時區為何都應是同一天
    // （若誤用 toISOString，UTC+8 環境會得到前一天）
    expect(localDateStr(new Date(2026, 10, 25, 0, 30))).toBe('2026-11-25')
  })

  it('zero-pads month and day', () => {
    expect(localDateStr(new Date(2026, 2, 7))).toBe('2026-03-07')
  })
})
