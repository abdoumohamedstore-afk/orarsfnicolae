import { z } from "zod";
import { homeworkSchema, studentSchema, timetableSchema, type Homework, type StudentData } from "./student-data";
import { newId, sortByTime, type Timetable } from "./timetable";

/**
 * Self-contained share: the data is embedded (base64url JSON) in the URL hash.
 * Nothing is stored on a server, so shared copies cannot be expired or revoked.
 */
const compactSchema = z.object({
  v: z.literal(1),
  s: z.string().max(120).default(""), c: z.string().max(40).default(""), l: z.number(), b: z.number(),
  d: z.array(z.array(z.tuple([z.string(), z.string().max(60)])).max(16)).length(5),
  h: z.array(z.tuple([z.enum(["homework", "test"]), z.string().max(60), z.string().max(200), z.string()])).max(40).default([]),
});
export type SharePayload = { timetable: Timetable; homework: Homework[]; fields: ShareOptions };
export type ShareOptions = { school: boolean; className: boolean; homework: boolean };
/** Defaults share timetable essentials only (times, subjects, lengths). */
export const DEFAULT_SHARE_OPTIONS: ShareOptions = { school: false, className: false, homework: false };
/** Practical limit for a QR code that phone cameras still scan reliably. */
export const MAX_QR_URL = 1800;

const b64urlEncode = (s: string) => {
  const bytes = new TextEncoder().encode(s); let bin = "";
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const b64urlDecode = (s: string) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
};

/** Encodes timetable essentials plus only the optional fields the sender selected. */
export function encodeShare(state: StudentData, today: string, opts: ShareOptions = DEFAULT_SHARE_OPTIONS): string {
  const tt = state.timetable;
  if (!tt) return "";
  const payload: Record<string, unknown> = {
    v: 1, l: tt.lessonLen, b: tt.breakLen,
    d: tt.days.map(day => sortByTime(day).filter(l => l.subject.trim()).map(l => [l.time, l.subject.trim()])),
  };
  if (opts.school && tt.school.trim()) payload.s = tt.school.trim();
  if (opts.className && tt.className.trim()) payload.c = tt.className.trim();
  if (opts.homework) payload.h = state.homework.filter(h => !h.done && h.due >= today).slice(0, 40).map(h => [h.type, h.subject, h.title, h.due]);
  return b64urlEncode(JSON.stringify(payload));
}

/** Decodes and validates a share code; returns null for anything malformed. */
export function decodeShare(code: string): SharePayload | null {
  try {
    const raw = JSON.parse(b64urlDecode(code.trim())) as Record<string, unknown>;
    const c = compactSchema.parse(raw);
    const timetable = timetableSchema.parse({
      school: c.s, className: c.c, lessonLen: c.l, breakLen: c.b,
      days: c.d.map(day => day.map(([time, subject]) => ({ id: newId(), time, subject }))),
    });
    const homework = c.h.map(([type, subject, title, due]) => homeworkSchema.parse({ id: newId(), type, subject, title, note: "", due, done: false }));
    return { timetable, homework, fields: { school: !!c.s, className: !!c.c, homework: homework.length > 0 } };
  } catch {
    return null;
  }
}

export type ImportMode = "merge" | "replace";
const hwKey = (h: Homework) => `${h.subject}|${h.title}|${h.due}`.toLocaleLowerCase();

/** Replace swaps the timetable; merge keeps it and adds missing lessons. Homework is added without duplicates either way. */
export function applyShare(state: StudentData, p: SharePayload, mode: ImportMode): StudentData {
  const existing = new Set(state.homework.map(hwKey));
  const homework = [...state.homework, ...p.homework.filter(h => !existing.has(hwKey(h)))];
  if (mode === "replace" || !state.timetable) return { ...state, timetable: p.timetable, homework };
  const cur = state.timetable;
  const days = cur.days.map((day, i) => {
    const have = new Set(day.map(l => `${l.time}|${l.subject.trim().toLocaleLowerCase()}`));
    return sortByTime([...day, ...(p.timetable.days[i] ?? []).filter(l => !have.has(`${l.time}|${l.subject.trim().toLocaleLowerCase()}`))]);
  });
  return { ...state, homework, timetable: { ...cur, school: cur.school || p.timetable.school, className: cur.className || p.timetable.className, days } };
}

export const shareUrl = (origin: string, code: string) => `${origin}/share#d=${code}`;

/** Share file used when the payload is too large for a QR code. */
export const shareFile = (code: string) => JSON.stringify({ app: "orar-share", v: 1, code });
export function codeFromFile(text: string): string | null {
  try { const j = JSON.parse(text) as { app?: string; code?: unknown }; return j.app === "orar-share" && typeof j.code === "string" ? j.code : null; } catch { return null; }
}

export const RECOVERY_KEY = "orar.recovery.v1";
export function saveRecovery(state: StudentData) { try { localStorage.setItem(RECOVERY_KEY, JSON.stringify(state)); } catch { /* storage full */ } }
export function loadRecovery(): StudentData | null {
  try { const r = localStorage.getItem(RECOVERY_KEY); return r ? studentSchema.parse(JSON.parse(r)) : null; } catch { return null; }
}
