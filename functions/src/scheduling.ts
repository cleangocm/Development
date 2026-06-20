export const OFFICIAL_PICKUP_WEEKDAYS = [2, 4, 5, 6] as const;

export interface SchedulePlan {
  pickupFrequency: number;
  preferredWeekdays: number[];
  startDate: Date;
  horizonDays?: number;
}

export function dateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function pickupDocumentId(subscriptionId: string, date: Date): string {
  return `${subscriptionId}_${dateKey(date)}`;
}

export function validatePreferredWeekdays(frequency: number, weekdays: number[]): number[] {
  if (!Number.isInteger(frequency) || frequency < 1 || frequency > OFFICIAL_PICKUP_WEEKDAYS.length) {
    throw new Error('Pickup frequency must be between 1 and 4.');
  }
  const unique = [...new Set(weekdays)].sort((a, b) => a - b);
  if (unique.length !== frequency) {
    throw new Error(`This plan requires exactly ${frequency} preferred pickup day(s).`);
  }
  if (unique.some((day) => !OFFICIAL_PICKUP_WEEKDAYS.includes(day as 2 | 4 | 5 | 6))) {
    throw new Error('Preferred pickup days must be Tuesday, Thursday, Friday, or Saturday.');
  }
  return unique;
}

export function generateScheduleDates(input: SchedulePlan): Date[] {
  const weekdays = validatePreferredWeekdays(input.pickupFrequency, input.preferredWeekdays);
  const horizonDays = input.horizonDays ?? 28;
  if (!Number.isInteger(horizonDays) || horizonDays < 1 || horizonDays > 90) {
    throw new Error('Schedule horizon must be between 1 and 90 days.');
  }

  const cursor = new Date(input.startDate);
  if (Number.isNaN(cursor.getTime())) throw new Error('A valid schedule start date is required.');
  cursor.setUTCHours(9, 0, 0, 0);
  const end = new Date(cursor);
  end.setUTCDate(end.getUTCDate() + horizonDays - 1);

  const dates: Date[] = [];
  while (cursor <= end) {
    if (weekdays.includes(cursor.getUTCDay())) dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}
