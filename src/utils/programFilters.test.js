import { test, expect, vi, describe, beforeEach, afterEach, useFakeTimers, userRealTimers } from 'vitest'

import { isEventUpcoming, isDateUpcoming } from './programFilters'

describe('isEventUpcoming works', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })
    afterEach(() => {
        vi.useRealTimers()
    })

    
    test('date', () => {
        vi.setSystemTime(new Date('2024-02-15'))
        expect(isEventUpcoming({ endDate: new Date('2024-02-15')})).toBe(true)

        vi.setSystemTime(new Date('2024-02-15T01:01:00'))
        expect(isEventUpcoming({ endDate: new Date('2024-02-15')})).toBe(true)

        vi.setSystemTime(new Date('2024-02-15T23:24:00'))
        expect(isEventUpcoming({ endDate: new Date('2024-02-15')})).toBe(true)
    })

})

describe('isDateUpcoming works', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })
    afterEach(() => {
        vi.useRealTimers()
    })

    
    test('date', () => {
        vi.setSystemTime(new Date('2024-02-15'))
        expect(isDateUpcoming(new Date('2024-02-15'))).toBe(true)

        vi.setSystemTime(new Date('2024-02-15T01:01:00'))
        expect(isDateUpcoming(new Date('2024-02-15'))).toBe(true)

        vi.setSystemTime(new Date('2024-02-15T23:24:00'))
        expect(isDateUpcoming(new Date('2024-02-15'))).toBe(true)
    })
})