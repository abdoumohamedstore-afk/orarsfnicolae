import { Link } from "@tanstack/react-router";
import { Backpack, Plus, Trash2, ChevronRight, BookOpen } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { dateKey, formatSchoolDate, getDayStatus, nextSchoolDay } from "@/lib/schedule-days";
import { packingItems, settingsOf } from "@/lib/student-data";
import { newId } from "@/lib/timetable";
export function Packing({ now }: { now: Date }) {
  const { state, t, lang, update } = useApp(); const [extra, setExtra] = useState("");
  const settings = settingsOf(state); const day = nextSchoolDay(now, settings);
  if (!day) return null;
  const key = dateKey(day); const pack = state.packing[key] ?? { checked: [], extras: [] }; const items = packingItems(state, day);
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStatus = getDayStatus(tomorrow, settings);
  return <section className={`glass mt-5 p-5 ${now.getHours() >= 16 ? "ring-2 ring-primary" : ""}`}>
    <h2 className="flex items-center gap-2 text-lg font-bold"><Backpack className="size-5 text-primary" />{t.bring}</h2>
    <p className="mt-2 text-xs text-muted-foreground">{!tomorrowStatus.isSchoolDay && `${t.tomorrowStatus(tomorrowStatus.label)}: `}{formatSchoolDate(day, lang)}</p>
    <ul className="mt-4 space-y-3">{items.map(item => <li key={item.id} className="flex items-start gap-2"><label className="flex min-w-0 flex-1 items-start gap-3"><input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-primary" checked={pack.checked.includes(item.id)} onChange={() => update(s => { const current = s.packing[key] ?? { checked: [], extras: [] }; return { ...s, packing: { ...s.packing, [key]: { ...current, checked: current.checked.includes(item.id) ? current.checked.filter(id => id !== item.id) : [...current.checked, item.id] } } }; })} /><span className={`min-w-0 break-words text-sm ${pack.checked.includes(item.id) ? "line-through text-muted-foreground" : ""}`}>{item.title}{item.subject && <span className="mt-0.5 block text-xs text-muted-foreground">{item.subject}</span>}</span></label>{item.id.startsWith("extra:") && <Button size="icon" variant="ghost" className="size-7 rounded-full" aria-label={t.remove} onClick={() => update(s => ({ ...s, packing: { ...s.packing, [key]: { ...pack, extras: pack.extras.filter(e => `extra:${e.id}` !== item.id) } } }))}><Trash2 /></Button>}</li>)}</ul>
    {!items.length && <p className="mt-3 text-sm text-muted-foreground">{t.noMaterials}</p>}
    <form className="mt-4 flex gap-2" onSubmit={e => { e.preventDefault(); if (!extra.trim()) return; const title = extra.trim(); update(s => { const current = s.packing[key] ?? { checked: [], extras: [] }; return { ...s, packing: { ...s.packing, [key]: { ...current, extras: [...current.extras, { id: newId(), title }] } } }; }); setExtra(""); }}><input aria-label={t.extraItem} placeholder={t.extraItem} value={extra} onChange={e => setExtra(e.target.value)} className="min-w-0 flex-1 rounded-full bg-secondary px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" /><Button className="rounded-full" size="icon" type="submit" aria-label={t.add}><Plus /></Button></form>
  </section>;
}
export function HomeworkPreview({ now }: { now: Date }) {
  const { state, t, lang } = useApp(); const day = nextSchoolDay(now, settingsOf(state));
  if (!day) return null;
  const key = dateKey(day);
  const due = state.homework.filter(h => !h.done && h.due <= key).sort((a, b) => a.due.localeCompare(b.due));
  return <Link to="/homework" className="glass mt-5 block p-5"><h2 className="flex items-center gap-2 text-lg font-bold"><BookOpen className="size-5 text-primary" />{t.homeworkDue}<span className="ml-auto text-primary">{due.length}</span><ChevronRight className="size-4" /></h2><p className="mt-1 text-xs text-muted-foreground">{formatSchoolDate(day, lang)}</p><ul className="mt-3 space-y-2">{due.slice(0, 3).map(h => <li key={h.id} className="text-sm"><span className="font-semibold">{h.subject}</span> · {h.title}</li>)}</ul>{!due.length && <p className="mt-3 text-sm text-muted-foreground">{t.noHomework}</p>}</Link>;
}
