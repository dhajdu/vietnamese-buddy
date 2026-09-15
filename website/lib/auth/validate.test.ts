import { describe, it, expect } from 'vitest'
import { appPath, checkoutPath, isTimeZone } from './validate'

describe('appPath', () => {
  it('keeps paths inside the app', () => {
    expect(appPath('/app')).toBe('/app')
    expect(appPath('/app/lessons/abc')).toBe('/app/lessons/abc')
    expect(appPath('/app?x=1')).toBe('/app?x=1')
  })

  it('rejects anything else', () => {
    for (const raw of ['/apple', '/admin', '//evil.example', 'https://evil.example/app', '', null, undefined, ['/app']]) {
      expect(appPath(raw)).toBeNull()
    }
  })
})

describe('checkoutPath', () => {
  it('maps the two plans and nothing else', () => {
    expect(checkoutPath('monthly')).toBe('/app/billing?checkout=monthly')
    expect(checkoutPath('annual')).toBe('/app/billing?checkout=annual')
    expect(checkoutPath('lifetime')).toBeNull()
    expect(checkoutPath(undefined)).toBeNull()
  })
})

describe('isTimeZone', () => {
  it('accepts IANA zones', () => {
    expect(isTimeZone('Asia/Ho_Chi_Minh')).toBe(true)
    expect(isTimeZone('America/Los_Angeles')).toBe(true)
  })

  it('rejects junk', () => {
    for (const tz of ['Mars/Olympus', '', 'x'.repeat(65), 42, null]) expect(isTimeZone(tz)).toBe(false)
  })
})
