import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Dot, Page, PageHeader } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { applyShare, codeFromFile, decodeShare, loadRecovery, saveRecovery, type ImportMode, type SharePayload } from "@/lib/share";
import { sortByTime } from "@/lib/timetable";

export const Route = createFileRoute("/share")({
  head: () => ({ meta: [
    { title: "Shared timetable · Orar" }, { name: "description", content: "Review and import a timetable shared by a classmate." },
    { property: "og:title", content: "Shared timetable · Orar" }, { property: "og:description", content: "Review and import a timetable shared by a classmate." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: SharePage,
});

function SharePage() {
  const { t, ready, state, update, replace } = useApp();
  const navigate = useNavigate();
  const [payload, setPayload] = useState<SharePayload | null | undefined>(undefined);
  const [mode, setMode] = useState<ImportMode | null>(null);
  useEffect(() => {
    const code = new URLSearchParams(window.location.hash.slice(1)).get("d");
    setPayload(code ? decodeShare(code) : null);
  }, []);
  const openFile = async (f: File | undefined) => {
    if (!f) return;
    const code = codeFromFile(await f.text());
    const p = code ? decodeShare(code) : null;
    if (p) setPayload(p); else toast.error(t.shareInvalid);
  };
  const filePicker = <label className="mt-3 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-secondary px-5 text-sm font-medium">
    {t.shareOpenFile}<input type="file" accept="application/json,.json" className="sr-only" onChange={e => void openFile(e.target.files?.[0])} />
  </label>;
  if (!ready || payload === undefined) return <Page><PageHeader title={t.shareTitle} right={<span />} /></Page>;
  if (!payload) return <Page><PageHeader title={t.shareTitle} right={<span />} /><div className="glass p-6 text-center"><p className="font-medium">{t.shareInvalid}</p><div className="flex flex-col items-center">{filePicker}<Button variant="ghost" className="mt-2 min-h-11 rounded-full" onClick={() => navigate({ to: "/" })}>{t.back}</Button></div></div></Page>;
  const tt = payload.timetable;
  const fields: [string, boolean][] = [[t.shareFieldTimes, true], [t.shareFieldSubjects, true], [t.shareFieldLengths, true], [t.shareFieldSchool, payload.fields.school], [t.shareFieldClass, payload.fields.className], [t.shareFieldHomework, payload.fields.homework]];
  const accept = () => {
    if (!mode) { toast.error(t.shareChooseFirst); return; }
    saveRecovery(state);
    update(s => applyShare(s, payload, mode));
    toast.success(t.shareApplied, { duration: 10000, action: { label: t.shareUndo, onClick: () => { const r = loadRecovery(); if (r) { replace(r); toast(t.shareRestored); } } } });
    navigate({ to: "/" });
  };
  const option = (m: ImportMode, title: string, hint: string) => (
    <label className={`glass flex min-h-11 cursor-pointer items-start gap-3 p-4 ${mode === m ? "ring-2 ring-primary" : ""}`}>
      <input type="radio" name="mode" className="mt-1 size-5 accent-primary" checked={mode === m} onChange={() => setMode(m)} />
      <span><span className="block font-semibold">{title}</span><span className="text-sm text-muted-foreground">{hint}</span></span>
    </label>
  );
  return <Page><PageHeader title={t.shareReviewTitle} right={<span />} />
    <div className="glass space-y-1 p-5">
      <p className="text-lg font-semibold">{tt.className || "—"}</p>
      {tt.school && <p className="text-sm text-muted-foreground">{tt.school}</p>}
      <p className="pt-1 text-sm text-muted-foreground">{t.lessonsCount(tt.days.flat().length)} · {t.homeworkCount(payload.homework.length)} · {tt.lessonLen}/{tt.breakLen} min</p>
    </div>
    <section className="glass mt-4 p-4" aria-labelledby="fields-in">
      <h2 id="fields-in" className="mb-2 text-sm font-semibold">{t.shareFieldsIncluded}</h2>
      <ul className="space-y-1 text-sm">{fields.map(([f, on]) => <li key={f} className={`flex items-center gap-2 ${on ? "" : "text-muted-foreground line-through"}`}>{on ? <Check className="size-4 text-primary" aria-hidden /> : <X className="size-4" aria-hidden />}{f}</li>)}</ul>
    </section>
    <div className="mt-4 space-y-3">{tt.days.map((day, i) => <div key={i} className="glass p-4"><p className="mb-2 text-sm font-semibold">{t.days[i]}</p><div className="flex flex-wrap gap-1.5">{sortByTime(day).map(l => <span key={l.id} className="glass-pill flex items-center gap-1.5 px-2.5 py-1 text-sm"><Dot subject={l.subject} />{l.time} {l.subject}</span>)}</div></div>)}</div>
    {payload.homework.length > 0 && <ul className="glass mt-4 space-y-1 p-4 text-sm">{payload.homework.map(h => <li key={h.id}><b>{h.subject}</b> · {h.title} · {h.due}</li>)}</ul>}
    <fieldset className="mt-4 space-y-2"><legend className="mb-2 text-sm font-semibold">{t.shareChooseMode}</legend>
      {option("merge", t.shareMerge, t.shareMergeHint)}
      {option("replace", t.shareReplace, t.shareReplaceHint)}
    </fieldset>
    <p className="mt-3 text-center text-sm text-muted-foreground">{t.shareSnapshotNote}</p>
    <div className="mt-3 grid grid-cols-2 gap-2"><Button variant="secondary" className="min-h-11 rounded-full" onClick={() => navigate({ to: "/" })}>{t.cancel}</Button><Button className="min-h-11 rounded-full" disabled={!mode} onClick={accept}>{t.shareAccept}</Button></div>
  </Page>;
}
