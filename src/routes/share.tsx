import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dot, Page, PageHeader } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { applyShare, decodeShare, type SharePayload } from "@/lib/share";
import { sortByTime } from "@/lib/timetable";

export const Route = createFileRoute("/share")({
  head: () => ({ meta: [
    { title: "Shared timetable · Orar" }, { name: "description", content: "Preview and import a timetable shared by a classmate." },
    { property: "og:title", content: "Shared timetable · Orar" }, { property: "og:description", content: "Preview and import a timetable shared by a classmate." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: SharePage,
});

function SharePage() {
  const { t, ready, update } = useApp();
  const navigate = useNavigate();
  const [payload, setPayload] = useState<SharePayload | null | undefined>(undefined);
  useEffect(() => {
    const code = new URLSearchParams(window.location.hash.slice(1)).get("d");
    setPayload(code ? decodeShare(code) : null);
  }, []);
  if (!ready || payload === undefined) return <Page><PageHeader title={t.shareTitle} right={<span />} /></Page>;
  if (!payload) return <Page><PageHeader title={t.shareTitle} right={<span />} /><div className="glass p-6 text-center"><p className="font-medium">{t.shareInvalid}</p><Button className="mt-4 rounded-full" onClick={() => navigate({ to: "/" })}>{t.back}</Button></div></Page>;
  const tt = payload.timetable;
  const accept = () => { update(s => applyShare(s, payload)); toast.success(t.shareApplied); navigate({ to: "/" }); };
  return <Page><PageHeader title={t.shareFound} right={<span />} />
    <div className="glass space-y-1 p-5">
      <p className="text-lg font-semibold">{tt.className || "—"}</p>
      <p className="text-sm text-muted-foreground">{tt.school}</p>
      <p className="pt-1 text-xs text-muted-foreground">{t.lessonsCount(tt.days.flat().length)} · {t.homeworkCount(payload.homework.length)}</p>
    </div>
    <div className="mt-4 space-y-3">{tt.days.map((day, i) => <div key={i} className="glass p-4"><p className="mb-2 text-sm font-semibold">{t.days[i]}</p><div className="flex flex-wrap gap-1.5">{sortByTime(day).map(l => <span key={l.id} className="glass-pill flex items-center gap-1.5 px-2.5 py-1 text-xs"><Dot subject={l.subject} />{l.time} {l.subject}</span>)}</div></div>)}</div>
    <p className="mt-4 text-center text-xs text-muted-foreground">{t.shareReplaceWarn}</p>
    <div className="mt-3 grid grid-cols-2 gap-2"><Button variant="secondary" className="rounded-full" onClick={() => navigate({ to: "/" })}>{t.cancel}</Button><Button className="rounded-full" onClick={accept}>{t.shareAccept}</Button></div>
  </Page>;
}
