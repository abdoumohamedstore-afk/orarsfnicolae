import { createFileRoute, Link } from "@tanstack/react-router";
import { Backpack, Bell, CalendarDays, CalendarPlus, Download, HardDrive, Palette, Pencil, School, Sparkles, Trash2, Upload, type LucideIcon } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Page, PageHeader } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { buildIcs, download } from "@/lib/ics";
import { useApp, ACCENTS, type ThemePref } from "@/lib/store";
import { emptyTimetable } from "@/lib/timetable";
import { importBackup, settingsOf, subjectsOf } from "@/lib/student-data";
import { playChime } from "@/lib/chime";
import { CalendarPrefsPanel, SpecialDaysPanel } from "@/components/calendar-settings";
import { ShareButton } from "@/components/share-dialog";
export const Route = createFileRoute("/settings")({ head: () => ({ meta: [
  { title: "Settings · Orar" }, { name: "description", content: "School details, materials, reminders and private device backups." },
  { property: "og:title", content: "Settings · Orar" }, { property: "og:description", content: "School details, materials, reminders and private device backups." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
] }), component: SettingsPage });
const field = "mt-1 w-full rounded-full border border-input bg-secondary px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";
function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { v: T; l: string }[]; onChange: (v: T) => void }) {
  return <div className="flex rounded-full bg-muted p-1">{options.map(o => <Button key={o.v} variant={value === o.v ? "default" : "ghost"} className="rounded-full px-3" onClick={() => onChange(o.v)}>{o.l}</Button>)}</div>;
}
/** One collapsed glass card: icon, short title and a one-line summary of what is inside. */
function Section({ value, icon: Icon, title, summary, children }: { value: string; icon: LucideIcon; title: string; summary?: string; children: ReactNode }) {
  return <AccordionItem value={value} className="glass mb-3 rounded-3xl !border-b-0 px-4 last:mb-0">
    <AccordionTrigger className="py-4 hover:no-underline">
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground"><Icon className="size-4" /></span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold">{title}</span>
          {summary && <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">{summary}</span>}
        </span>
      </span>
    </AccordionTrigger>
    <AccordionContent className="pb-4">{children}</AccordionContent>
  </AccordionItem>;
}
function SettingsPage() {
  const { t, lang, setLang, theme, setTheme, accent, setAccent, data, state, update, replace, reset, ready } = useApp(); const fileRef = useRef<HTMLInputElement>(null); const [confirm, setConfirm] = useState(false);
  const tt = data ?? emptyTimetable(); const subjects = subjectsOf(data);
  const onCount = [state.reminders.lessons, state.reminders.evening, state.reminders.sound !== false].filter(Boolean).length;
  const notificationToggle = async (kind: "lessons" | "evening", enabled: boolean) => {
    if (enabled) { let allowed = false; try { allowed = "Notification" in window && await Notification.requestPermission() === "granted"; } catch {} if (!allowed) toast(t.permissionDenied); }
    update(s => ({ ...s, reminders: { ...s.reminders, [kind]: enabled } }));
  };
  const onImport = async (file: File) => { try { replace(importBackup(JSON.parse(await file.text()), state)); toast.success(t.imported); } catch { toast.error(t.importFailed); } };
  if (!ready) return <Page><PageHeader title={t.settings} /></Page>;
  return <Page><PageHeader title={t.settings} right={<span />} />
    <p className="mb-3 px-1 text-xs text-muted-foreground">{t.settingsHint}</p>
    <Accordion type="single" collapsible defaultValue="school">
      <Section value="school" icon={School} title={t.sectionSchool} summary={`${tt.className || "—"} · ${tt.lessonLen}/${tt.breakLen}`}>
        <div className="space-y-3">
          <label className="block text-xs font-medium text-muted-foreground">{t.school}<input className={field} value={tt.school} onChange={e => update(s => ({ ...s, timetable: { ...(s.timetable ?? emptyTimetable()), school: e.target.value } }))} /></label>
          <label className="block text-xs font-medium text-muted-foreground">{t.className}<input className={field} value={tt.className} onChange={e => update(s => ({ ...s, timetable: { ...(s.timetable ?? emptyTimetable()), className: e.target.value } }))} /></label>
          <div className="grid grid-cols-2 gap-3">{(["lessonLen", "breakLen"] as const).map(key => <label key={key} className="text-xs font-medium text-muted-foreground">{t[key]}<input type="number" inputMode="numeric" min={key === "lessonLen" ? 1 : 0} max={key === "lessonLen" ? 240 : 120} className={field} value={tt[key]} onChange={e => update(s => ({ ...s, timetable: { ...(s.timetable ?? emptyTimetable()), [key]: Math.min(key === "lessonLen" ? 240 : 120, Math.max(key === "lessonLen" ? 1 : 0, Number(e.target.value))) } }))} /></label>)}</div>
          <Button asChild className="w-full rounded-full"><Link to="/edit"><Pencil />{t.editTimetable}</Link></Button>
        </div>
      </Section>
      <Section value="calendar" icon={CalendarDays} title={t.sectionCalendar} summary={t.calendarSummary(state.grade, state.countyWeek === "unknown" ? t.notSureYet : state.countyWeek)}>
        <CalendarPrefsPanel />
      </Section>
      <Section value="special" icon={Sparkles} title={t.sectionSpecial} summary={t.specialAndOff(state.specialWeeks.length, state.daysOff.length)}>
        <SpecialDaysPanel />
      </Section>
      <Section value="materials" icon={Backpack} title={t.materialsShort} summary={t.subjectsCount(subjects.length)}>
        <div className="space-y-3">{subjects.map(subject => <label key={subject} className="block text-sm font-medium">{subject}<input className={field} value={(state.materials[subject] ?? []).join(",")} placeholder={t.materialsPlaceholder} onChange={e => { const items = e.target.value.split(","); update(s => ({ ...s, materials: { ...s.materials, [subject]: items } })); }} /></label>)}{!subjects.length && <Button asChild variant="secondary" className="rounded-full"><Link to="/edit">{t.editTimetable}</Link></Button>}</div>
      </Section>
      <Section value="reminders" icon={Bell} title={t.remindersShort} summary={t.remindersOn(onCount)}>
        <div className="space-y-4">{(["lessons", "evening"] as const).map(kind => <label key={kind} className="flex items-center justify-between gap-4 text-sm font-medium">{kind === "lessons" ? t.lessonReminders : t.eveningReminder}<input type="checkbox" role="switch" className="size-5 shrink-0 accent-primary" checked={state.reminders[kind]} onChange={e => void notificationToggle(kind, e.target.checked)} /></label>)}{state.reminders.evening && <label className="block text-sm">{t.reminderTime}<input type="time" className={field} value={state.reminders.time} onChange={e => { if (e.target.value) update(s => ({ ...s, reminders: { ...s.reminders, time: e.target.value } })); }} /></label>}<label className="flex items-center justify-between gap-4 text-sm font-medium">{t.reminderSound}<input type="checkbox" role="switch" className="size-5 shrink-0 accent-primary" checked={state.reminders.sound !== false} onChange={e => { const sound = e.target.checked; update(s => ({ ...s, reminders: { ...s.reminders, sound } })); if (sound) playChime(); }} /></label><Button type="button" variant="secondary" className="rounded-full" onClick={() => playChime()}>{t.testSound}</Button><p className="text-xs leading-relaxed text-muted-foreground">{t.reminderLimit}</p></div>
      </Section>
      <Section value="data" icon={HardDrive} title={t.sectionData}>
        <div className="space-y-2">
          <Button variant="secondary" className="h-auto w-full justify-start rounded-full py-3 whitespace-normal text-left" onClick={() => download("orar-backup.json", JSON.stringify(state, null, 2), "application/json")}><Download />{t.backupExport}</Button>
          <Button variant="secondary" className="h-auto w-full justify-start rounded-full py-3 whitespace-normal text-left" onClick={() => fileRef.current?.click()}><Upload />{t.backupImport}</Button>
          <Button variant="secondary" className="h-auto w-full justify-start rounded-full py-3 whitespace-normal text-left" onClick={() => download("orar.ics", buildIcs(tt, t.reminder, new Date(), settingsOf(state)), "text/calendar")}><CalendarPlus />{t.exportIcs}</Button>
          <ShareButton />
          <Button variant="ghost" className="h-auto w-full justify-start rounded-full py-3 text-destructive" onClick={() => setConfirm(true)}><Trash2 />{t.resetData}</Button>
        </div>
      </Section>
      <Section value="look" icon={Palette} title={t.sectionLook} summary={`${t[theme]} · ${lang.toUpperCase()}`}>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-medium">{t.language}</span><Segmented value={lang} onChange={setLang} options={[{ v: "ro", l: "RO" }, { v: "en", l: "EN" }]} /></div>
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-medium">{t.appearance}</span><Segmented<ThemePref> value={theme} onChange={setTheme} options={[{ v: "auto", l: t.auto }, { v: "light", l: t.light }, { v: "dark", l: t.dark }]} /></div>
          <div><span className="text-sm font-medium">{t.colorTheme}</span>
            <div role="radiogroup" aria-label={t.colorTheme} className="mt-2 grid grid-cols-6 gap-2">{ACCENTS.map(a => <button key={a} type="button" role="radio" aria-checked={accent === a} aria-label={t.accentNames[a]} title={t.accentNames[a]} onClick={() => setAccent(a)} data-accent={a} className={`accent-swatch grid min-h-11 place-items-center rounded-xl border-2 ${accent === a ? "border-foreground" : "border-transparent"}`}><span className="block size-7 rounded-lg" style={{ background: "oklch(var(--al) var(--ac) var(--ah))" }} /></button>)}</div>
            <p className="mt-1 text-xs text-muted-foreground">{t.accentNames[accent]}</p>
          </div>
        </div>
      </Section>
    </Accordion>
    <p className="mt-5 text-center text-xs text-muted-foreground">{t.privacy}</p>
    <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) void onImport(file); e.target.value = ""; }} />
    <AlertDialog open={confirm} onOpenChange={setConfirm}><AlertDialogContent className="w-[calc(100%-32px)] rounded-3xl"><AlertDialogTitle>{t.resetData}</AlertDialogTitle><AlertDialogDescription>{t.resetConfirm}</AlertDialogDescription><AlertDialogFooter><AlertDialogCancel className="rounded-full">{t.cancel}</AlertDialogCancel><AlertDialogAction className="rounded-full bg-destructive text-destructive-foreground" onClick={() => { reset(); toast.success(t.resetDone); }}>{t.resetData}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </Page>;
}
