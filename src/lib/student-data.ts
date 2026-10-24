import { z } from "zod";
import { dateKey, nextSchoolDay, schoolDayIndex, type CalendarSettings, type CountyWeekChoice, type GradeBand } from "./schedule-days";
import { emptyTimetable, sortByTime, type Timetable } from "./timetable";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s => { const d = new Date(`${s}T12:00:00`); return !Number.isNaN(d.getTime()) && dateKey(d) === s; });
const lesson = z.object({ id: z.string(), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), subject: z.string() });
export const timetableSchema = z.object({ school: z.string(), className: z.string(), lessonLen: z.number().int().min(1).max(240), breakLen: z.number().int().min(0).max(120), days: z.array(z.array(lesson)).length(5) });
export const homeworkSchema = z.object({ id: z.string(), type: z.enum(["homework", "test"]), subject: z.string().trim().min(1), title: z.string().trim().min(1), note: z.string(), due: date, done: z.boolean() });
export type Homework = z.infer<typeof homeworkSchema>;
const packSchema = z.object({ checked: z.array(z.string()), extras: z.array(z.object({ id: z.string(), title: z.string() })) });
const remindersSchema = z.object({ lessons: z.boolean(), evening: z.boolean(), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/) });
export const specialWeekSchema = z.object({ id: z.string(), label: z.string().trim().min(1), from: date, to: date, lessonsApply: z.boolean() }).refine(w => w.from <= w.to);
export const dayOffSchema = z.object({ id: z.string(), date, label: z.string().trim().min(1) });
export const studentSchema = z.object({
  version: z.literal(2), timetable: timetableSchema.nullable(), homework: z.array(homeworkSchema),
  materials: z.record(z.string(), z.array(z.string())), packing: z.record(z.string(), packSchema),
  reminders: remindersSchema, lang: z.enum(["ro", "en"]), theme: z.enum(["auto", "light", "dark"]),
  grade: z.enum(["V-VII", "VIII", "XII-XIII"]), countyWeek: z.enum(["unknown", "A", "B"]),
  specialWeeks: z.array(specialWeekSchema), daysOff: z.array(dayOffSchema),
});
export type StudentData = z.infer<typeof studentSchema>;
export function emptyStudentData(): StudentData {
  return { version: 2, timetable: null, homework: [], materials: {}, packing: {}, reminders: { lessons: false, evening: false, time: "20:00" }, lang: "en", theme: "auto", grade: "V-VII", countyWeek: "unknown", specialWeeks: [], daysOff: [] };
}
/** Calendar settings view of the stored student data, used by the day-status engine. */
export function settingsOf(state: StudentData, lang?: "ro" | "en"): CalendarSettings {
  return { grade: state.grade as GradeBand, countyWeek: state.countyWeek as CountyWeekChoice, specialWeeks: state.specialWeeks, daysOff: state.daysOff, lang: lang ?? state.lang };
}
/** v1 backups lack the calendar fields; fill defaults before validating as v2. */
function migrateV1(value: Record<string, unknown>): unknown {
  if (value["version"] !== 1) return value;
  return { ...value, version: 2, grade: "V-VII", countyWeek: "unknown", specialWeeks: [], daysOff: [] };
}
export function importBackup(value: unknown, current = emptyStudentData()): StudentData {
  const full = studentSchema.safeParse(value);
  if (full.success) return full.data;
  if (value && typeof value === "object") {
    const migrated = studentSchema.safeParse(migrateV1(value as Record<string, unknown>));
    if (migrated.success) return migrated.data;
  }
  // Backward-compatible timetable-only exports from the original app.
  return { ...current, timetable: timetableSchema.parse(value) };
}
export function subjectsOf(tt: Timetable | null) {
  return [...new Set((tt?.days.flat() ?? []).map(l => l.subject.trim()).filter(Boolean))].sort();
}
export function nextSubjectDate(tt: Timetable | null, subject: string, today: Date, settings?: CalendarSettings): string {
  const first = nextSchoolDay(today, settings);
  if (!first) return "";
  let next: Date | null = first;
  for (let i = 0; next && i < 370; i++) {
    if (sortByTime(tt?.days[schoolDayIndex(next)] ?? []).some(l => l.subject.trim() === subject)) return dateKey(next);
    next = nextSchoolDay(next, settings);
  }
  return dateKey(first);
}
export type PackingItem = { id: string; title: string; subject?: string };
export function packingItems(state: StudentData, day: Date): PackingItem[] {
  const subjects = new Set(sortByTime(state.timetable?.days[schoolDayIndex(day)] ?? []).map(l => l.subject.trim()));
  const seen = new Set<string>();
  const items: PackingItem[] = [];
  for (const subject of subjects) for (const raw of state.materials[subject] ?? []) {
    const title = raw.trim(); const key = title.toLocaleLowerCase();
    if (!title || seen.has(key)) continue;
    seen.add(key); items.push({ id: `material:${key}`, title, subject });
  }
  for (const hw of state.homework.filter(h => !h.done && h.due === dateKey(day))) items.push({ id: `homework:${hw.id}`, title: hw.title, subject: hw.subject });
  for (const extra of state.packing[dateKey(day)]?.extras ?? []) items.push({ id: `extra:${extra.id}`, title: extra.title });
  return items;
}
export function normalizedTimetable(tt: Timetable): Timetable {
  return timetableSchema.parse({ ...emptyTimetable(), ...tt });
}
