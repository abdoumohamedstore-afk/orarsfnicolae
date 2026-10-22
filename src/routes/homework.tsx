import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Check, Plus, Pencil, Trash2, RotateCcw } from "lucide-react";
import { differenceInCalendarDays } from "date-fns";
import { toast } from "sonner";
import { Page, PageHeader, Dot } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useApp } from "@/lib/store";
import { newId } from "@/lib/timetable";
import { dateKey, parseDate } from "@/lib/schedule-days";
import { homeworkSchema, nextSubjectDate, subjectsOf, type Homework } from "@/lib/student-data";
export const Route = createFileRoute("/homework")({ head: () => ({ meta: [
  { title: "Homework · Orar" }, { name: "description", content: "Homework, tests and due dates saved on your phone." },
  { property: "og:title", content: "Homework · Orar" }, { property: "og:description", content: "Homework, tests and due dates saved on your phone." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
] }), component: HomeworkPage });
const field = "mt-1 w-full rounded-2xl border border-input bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";
function HomeworkRow({ item, edit }: { item: Homework; edit: () => void }) {
  const { t, state, update } = useApp(); const start = useRef<{ x: number; y: number } | null>(null);
  const toggle = () => update(s => ({ ...s, homework: s.homework.map(h => h.id === item.id ? { ...h, done: !h.done } : h) }));
  const remove = () => { const removed = item; update(s => ({ ...s, homework: s.homework.filter(h => h.id !== item.id) })); toast(t.remove, { action: { label: t.reopen, onClick: () => update(s => ({ ...s, homework: [...s.homework.filter(h => h.id !== removed.id), removed] })) } }); };
  const remaining = differenceInCalendarDays(parseDate(item.due), new Date());
  return <article className="glass p-4" onTouchStart={e => { const touch = e.touches[0]; if (touch) start.current = { x: touch.clientX, y: touch.clientY }; }} onTouchEnd={e => { const touch = e.changedTouches[0]; const origin = start.current; start.current = null; if (!touch || !origin || Math.abs(touch.clientY - origin.y) > 40) return; if (touch.clientX - origin.x > 75) toggle(); if (touch.clientX - origin.x < -75) remove(); }}>
    <div className="flex items-start gap-3"><input type="checkbox" checked={item.done} onChange={toggle} aria-label={item.done ? t.reopen : t.complete} className="mt-1 size-5 shrink-0 accent-primary" /><div className="min-w-0 flex-1"><p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Dot subject={item.subject} />{item.subject} · {item.type === "test" ? t.test : t.homeworkType}</p><h2 className={`mt-1 break-words font-semibold ${item.done ? "line-through text-muted-foreground" : ""}`}>{item.title}</h2>{item.note && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">{item.note}</p>}<p className={`mt-2 text-xs ${remaining < 0 && !item.done ? "text-destructive font-semibold" : "text-muted-foreground"}`}>{item.type === "test" && !item.done ? t.testCountdown(item.subject, remaining) : `${new Intl.DateTimeFormat(state.lang === "ro" ? "ro-RO" : "en-GB", { day: "numeric", month: "long" }).format(parseDate(item.due))}${remaining < 0 && !item.done ? ` · ${t.overdue}` : ""}`}</p></div></div>
    <div className="mt-2 flex justify-end gap-1"><Button variant="ghost" size="icon" className="rounded-full" onClick={edit} title={t.editHomework} aria-label={t.editHomework}><Pencil /></Button><Button variant="ghost" size="icon" className="rounded-full text-destructive" onClick={remove} title={t.remove} aria-label={t.remove}><Trash2 /></Button></div>
  </article>;
}
function HomeworkPage() {
  const { t, data, state, update, ready } = useApp(); const [done, setDone] = useState(false); const [filter, setFilter] = useState(""); const [draft, setDraft] = useState<Homework | null>(null);
  const subjects = subjectsOf(data); const filters = [...new Set([...subjects, ...state.homework.map(h => h.subject)])];
  const openNew = () => { const subject = subjects[0] ?? ""; setDraft({ id: newId(), type: "homework", subject, title: "", note: "", due: nextSubjectDate(data, subject, new Date()), done: false }); };
  const rows = state.homework.filter(h => h.done === done && (!filter || h.subject === filter)).sort((a, b) => a.due.localeCompare(b.due));
  if (!ready) return <Page><PageHeader title={t.homework} /></Page>;
  return <Page><PageHeader title={t.homework} right={<Button size="icon" className="size-11 rounded-full" onClick={openNew} aria-label={t.addHomework}><Plus /></Button>} />
    <div className="glass-pill mb-4 flex p-1"><Button variant={!done ? "default" : "ghost"} className="flex-1 rounded-full" onClick={() => setDone(false)}><Check />{t.toDo}</Button><Button variant={done ? "default" : "ghost"} className="flex-1 rounded-full" onClick={() => setDone(true)}><RotateCcw />{t.done}</Button></div>
    <div className="mb-4 flex gap-2 overflow-x-auto pb-2"><Button className="rounded-full" variant={!filter ? "default" : "secondary"} onClick={() => setFilter("")}>{t.all}</Button>{filters.map(s => <Button key={s} className="rounded-full" variant={filter === s ? "default" : "secondary"} onClick={() => setFilter(s)}><Dot subject={s} />{s}</Button>)}</div>
    <div className="space-y-3">{rows.map(item => <HomeworkRow key={item.id} item={item} edit={() => setDraft({ ...item })} />)}{!rows.length && <p className="py-12 text-center text-muted-foreground">{t.noHomework}</p>}</div>
    <Dialog open={!!draft} onOpenChange={open => { if (!open) setDraft(null); }}><DialogContent className="max-h-[90dvh] w-[calc(100%-32px)] overflow-y-auto rounded-3xl" aria-describedby={undefined}><DialogTitle>{state.homework.some(h => h.id === draft?.id) ? t.editHomework : t.addHomework}</DialogTitle>{draft && <form className="space-y-3" onSubmit={e => { e.preventDefault(); const result = homeworkSchema.safeParse(draft); if (!result.success) { toast.error(t.requiredFields); return; } const saved = result.data; update(s => ({ ...s, homework: [...s.homework.filter(h => h.id !== saved.id), saved] })); setDraft(null); }}>
      <div className="flex gap-2">{(["homework", "test"] as const).map(type => <Button key={type} type="button" className="flex-1 rounded-full" variant={draft.type === type ? "default" : "secondary"} onClick={() => setDraft({ ...draft, type })}>{type === "test" ? t.test : t.homeworkType}</Button>)}</div>
      <label className="block text-sm">{t.subject}<select required value={draft.subject} className={field} onChange={e => setDraft({ ...draft, subject: e.target.value, due: nextSubjectDate(data, e.target.value, new Date()) })}><option value="">—</option>{[...new Set([...subjects, draft.subject])].filter(Boolean).map(s => <option key={s}>{s}</option>)}</select></label>
      <label className="block text-sm">{t.title}<input required className={field} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} /></label>
      <label className="block text-sm">{t.note}<textarea className={field} rows={2} value={draft.note} onChange={e => setDraft({ ...draft, note: e.target.value })} /></label>
      <label className="block text-sm">{t.dueDate}<input required type="date" className={field} value={draft.due} onChange={e => setDraft({ ...draft, due: e.target.value })} /></label>
      <div className="flex justify-end gap-2"><Button type="button" variant="ghost" className="rounded-full" onClick={() => setDraft(null)}>{t.cancel}</Button><Button className="rounded-full" type="submit">{t.save}</Button></div>
    </form>}</DialogContent></Dialog>
  </Page>;
}
