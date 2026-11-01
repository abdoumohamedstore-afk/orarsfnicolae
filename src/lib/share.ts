import { z } from "zod";
import { homeworkSchema, timetableSchema, type Homework, type StudentData } from "./student-data";
import { newId, type Timetable } from "./timetable";

/** Compact, versioned share payload carried in a URL hash (no server involved). */
const compactSchema = z.object({
  v: z.literal(1),
  s: z.string().max(120), c: z.string().max(40), l: z.number(), b: z.number(),
  d: z.array(z.array(z.tuple([z.string(), z.string().max(60)])).max(16)).length(5),
  h: z.array(z.tuple([z.enum(["homework", "test"]), z.string().max(60), z.string().max(200), z.string()])).max(40),
});
export type SharePayload = { timetable: Timetable; homework: Homework[] };

const b64urlEncode = (s: string) => {
  const bytes = new TextEncoder().encode(s); let bin = "";
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const b64urlDecode = (s: string) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
};

/** Encodes the timetable plus open (not done) homework due from `today` onward. */
export function encodeShare(state: StudentData, today: string, includeHomework: boolean): string {
  const tt = state.timetable;
  if (!tt) return "";
  const payload = {
    v: 1, s: tt.school, c: tt.className, l: tt.lessonLen, b: tt.breakLen,
    d: tt.days.map(day => day.filter(l => l.subject.trim()).map(l => [l.time, l.subject.trim()])),
    h: includeHomework ? state.homework.filter(h => !h.done && h.due >= today).slice(0, 40).map(h => [h.type, h.subject, h.title, h.due]) : [],
  };
  return b64urlEncode(JSON.stringify(payload));
}

/** Decodes and validates a share code; returns null for anything malformed. */
export function decodeShare(code: string): SharePayload | null {
  try {
    const c = compactSchema.parse(JSON.parse(b64urlDecode(code)));
    const timetable = timetableSchema.parse({
      school: c.s, className: c.c, lessonLen: c.l, breakLen: c.b,
      days: c.d.map(day => day.map(([time, subject]) => ({ id: newId(), time, subject }))),
    });
    const homework = c.h.map(([type, subject, title, due]) => homeworkSchema.parse({ id: newId(), type, subject, title, note: "", due, done: false }));
    return { timetable, homework };
  } catch {
    return null;
  }
}

/** Replaces the timetable and adds shared homework that isn't already present. */
export function applyShare(state: StudentData, p: SharePayload): StudentData {
  const key = (h: Homework) => `${h.subject}|${h.title}|${h.due}`.toLocaleLowerCase();
  const existing = new Set(state.homework.map(key));
  return { ...state, timetable: p.timetable, homework: [...state.homework, ...p.homework.filter(h => !existing.has(key(h)))] };
}

export const shareUrl = (origin: string, code: string) => `${origin}/share#d=${code}`;
