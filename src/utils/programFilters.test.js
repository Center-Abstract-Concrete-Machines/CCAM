import { test, expect, vi, describe, beforeEach, afterEach } from 'vitest';

import { isEventUpcoming, isDateUpcoming } from './programFilters';

describe('isEventUpcoming works', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    test('same date passes', () => {
        vi.setSystemTime(new Date('2024-02-15'));
        expect(isEventUpcoming({ endDate: new Date('2024-02-15') })).toBe(true);

        vi.setSystemTime(new Date('2024-02-15T00:00:00'));
        expect(isEventUpcoming({ endDate: new Date('2024-02-15') })).toBe(true);

        vi.setSystemTime(new Date('2024-02-15T23:59:59'));
        expect(isEventUpcoming({ endDate: new Date('2024-02-15') })).toBe(true);
    });

    test('later date does not pass', () => {
        vi.setSystemTime(new Date('2024-02-16T00:00:00'));
        expect(isEventUpcoming({ endDate: new Date('2024-02-15') })).toBe(
            false
        );

        vi.setSystemTime(new Date('2024-02-16T12:00:00'));
        expect(isEventUpcoming({ endDate: new Date('2024-02-15') })).toBe(
            false
        );

        vi.setSystemTime(new Date('2024-02-16T23:59:59'));
        expect(isEventUpcoming({ endDate: new Date('2024-02-15') })).toBe(
            false
        );
    });
});

describe('isDateUpcoming works', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    test('same date passes', () => {
        vi.setSystemTime(new Date('2024-02-15'));
        expect(isDateUpcoming(new Date('2024-02-15'))).toBe(true);

        vi.setSystemTime(new Date('2024-02-15T00:00:00'));
        expect(isDateUpcoming(new Date('2024-02-15'))).toBe(true);

        vi.setSystemTime(new Date('2024-02-15T23:59:59'));
        expect(isDateUpcoming(new Date('2024-02-15'))).toBe(true);
    });

    test('later date does not pass', () => {
        vi.setSystemTime(new Date('2024-02-16T00:00:00'));
        expect(isDateUpcoming(new Date('2024-02-15'))).toBe(false);

        vi.setSystemTime(new Date('2024-02-16T12:00:00'));
        expect(isDateUpcoming(new Date('2024-02-15'))).toBe(false);

        vi.setSystemTime(new Date('2024-02-16T23:59:59'));
        expect(isDateUpcoming(new Date('2024-02-15'))).toBe(false);
    });

    test('earlier date does pass', () => {
        vi.setSystemTime(new Date('2024-02-14T00:00:00'));
        expect(isDateUpcoming(new Date('2024-02-15'))).toBe(true);

        vi.setSystemTime(new Date('2024-02-14T12:00:00'));
        expect(isDateUpcoming(new Date('2024-02-15'))).toBe(true);

        vi.setSystemTime(new Date('2024-02-14T23:59:59'));
        expect(isDateUpcoming(new Date('2024-02-15'))).toBe(true);
    });
});
