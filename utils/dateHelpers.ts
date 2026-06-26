import { format, parseISO, isToday, isYesterday } from 'date-fns';

export const formatDisplayDate = (isoDate: string): string =>
  format(parseISO(isoDate), 'd MMM yyyy');

export const formatMonthYear = (isoDate: string): string =>
  format(parseISO(isoDate), 'MMMM yyyy');

export const formatShortDate = (isoDate: string): string =>
  format(parseISO(isoDate), 'd MMM');

export const formatDayOfWeek = (isoDate: string): string =>
  format(parseISO(isoDate), 'EEEE');

export const formatShortDay = (isoDate: string): string =>
  format(parseISO(isoDate), 'EEE');

export const toISODateString = (date: Date): string =>
  format(date, 'yyyy-MM-dd');

export const getRelativeLabel = (isoDate: string): string => {
  const d = parseISO(isoDate);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'd MMM yyyy');
};

export const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const todayISO = (): string => format(new Date(), 'yyyy-MM-dd');
