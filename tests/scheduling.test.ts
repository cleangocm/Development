import { describe, expect, it } from 'vitest';
import {
  dateKey,
  generateScheduleDates,
  pickupDocumentId,
  validatePreferredWeekdays,
} from '../functions/src/scheduling';

describe('CleanGo recurring scheduling', () => {
  it('generates one weekly Basic pickup on the preferred day', () => {
    const dates = generateScheduleDates({
      pickupFrequency: 1,
      preferredWeekdays: [2],
      startDate: new Date('2026-06-15T09:00:00.000Z'),
      horizonDays: 28,
    });

    expect(dates.map(dateKey)).toEqual([
      '2026-06-16',
      '2026-06-23',
      '2026-06-30',
      '2026-07-07',
    ]);
  });

  it('generates two weekly Standard/Popular pickups exactly once per date', () => {
    const dates = generateScheduleDates({
      pickupFrequency: 2,
      preferredWeekdays: [4, 6],
      startDate: new Date('2026-06-15T09:00:00.000Z'),
      horizonDays: 14,
    });
    const ids = dates.map((date) => pickupDocumentId('subscription-a', date));

    expect(ids).toEqual([
      'subscription-a_2026-06-18',
      'subscription-a_2026-06-20',
      'subscription-a_2026-06-25',
      'subscription-a_2026-06-27',
    ]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('accepts all four official days for a four-pickup plan', () => {
    expect(validatePreferredWeekdays(4, [6, 2, 5, 4])).toEqual([2, 4, 5, 6]);
  });

  it('rejects wrong frequency counts, duplicate days, and unofficial days', () => {
    expect(() => validatePreferredWeekdays(2, [2])).toThrow('exactly 2');
    expect(() => validatePreferredWeekdays(2, [2, 2])).toThrow('exactly 2');
    expect(() => validatePreferredWeekdays(1, [1])).toThrow('Tuesday, Thursday, Friday, or Saturday');
  });

  it('rejects invalid scheduling horizons', () => {
    expect(() => generateScheduleDates({
      pickupFrequency: 1,
      preferredWeekdays: [2],
      startDate: new Date('2026-06-15T09:00:00.000Z'),
      horizonDays: 91,
    })).toThrow('between 1 and 90');
  });
});
