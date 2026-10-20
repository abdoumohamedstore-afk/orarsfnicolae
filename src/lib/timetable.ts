export type Lesson = { id: string; time: string; subject: string };
export type Timetable = {
  school: string;
  className: string;
  lessonLen: number;
  breakLen: number;
  days: Lesson[][]; // 5 entries, Mon..Fri
};

export const PALETTE_SIZE = 8;

let idCounter = 0;
export const newId = () => `l${Date.now().toString(36)}${(idCounter++).toString(36)}`;

export const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};
export const fromMin = (m: number) =>
  `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(Math.round(m) % 60).padStart(2, "0")}`;

export function subjectColorIndex(name: string) {
  const s = name.trim().toLowerCase();
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % PALETTE_SIZE;
}
export const subjectColor = (name: string) => `var(--subject-${subjectColorIndex(name)})`;

export function shortSubject(name: string) {
  return name.replace(/^Limba\s+/i, "").replace(/^Opțional\s+/i, "Opț. ");
}

export function emptyTimetable(): Timetable {
  return { school: "", className: "", lessonLen: 50, breakLen: 10, days: [[], [], [], [], []] };
}

export function nextLessonTime(day: Lesson[], lessonLen: number, breakLen: number) {
  if (day.length === 0) return "08:00";
  return fromMin(toMin(day[day.length - 1]!.time) + lessonLen + breakLen);
}

function buildDay(start: string, subjects: string[], len: number, brk: number): Lesson[] {
  return subjects.map((subject, i) => ({
    id: newId(),
    time: fromMin(toMin(start) + i * (len + brk)),
    subject,
  }));
}

export function exampleTimetable(): Timetable {
  return {
    school: "Școala Gimnazială Sfântul Nicolae Nr. 175",
    className: "V-A",
    lessonLen: 50,
    breakLen: 10,
    days: [
      buildDay("11:00", ["Matematică", "Ed. fizică", "Biologie", "Limba engleză", "Ed. plastică", "Opțional mediu"], 50, 10),
      buildDay("11:00", ["Istorie", "Religie", "Matematică", "Limba română", "Ed. muzicală"], 50, 10),
      buildDay("11:00", ["Istorie", "Ed. fizică", "Limba română", "Limba franceză", "Dirigenție"], 50, 10),
      buildDay("12:00", ["Ed. socială", "Matematică", "TIC", "Limba franceză", "Limba română"], 50, 10),
      buildDay("11:00", ["Matematică", "Limba engleză", "Limba română", "Geografie", "Ed. tehnologică"], 50, 10),
    ],
  };
}

export const isEmpty = (tt: Timetable | null) => !tt || tt.days.every((d) => d.length === 0);

export const dayIndexOf = (d: Date) => {
  const g = d.getDay();
  return g >= 1 && g <= 5 ? g - 1 : -1;
};

export const sortByTime = (day: Lesson[] = []) =>
  day.filter((l) => l.subject.trim()).slice().sort((a, b) => toMin(a.time) - toMin(b.time));

export type Status =
  | { kind: "lesson"; lesson: Lesson; next?: Lesson; minsLeft: number; progress: number }
  | { kind: "break"; next: Lesson; minsUntil: number }
  | { kind: "before"; first: Lesson; minsUntil: number }
  | { kind: "upcoming"; dayIndex: number; isTomorrow: boolean; lessons: Lesson[] }
  | { kind: "none" };

export function getStatus(tt: Timetable, now: Date): Status {
  const di = dayIndexOf(now);
  const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  if (di >= 0) {
    const day = sortByTime(tt.days[di]);
    const first = day[0];
    if (first) {
      if (nowMin < toMin(first.time))
        return { kind: "before", first, minsUntil: Math.ceil(toMin(first.time) - nowMin) };
      for (let i = 0; i < day.length; i++) {
        const cur = day[i];
        if (!cur) continue;
        const start = toMin(cur.time);
        const end = start + tt.lessonLen;
        const nxt = day[i + 1];
        if (nowMin >= start && nowMin < end)
          return {
            kind: "lesson",
            lesson: cur,
            ...(nxt ? { next: nxt } : {}),
            minsLeft: Math.ceil(end - nowMin),
            progress: (nowMin - start) / tt.lessonLen,
          };
        if (nxt && nowMin >= end && nowMin < toMin(nxt.time))
          return { kind: "break", next: nxt, minsUntil: Math.ceil(toMin(nxt.time) - nowMin) };
      }
    }
  }
  for (let off = 1; off <= 7; off++) {
    const d = new Date(now);
    d.setDate(d.getDate() + off);
    const idx = dayIndexOf(d);
    if (idx >= 0 && sortByTime(tt.days[idx]).length)
      return { kind: "upcoming", dayIndex: idx, isTomorrow: off === 1, lessons: sortByTime(tt.days[idx]) };
  }
  return { kind: "none" };
}

export function lessonState(l: Lesson, tt: Timetable, now: Date): "past" | "current" | "future" {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const s = toMin(l.time);
  if (nowMin >= s + tt.lessonLen) return "past";
  if (nowMin >= s) return "current";
  return "future";
}
