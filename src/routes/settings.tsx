import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarPlus, Download, Upload, Pencil, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Page, PageHeader } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { buildIcs, download } from "@/lib/ics";
import { useApp, type ThemePref } from "@/lib/store";
import { emptyTimetable } from "@/lib/timetable";
import { importBackup, settingsOf, subjectsOf } from "@/lib/student-data";
import { playChime } from "@/lib/chime";
import { CalendarSettingsPanel } from "@/components/calendar-settings";
export const Route = createFileRoute("/settings")({ head: () => ({ meta: [
  { title: "Settings · Orar" }, { name: "description", content: "School details, materials, reminders and private device backups." },
  { property: "og:title", content: "Settings · Orar" }, { property: "og:description", content: "School details, materials, reminders and private device backups." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
] }), component: SettingsPage });
const field = "mt-1 w-full rounded-full border border-input bg-secondary px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";
function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { v: T; l: string }[]; onChange: (v: T) => void }) {
  return <div className="flex rounded-full bg-muted p-1">{options.map(o => <Button key={o.v} variant={value === o.v ? "default" : "ghost"} className="rounded-full px-3" onClick={() => onChange(o.v)}>{o.l}</Button>)}</div>;
}
function SettingsPage() {
  const { t, lang, setLang, theme, setTheme, data, state, update, replace, reset, ready } = useApp(); const fileRef = useRef<HTMLInputElement>(null); const [confirm, setConfirm] = useState(false);
  const tt = data ?? emptyTimetable(); const subjects = subjectsOf(data);
  const notificationToggle = async (kind: "lessons" | "evening", enabled: boolean) => {
    if (enabled) { let allowed = false; try { allowed = "Notification" in window && await Notification.requestPermission() === "granted"; } catch {} if (!allowed) toast(t.permissionDenied); }
    update(s => ({ ...s, reminders: { ...s.reminders, [kind]: enabled } }));
  };
  const onImport = async (file: File) => { try { replace(importBackup(JSON.parse(await file.text()), state)); toast.success(t.imported); } catch { toast.error(t.importFailed); } };
  if (!ready) return <Page><PageHeader title={t.settings} /></Page>;
  return <Page><PageHeader title={t.settings} right={<span />} />
    <section className="mb-6 space-y-3"><h2 className="text-sm font-semibold uppercase text-muted-foreground">{t.general}</h2>
      <label className="block text-xs font-medium text-muted-foreground">{t.school}<input className={field} value={tt.school} onChange={e => update(s => ({ ...s, timetable: { ...(s.timetable ?? emptyTimetable()), school: e.target.value } }))} /></label>
      <label className="block text-xs font-medium text-muted-foreground">{t.className}<input className={field} value={tt.className} onChange={e => update(s => ({ ...s, timetable: { ...(s.timetable ?? emptyTimetable()), className: e.target.value } }))} /></label>
      <div className="grid grid-cols-2 gap-3">{(["lessonLen", "breakLen"] as const).map(key => <label key={key} className="text-xs font-medium text-muted-foreground">{t[key]}<input type="number" inputMode="numeric" min={key === "lessonLen" ? 1 : 0} max={key === "lessonLen" ? 240 : 120} className={field} value={tt[key]} onChange={e => update(s => ({ ...s, timetable: { ...(s.timetable ?? emptyTimetable()), [key]: Math.min(key === "lessonLen" ? 240 : 120, Math.max(key === "lessonLen" ? 1 : 0, Number(e.target.value))) } }))} /></label>)}</div>
      <div className="flex flex-wrap items-center justify-between gap-2 py-2"><span className="text-sm font-medium">{t.language}</span><Segmented value={lang} onChange={setLang} options={[{ v: "ro", l: "RO" }, { v: "en", l: "EN" }]} /></div>
      <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-medium">{t.appearance}</span><Segmented<ThemePref> value={theme} onChange={setTheme} options={[{ v: "auto", l: t.auto }, { v: "light", l: t.light }, { v: "dark", l: t.dark }]} /></div>
      <Button asChild className="w-full rounded-full"><Link to="/edit"><Pencil />{t.editTimetable}</Link></Button>
    </section>
    <CalendarSettingsPanel />
    <section className="mb-6"><h2 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">{t.materials}</h2><div className="space-y-3">{subjects.map(subject => <label key={subject} className="block text-sm font-medium">{subject}<input className={field} value={(state.materials[subject] ?? []).join(",")} placeholder={t.materialsPlaceholder} onChange={e => { const items = e.target.value.split(","); update(s => ({ ...s, materials: { ...s.materials, [subject]: items } })); }} /></label>)}{!subjects.length && <Button asChild variant="secondary" className="rounded-full"><Link to="/edit">{t.editTimetable}</Link></Button>}</div></section>
    <section className="mb-6"><h2 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">{t.notifications}</h2><div className="space-y-4">{(["lessons", "evening"] as const).map(kind => <label key={kind} className="flex items-center justify-between gap-4 text-sm font-medium">{kind === "lessons" ? t.lessonReminders : t.eveningReminder}<input type="checkbox" role="switch" className="size-5 shrink-0 accent-primary" checked={state.reminders[kind]} onChange={e => void notificationToggle(kind, e.target.checked)} /></label>)}{state.reminders.evening && <label className="block text-sm">{t.reminderTime}<input type="time" className={field} value={state.reminders.time} onChange={e => { if (e.target.value) update(s => ({ ...s, reminders: { ...s.reminders, time: e.target.value } })); }} /></label>}<label className="flex items-center justify-between gap-4 text-sm font-medium">{t.reminderSound}<input type="checkbox" role="switch" className="size-5 shrink-0 accent-primary" checked={state.reminders.sound !== false} onChange={e => { const sound = e.target.checked; update(s => ({ ...s, reminders: { ...s.reminders, sound } })); if (sound) playChime(); }} /></label><Button type="button" variant="secondary" className="rounded-full" onClick={() => playChime()}>{t.testSound}</Button><p className="text-xs leading-relaxed text-muted-foreground">{t.reminderLimit}</p></div></section>
    <section className="space-y-2"><h2 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">{t.data}</h2>
      <Button variant="secondary" className="h-auto w-full justify-start rounded-full py-3 whitespace-normal text-left" onClick={() => download("orar-backup.json", JSON.stringify(state, null, 2), "application/json")}><Download />{t.backupExport}</Button>
      <Button variant="secondary" className="h-auto w-full justify-start rounded-full py-3 whitespace-normal text-left" onClick={() => fileRef.current?.click()}><Upload />{t.backupImport}</Button>
      <Button variant="secondary" className="h-auto w-full justify-start rounded-full py-3 whitespace-normal text-left" onClick={() => download("orar.ics", buildIcs(tt, t.reminder, new Date(), settingsOf(state)), "text/calendar")}><CalendarPlus />{t.exportIcs}</Button>
      <Button variant="ghost" className="h-auto w-full justify-start rounded-full py-3 text-destructive" onClick={() => setConfirm(true)}><Trash2 />{t.resetData}</Button>
    </section><p className="mt-5 text-center text-xs text-muted-foreground">{t.privacy}</p>
    <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) void onImport(file); e.target.value = ""; }} />
    <AlertDialog open={confirm} onOpenChange={setConfirm}><AlertDialogContent className="w-[calc(100%-32px)] rounded-3xl"><AlertDialogTitle>{t.resetData}</AlertDialogTitle><AlertDialogDescription>{t.resetConfirm}</AlertDialogDescription><AlertDialogFooter><AlertDialogCancel className="rounded-full">{t.cancel}</AlertDialogCancel><AlertDialogAction className="rounded-full bg-destructive text-destructive-foreground" onClick={() => { reset(); toast.success(t.resetDone); }}>{t.resetData}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </Page>;
}
