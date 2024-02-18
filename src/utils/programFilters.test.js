import { test, expect, vi, describe, beforeEach, afterEach } from 'vitest';

import {
    isEventUpcoming,
    isDateUpcoming,
    isAfterPubDate,
} from './programFilters';

describe('isDateUpcoming works', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    test('same date passes (early)', () => {
        vi.setSystemTime(new Date('2024-02-15T00:00:00-06:00'));
        expect(isDateUpcoming(new Date('2024-02-15T00:00Z'))).toBe(true);
    });
    test('same date passes (late)', () => {
        vi.setSystemTime(new Date('2024-02-15T23:59:59-06:00'));
        expect(isDateUpcoming(new Date('2024-02-15T00:00Z'))).toBe(true);
    });

    test('later date does not pass (early)', () => {
        vi.setSystemTime(new Date('2024-02-16T00:00-06:00'));
        expect(isDateUpcoming(new Date('2024-02-15T00:00Z'))).toBe(false);
    });
    test('later date does not pass (late)', () => {
        vi.setSystemTime(new Date('2024-02-16T23:59:59-06:00'));
        expect(isDateUpcoming(new Date('2024-02-15T00:00Z'))).toBe(false);
    });

    test('earlier date does pass (early)', () => {
        vi.setSystemTime(new Date('2024-02-14T00:00-06:00'));
        expect(isDateUpcoming(new Date('2024-02-15T00:00Z'))).toBe(true);
    });
    test('earlier date does pass (late)', () => {
        vi.setSystemTime(new Date('2024-02-14T23:59:59-06:00'));
        expect(isDateUpcoming(new Date('2024-02-15T00:00Z'))).toBe(true);
    });
});

describe('isEventUpcoming works', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    test('same date passes (early)', () => {
        vi.setSystemTime(new Date('2024-02-15T00:00:00-06:00'));
        expect(isEventUpcoming({ endDate: new Date('2024-02-15') })).toBe(true);
    });
    test('same date passes (late)', () => {
        vi.setSystemTime(new Date('2024-02-15T23:59:59-06:00'));
        expect(isEventUpcoming({ endDate: new Date('2024-02-15') })).toBe(true);
    });

    test('later date does not pass (early)', () => {
        vi.setSystemTime(new Date('2024-02-16T00:00:00-06:00'));
        expect(isEventUpcoming({ endDate: new Date('2024-02-15') })).toBe(
            false
        );
    });
    test('later date does not pass (late)', () => {
        vi.setSystemTime(new Date('2024-02-16T23:59:59-06:00'));
        expect(isEventUpcoming({ endDate: new Date('2024-02-15') })).toBe(
            false
        );
    });
});

describe('isAfterPubDate works', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    test('day before fails (early)', () => {
        vi.setSystemTime(new Date('2024-02-14T00:00:00-06:00'));
        expect(isAfterPubDate({ pubDate: new Date('2024-02-15T00:00Z') })).toBe(
            false
        );
    });
    test('day before fails (late)', () => {
        vi.setSystemTime(new Date('2024-02-14T23:59:59-06:00'));
        expect(isAfterPubDate({ pubDate: new Date('2024-02-15T00:00Z') })).toBe(
            false
        );
    });

    test('same date passes (early)', () => {
        vi.setSystemTime(new Date('2024-02-15T00:00:00-06:00'));
        expect(isAfterPubDate({ pubDate: new Date('2024-02-15T00:00Z') })).toBe(
            true
        );
    });
    test('same date passes (late)', () => {
        vi.setSystemTime(new Date('2024-02-15T23:59:59-06:00'));
        expect(isAfterPubDate({ pubDate: new Date('2024-02-15T00:00Z') })).toBe(
            true
        );
    });

    test('day after passes (early)', () => {
        vi.setSystemTime(new Date('2024-02-16T00:00:00-06:00'));
        expect(isAfterPubDate({ pubDate: new Date('2024-02-15T00:00Z') })).toBe(
            true
        );
    });
    test('day after passes (late)', () => {
        vi.setSystemTime(new Date('2024-02-16T23:59:59-06:00'));
        expect(isAfterPubDate({ pubDate: new Date('2024-02-15T00:00Z') })).toBe(
            true
        );
    });
});
