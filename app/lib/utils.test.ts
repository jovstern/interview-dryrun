import { describe, expect, it } from 'vitest'
import { parseStatus } from './utils'

describe('parseStatus', () => {
  it('returns a known status', () => {
    expect(parseStatus('reading')).toBe('reading')
  })

  it('returns undefined for anything else', () => {
    expect(parseStatus('bogus')).toBeUndefined()
    expect(parseStatus(undefined)).toBeUndefined()
    expect(parseStatus(['read', 'reading'])).toBeUndefined()
  })
})
