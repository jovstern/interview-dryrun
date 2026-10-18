import { describe, expect, it } from 'vitest'
import { escapeLike, firstParam, parseStatus } from './utils'

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

describe('escapeLike', () => {
  it('escapes LIKE wildcards and the escape character', () => {
    expect(escapeLike('50%_off\\')).toBe('50\\%\\_off\\\\')
  })
})

describe('firstParam', () => {
  it('returns a single value as is', () => {
    expect(firstParam('a')).toBe('a')
  })

  it('returns the first of repeated values', () => {
    expect(firstParam(['a', 'b'])).toBe('a')
  })

  it('returns undefined when the param is missing', () => {
    expect(firstParam(undefined)).toBeUndefined()
  })
})
