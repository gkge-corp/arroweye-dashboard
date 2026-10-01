export const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

export const addDays = (date: string, days: number) => {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return toDateKey(next);
};

export const todayKey = () => toDateKey(new Date());

export const listDates = (from: string, to: string) => {
  const dates: string[] = [];
  for (let date = from; date <= to; date = addDays(date, 1)) dates.push(date);
  return dates;
};

export const minDate = (a: string, b: string) => (a < b ? a : b);
export const maxDate = (a: string, b: string) => (a > b ? a : b);
