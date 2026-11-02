import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { dayOffSchema, specialWeekSchema } from "@/lib/student-data";
import { newId } from "@/lib/timetable";

const field = "mt-1 w-full rounded-2xl border border-input bg-secondary px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

/** Grade band plus county break week: the two choices that decide which weeks are free. */
export function CalendarPrefsPanel() {
  const { t, state, update } = useApp();
  return <div className="space-y-4">
    <label className="block text-sm font-medium">{t.grade}<select className={field} value={state.grade} onChange={e => { const grade = e.target.value; if (grade === "V-VII" || grade === "VIII" || grade === "XII-XIII") update(s => ({ ...s, grade })); }}><option value="V-VII">V–VII / IX–XI</option><option value="VIII">VIII</option><option value="XII-XIII">XII–XIII</option></select></label>
    <label className="block text-sm font-medium">{t.countyWeek}<select className={field} value={state.countyWeek} onChange={e => { const countyWeek = e.target.value; if (countyWeek === "unknown" || countyWeek === "A" || countyWeek === "B") update(s => ({ ...s, countyWeek })); }}><option value="unknown">{t.notSureYet}</option><option value="A">{t.weekA}</option><option value="B">{t.weekB}</option></select></label>
    {state.countyWeek === "unknown" && <p className="text-xs text-muted-foreground">{t.countyWarning}</p>}
  </div>;
}

/** Weeks and single days the pupil adds by hand; both change what counts as a school day. */
export function SpecialDaysPanel() {
  const { t, state, update } = useApp();
  const [label, setLabel] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [lessons, setLessons] = useState(false);
  const [offDate, setOffDate] = useState("");
  const [offLabel, setOffLabel] = useState("");
  return <div className="space-y-4">
    <h3 className="text-sm font-semibold">{t.specialWeeks}</h3>
    <ul className="space-y-3">{state.specialWeeks.map(w => <li key={w.id} className="border-b border-border pb-3"><div className="flex items-start gap-2"><p className="min-w-0 flex-1 break-words text-sm font-medium">{w.label}<span className="mt-1 block text-xs text-muted-foreground">{w.from} – {w.to}</span></p><Button variant="ghost" size="icon" className="shrink-0 rounded-full text-destructive" aria-label={`${t.remove}: ${w.label}`} onClick={() => update(s => ({ ...s, specialWeeks: s.specialWeeks.filter(x => x.id !== w.id) }))}><Trash2 /></Button></div><label className="mt-2 flex items-center gap-3 text-xs"><input type="checkbox" role="switch" className="size-5 accent-primary" checked={w.lessonsApply} onChange={e => update(s => ({ ...s, specialWeeks: s.specialWeeks.map(x => x.id === w.id ? { ...x, lessonsApply: e.target.checked } : x) }))} />{t.lessonsApply}</label></li>)}</ul>
    <form className="space-y-3" onSubmit={e => { e.preventDefault(); const parsed = specialWeekSchema.safeParse({ id: newId(), label, from, to, lessonsApply: lessons }); if (!parsed.success) { toast.error(t.invalidCalendarDates); return; } update(s => ({ ...s, specialWeeks: [...s.specialWeeks, parsed.data] })); setLabel(""); setFrom(""); setTo(""); setLessons(false); }}>
      <label className="block text-sm">{t.title}<input required list="special-week-labels" className={field} value={label} onChange={e => setLabel(e.target.value)} /></label><datalist id="special-week-labels"><option value={t.greenWeek} /><option value={t.schoolOtherwise} /></datalist>
      <div className="grid grid-cols-2 gap-3"><label className="min-w-0 text-sm">{t.fromDate}<input required type="date" className={`${field} min-w-0`} value={from} onChange={e => setFrom(e.target.value)} /></label><label className="min-w-0 text-sm">{t.toDate}<input required type="date" min={from || undefined} className={`${field} min-w-0`} value={to} onChange={e => setTo(e.target.value)} /></label></div>
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" role="switch" className="size-5 shrink-0 accent-primary" checked={lessons} onChange={e => setLessons(e.target.checked)} />{t.lessonsApply}</label>
      <Button type="submit" variant="secondary" className="h-auto w-full rounded-full whitespace-normal"><Plus />{t.addSpecialWeek}</Button>
    </form>
    <h3 className="pt-2 text-sm font-semibold">{t.customDaysOff}</h3>
    <ul className="space-y-2">{state.daysOff.map(d => <li key={d.id} className="flex items-center gap-2 border-b border-border pb-2"><p className="min-w-0 flex-1 break-words text-sm">{d.label}<span className="block text-xs text-muted-foreground">{d.date}</span></p><Button variant="ghost" size="icon" className="rounded-full text-destructive" aria-label={`${t.remove}: ${d.label}`} onClick={() => update(s => ({ ...s, daysOff: s.daysOff.filter(x => x.id !== d.id) }))}><Trash2 /></Button></li>)}</ul>
    <form className="space-y-3" onSubmit={e => { e.preventDefault(); const parsed = dayOffSchema.safeParse({ id: newId(), date: offDate, label: offLabel }); if (!parsed.success) { toast.error(t.invalidCalendarDates); return; } update(s => ({ ...s, daysOff: [...s.daysOff, parsed.data] })); setOffDate(""); setOffLabel(""); }}>
      <label className="block text-sm">{t.dueDate}<input required type="date" className={field} value={offDate} onChange={e => setOffDate(e.target.value)} /></label>
      <label className="block text-sm">{t.dayOffLabel}<input required className={field} value={offLabel} onChange={e => setOffLabel(e.target.value)} /></label>
      <Button type="submit" variant="secondary" className="w-full rounded-full"><Plus />{t.addDayOff}</Button>
    </form>
  </div>;
}
