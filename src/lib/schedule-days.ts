/** Calendar policy lives here. Part 2 can add holidays without changing features. */
export const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const parseDate = (key: string) => new Date(`${key}T12:00:00`);
export function isSchoolDay(date: Date): boolean {
  return date.getDay() >= 1 && date.getDay() <= 5;
}
/** Always strictly after the supplied date; preserve local dates across DST. */
export function nextSchoolDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(12, 0, 0, 0);
  do { next.setDate(next.getDate() + 1); } while (!isSchoolDay(next));
  return next;
}
export const schoolDayIndex = (date: Date) => isSchoolDay(date) ? date.getDay() - 1 : -1;
export function weekStart(date: Date) {
  const day = new Date(date);
  day.setHours(12, 0, 0, 0);
  while (day.getDay() !== 1) day.setDate(day.getDate() - 1);
  return day;
}
export function formatSchoolDate(date: Date, lang: "ro" | "en") {
  return new Intl.DateTimeFormat(lang === "ro" ? "ro-RO" : "en-GB", { weekday: "long", day: "numeric", month: "long" }).format(date);
}
