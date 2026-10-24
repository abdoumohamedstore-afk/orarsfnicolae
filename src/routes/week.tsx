import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dot, EmptyState, Page, PageHeader } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { isEmpty, shortSubject, sortByTime } from "@/lib/timetable";
import { dateKey, getDayStatus, weekStart } from "@/lib/schedule-days";
import { settingsOf } from "@/lib/student-data";
export const Route = createFileRoute("/week")({ head: () => ({ meta: [
  { title: "Week · Orar" }, { name: "description", content: "Weekly lessons and homework due dates at a glance." },
  { property: "og:title", content: "Week · Orar" }, { property: "og:description", content: "Weekly lessons and homework due dates at a glance." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
] }), component: Week });
function Week() {
  const { t, lang, data, state, ready } = useApp(); const [base, setBase] = useState<Date | null>(null); const [offset, setOffset] = useState(0); const touch = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => setBase(new Date()), []);
  if (!ready || !base) return <Page><PageHeader title={t.week} /></Page>;
  if (!data || isEmpty(data)) return <Page><PageHeader title={t.week} /><EmptyState /></Page>;
  const start = weekStart(base); start.setDate(start.getDate() + offset * 7); const end = new Date(start); end.setDate(end.getDate() + 4);
  const fmt = new Intl.DateTimeFormat(lang === "ro" ? "ro-RO" : "en-GB", { day: "numeric", month: "short" });
  return <Page><PageHeader title={t.week} /><div className="mb-4 flex items-center justify-between gap-2"><Button variant="secondary" size="icon" className="rounded-full" onClick={() => setOffset(n => n - 1)} aria-label={t.previousWeek}><ChevronLeft /></Button><Button variant="ghost" className="rounded-full" onClick={() => setOffset(0)} title={t.thisWeek}>{fmt.format(start)} – {fmt.format(end)}</Button><Button variant="secondary" size="icon" className="rounded-full" onClick={() => setOffset(n => n + 1)} aria-label={t.nextWeek}><ChevronRight /></Button></div>
    <div className="glass p-2" onTouchStart={e => { const p = e.touches[0]; if (p) touch.current = { x: p.clientX, y: p.clientY }; }} onTouchEnd={e => { const p = e.changedTouches[0]; const origin = touch.current; touch.current = null; if (!p || !origin || Math.abs(p.clientY - origin.y) > 50) return; const dx = p.clientX - origin.x; if (Math.abs(dx) > 70) setOffset(n => n + (dx < 0 ? 1 : -1)); }}>
      <div className="grid grid-cols-5 items-start gap-1">{data.days.map((day, i) => {
        const date = new Date(start); date.setDate(date.getDate() + i); const status = getDayStatus(date, settingsOf(state)); const lessons = status.isSchoolDay ? sortByTime(day) : []; const today = dateKey(date) === dateKey(base); const due = state.homework.some(h => !h.done && h.due === dateKey(date));
        return <div key={i} className={`min-w-0 rounded-2xl border-2 px-0.5 py-2 ${today ? "border-primary bg-accent" : "border-transparent"}`}><div className="mb-2 text-center"><p className={`text-[10px] font-bold ${today ? "text-primary" : ""}`}>{t.daysShort[i]} {date.getDate()}</p><p className="mt-1 text-[9px] text-muted-foreground">{lessons[0]?.time ?? "—"}</p><span className={`mx-auto mt-1 block size-1.5 rounded-full ${due ? "bg-destructive" : "bg-transparent"}`} aria-label={due ? t.homeworkDue : undefined} /></div>{(!status.isSchoolDay || status.type === "county" || status.type === "special") && <p title={status.note} className={`mb-2 rounded-lg p-1 text-center text-[9px] leading-relaxed [overflow-wrap:anywhere] ${status.dashed ? "border border-dashed" : ""}`} style={{ background: `color-mix(in oklab, ${status.color} 28%, transparent)`, borderColor: status.color }}>{status.label}</p>}<div className="space-y-1.5">{lessons.map(l => <div key={l.id} title={`${l.time} ${l.subject}`} className="glass-pill min-w-0 px-1 py-2 text-center !shadow-none"><Dot subject={l.subject} className="!size-1.5" /><p className="mt-0.5 break-words text-[9px] font-semibold leading-tight [overflow-wrap:anywhere]">{shortSubject(l.subject)}</p></div>)}</div></div>;
      })}</div>
    </div>
  </Page>;
}
