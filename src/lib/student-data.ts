import { z } from "zod";
import { dateKey, nextSchoolDay, schoolDayIndex } from "./schedule-days";
import { emptyTimetable, sortByTime, type Timetable } from "./timetable";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s => { const d = new Date(`${s}T12:00:00`); return !Number.isNaN(d.getTime()) && dateKey(d) === s; });
const lesson = z.object({ id: z.string(), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), subject: z.string() });
export const timetableSchema = z.object({ school: z.string(), className: z.string(), lessonLen: z.number().int().min(1).max(240), breakLen: z.number().int().min(0).max(120), days: z.array(z.array(lesson)).length(5) });
const homeworkSchema = z.object({ id: z.string(), type: z.enum(["homework", "test"]), subject: z.string().min(1), title: z.string().min(1), note: z.string(), due: date, done: z.boolean() });
export type Homework = z.infer<typeof homeworkSchema>;
const packSchema = z.object({ checked: z.array(z.string()), extras: z.array(z.object({ id: z.string(), title: z.string() })) });
const remindersSchema = z.object({ lessons: z.boolean(), evening: z.boolean(), time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/) });
export const studentSchema = z.object({
  version: z.literal(1), timetable: timetableSchema.nullable(), homework: z.array(homeworkSchema),
  materials: z.record(z.string(), z.array(z.string())), packing: z.record(z.string(), packSchema),
  reminders: remindersSchema, lang: z.enum(["ro", "en"]), theme: z.enum(["auto", "light", "dark"]),
});
export type StudentData = z.infer<typeof studentSchema>;
export function emptyStudentData(): StudentData {
  return { version: 1, timetable: null, homework: [], materials: {}, packing: {}, reminders: { lessons: false, evening: false, time: "20:00" }, lang: "en", theme: "auto" };
}
export function importBackup(value: unknown, current = emptyStudentData()): StudentData {
  const full = studentSchema.safeParse(value);
  if (full.success) return full.data;
  // Backward-compatible timetable-only exports from the original app.
  return { ...current, timetable: timetableSchema.parse(value) };
}
export function subjectsOf(tt: Timetable | null) {
  return [...new Set((tt?.days.flat() ?? []).map(l => l.subject.trim()).filter(Boolean))].sort();
}
export function nextSubjectDate(tt: Timetable | null, subject: string, today: Date): string {
  let next = nextSchoolDay(today);
  for (let i = 0; i < 370; i++) {
    if (sortByTime(tt?.days[schoolDayIndex(next)] ?? []).some(l => l.subject.trim() === subject)) return dateKey(next);
    next = nextSchoolDay(next);
  }
  return dateKey(nextSchoolDay(today));
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
