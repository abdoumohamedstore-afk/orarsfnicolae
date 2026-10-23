import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Dot, Page, PageHeader } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useApp } from "@/lib/store";
import { ACTIVE_CALENDAR } from "@/lib/calendar-2026-2027";
import { dateKey, daysUntil, formatSchoolDate, getDayStatus, parseDate, schoolDayIndex, type DayStatus } from "@/lib/schedule-days";
import { homeworkSchema, settingsOf, subjectsOf, type Homework } from "@/lib/student-data";
import { newId, sortByTime } from "@/lib/timetable";

export const Route = createFileRoute("/calendar")({ head: () => ({ meta: [
  { title: "Calendar · Orar" },
  { name: "description", content: "The 2026–2027 school year: classes, breaks, holidays and homework due dates." },
  { property: "og:title", content: "Calendar · Orar" },
  { property: "og:description", content: "The 2026–2027 school year: classes, breaks, holidays and homework due dates." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
] }), component: CalendarPage });

const field = "mt-1 w-full rounded-2xl border border-input bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";
const FIRST_MONTH = { y: 2026, m: 8 }; // September 2026
const LAST_MONTH = { y: 2027, m: 6 }; // July 2027 (shows the last class days of June)

function monthStart(y: number, m: number) { return new Date(y, m, 1, 12); }
function sameMonth(a: Date, y: number, m: number) { return a.getFullYear() === y && a.getMonth() === m; }

function DayCell({ date, status, today, due, onTap }: { date: Date; status: DayStatus; today: boolean; due: boolean; onTap: () => void }) {
  const colored = status.type !== "school" && status.type !== "weekend";
  return (
    <button
      onClick={onTap}
      className={`relative flex min-h-11 flex-col items-center justify-start rounded-xl px-0.5 py-1 text-xs transition-transform active:scale-95 ${today ? "ring-2 ring-primary" : ""} ${status.dashed ? "border border-dashed" : ""}`}
      style={{
        background: colored ? `color-mix(in oklab, ${status.color} 28%, transparent)` : status.type === "school" ? "color-mix(in oklab, var(--cal-school) 18%, transparent)" : undefined,
        borderColor: status.dashed ? status.color : undefined,
      }}
      aria-label={`${formatSchoolDate(date, "ro")} · ${status.label}`}
    >
      <span className={`font-semibold ${status.type === "weekend" ? "text-muted-foreground" : ""}`}>{date.getDate()}</span>
      {status.badge && <span className="mt-0.5 block size-1.5 rounded-full" style={{ background: "var(--cal-marker)" }} />}
      {due && <span className="absolute bottom-1 block size-1.5 rounded-full bg-destructive" />}
    </button>
  );
}

function CalendarPage() {
  const { t, lang, data, state, update, ready } = useApp();
  const [month, setMonth] = useState<{ y: number; m: number } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<Homework | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const now = new Date();
    const clamped = now < monthStart(FIRST_MONTH.y, FIRST_MONTH.m) ? FIRST_MONTH : now > monthStart(LAST_MONTH.y, LAST_MONTH.m) ? LAST_MONTH : { y: now.getFullYear(), m: now.getMonth() };
    setMonth(clamped);
  }, []);
  if (!ready || !month) return <Page><PageHeader title={t.calendar} /></Page>;

  const settings = settingsOf(state);
  const todayKey = dateKey(new Date());
  const first = monthStart(month.y, month.m);
  const offset = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array<null>(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.y, month.m, i + 1, 12))];
  const monthFmt = new Intl.DateTimeFormat(lang === "ro" ? "ro-RO" : "en-GB", { month: "long", year: "numeric" });
  const canPrev = month.y > FIRST_MONTH.y || (month.y === FIRST_MONTH.y && month.m > FIRST_MONTH.m);
  const canNext = month.y < LAST_MONTH.y || (month.y === LAST_MONTH.y && month.m < LAST_MONTH.m);
  const shift = (d: number) => setMonth((cur) => { if (!cur) return cur; const n = new Date(cur.y, cur.m + d, 1); return { y: n.getFullYear(), m: n.getMonth() }; });

  const selDate = selected ? parseDate(selected) : null;
  const selStatus = selDate ? getDayStatus(selDate, settings) : null;
  const selLessons = selDate && selStatus?.isSchoolDay ? sortByTime(data?.days[schoolDayIndex(selDate)] ?? []) : [];
  const selHomework = selected ? state.homework.filter((h) => h.due === selected) : [];

  // Upcoming breaks & holidays from today
  const upcoming: { date: Date; label: string; type: string }[] = [];
  {
    const d = new Date(); d.setHours(12, 0, 0, 0);
    let prev: string | null = null;
    for (let i = 0; i < 300 && upcoming.length < 12; i++) {
      const st = getDayStatus(d, settings);
      const key = st.type !== "school" && st.type !== "weekend" ? `${st.type}:${st.label}` : null;
      if (key && key !== prev) upcoming.push({ date: new Date(d), label: st.label, type: st.type });
      prev = key;
      d.setDate(d.getDate() + 1);
    }
  }

  const openNew = () => {
    const subject = subjectsOf(data)[0] ?? "";
    setDraft({ id: newId(), type: "homework", subject, title: "", note: "", due: selected ?? todayKey, done: false });
  };

  return (
    <Page>
      <PageHeader title={t.calendar} />
      <div
        className="glass p-3"
        onTouchStart={(e) => { const p = e.touches[0]; if (p) touch.current = { x: p.clientX, y: p.clientY }; }}
        onTouchEnd={(e) => { const p = e.changedTouches[0]; const o = touch.current; touch.current = null; if (!p || !o || Math.abs(p.clientY - o.y) > 50) return; const dx = p.clientX - o.x; if (Math.abs(dx) > 70) shift(dx < 0 ? 1 : -1); }}
      >
        <div className="mb-2 flex items-center justify-between">
          <Button variant="ghost" size="icon" className="rounded-full" disabled={!canPrev} onClick={() => shift(-1)} aria-label={t.previousWeek}><ChevronLeft /></Button>
          <p className="text-sm font-bold capitalize">{monthFmt.format(first)}</p>
          <Button variant="ghost" size="icon" className="rounded-full" disabled={!canNext} onClick={() => shift(1)} aria-label={t.nextWeek}><ChevronRight /></Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground">
          {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => <span key={i}>{lang === "ro" ? d : ["M", "T", "W", "T", "F", "S", "S"][i]}</span>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((date, i) => date ? (
            <DayCell
              key={i}
              date={date}
              status={getDayStatus(date, settings)}
              today={dateKey(date) === todayKey}
              due={state.homework.some((h) => !h.done && h.due === dateKey(date))}
              onTap={() => setSelected(dateKey(date))}
            />
          ) : <span key={i} />)}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 px-1 text-[10px] text-muted-foreground">
          {[
            ["var(--cal-school)", t.legendSchool],
            ["var(--cal-vacation)", t.legendVacation],
            ["var(--cal-county)", t.legendCounty],
            ["var(--cal-holiday)", t.legendHoliday],
            ["var(--cal-marker)", t.legendLastDay],
          ].map(([color, label]) => (
            <span key={label} className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: color }} />{label}</span>
          ))}
        </div>
      </div>

      <h2 className="mb-3 mt-6 px-1 text-lg font-semibold">{t.upcomingBreaks}</h2>
      <ul className="space-y-2">
        {upcoming.map((b, i) => (
          <li key={i} className="glass flex items-center gap-3 !rounded-2xl px-4 py-3">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: getDayStatus(b.date, settings).color }} />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{b.label}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{new Intl.DateTimeFormat(lang === "ro" ? "ro-RO" : "en-GB", { day: "numeric", month: "short" }).format(b.date)} · {t.inDays(daysUntil(b.date))}</span>
          </li>
        ))}
        {!upcoming.length && <p className="px-1 text-sm text-muted-foreground">{t.noBreaks}</p>}
      </ul>

      <Button onClick={openNew} className="fixed bottom-28 right-4 z-40 size-13 rounded-full p-0 shadow-xl" aria-label={t.addForDate}><Plus className="size-6" /></Button>

      {selDate && selStatus && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-black/30" onClick={() => setSelected(null)} aria-label={t.cancel} />
          <div className="glass relative mb-4 w-[calc(100%-24px)] max-w-xl max-h-[70dvh] overflow-y-auto bg-glass-strong p-5 fade-up">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold capitalize">{formatSchoolDate(selDate, lang)}</h2>
                <p className="mt-1 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: `color-mix(in oklab, ${selStatus.color} 30%, transparent)` }}>{selStatus.label}</p>
                {selStatus.badge && <p className="mt-1 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "color-mix(in oklab, var(--cal-marker) 30%, transparent)" }}>{selStatus.badge}</p>}
                {selStatus.note && <p className="mt-2 text-xs text-muted-foreground">{selStatus.note}</p>}
              </div>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setSelected(null)} aria-label={t.cancel}><X /></Button>
            </div>
            {selLessons.length > 0 && (
              <>
                <h3 className="mt-4 text-sm font-semibold text-muted-foreground">{t.lessonsThatDay}</h3>
                <ul className="mt-2 space-y-1.5">
                  {selLessons.map((l) => (
                    <li key={l.id} className="flex items-center gap-3 text-sm">
                      <span className="w-11 tabular-nums text-muted-foreground">{l.time}</span>
                      <Dot subject={l.subject} />
                      <span className="font-medium">{l.subject}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <h3 className="mt-4 text-sm font-semibold text-muted-foreground">{t.homeworkThatDay}</h3>
            <ul className="mt-2 space-y-1.5">
              {selHomework.map((h) => (
                <li key={h.id} className={`text-sm ${h.done ? "line-through text-muted-foreground" : ""}`}>
                  <span className="font-semibold">{h.subject}</span> · {h.title}{h.type === "test" ? ` (${t.test})` : ""}
                </li>
              ))}
              {!selHomework.length && <li className="text-sm text-muted-foreground">{t.noHomework}</li>}
            </ul>
          </div>
        </div>
      )}

      <Dialog open={!!draft} onOpenChange={(open) => { if (!open) setDraft(null); }}>
        <DialogContent className="max-h-[90dvh] w-[calc(100%-32px)] overflow-y-auto rounded-3xl" aria-describedby={undefined}>
          <DialogTitle>{t.addHomework}</DialogTitle>
          {draft && (
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); const result = homeworkSchema.safeParse(draft); if (!result.success) { toast.error(t.requiredFields); return; } const saved = result.data; update((s) => ({ ...s, homework: [...s.homework.filter((h) => h.id !== saved.id), saved] })); setDraft(null); }}>
              <div className="flex gap-2">{(["homework", "test"] as const).map((type) => <Button key={type} type="button" className="flex-1 rounded-full" variant={draft.type === type ? "default" : "secondary"} onClick={() => setDraft({ ...draft, type })}>{type === "test" ? t.test : t.homeworkType}</Button>)}</div>
              <label className="block text-sm">{t.subject}<select required value={draft.subject} className={field} onChange={(e) => setDraft({ ...draft, subject: e.target.value })}><option value="">—</option>{[...new Set([...subjectsOf(data), draft.subject])].filter(Boolean).map((s) => <option key={s}>{s}</option>)}</select></label>
              <label className="block text-sm">{t.title}<input required className={field} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
              <label className="block text-sm">{t.dueDate}<input required type="date" className={field} value={draft.due} onChange={(e) => setDraft({ ...draft, due: e.target.value })} /></label>
              <div className="flex justify-end gap-2"><Button type="button" variant="ghost" className="rounded-full" onClick={() => setDraft(null)}>{t.cancel}</Button><Button className="rounded-full" type="submit">{t.save}</Button></div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Page>
  );
}
