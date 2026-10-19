import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarPlus, ChevronLeft, Download, Upload } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { Page, PageHeader } from "@/components/app-ui";
import { buildIcs, download } from "@/lib/ics";
import { useApp, type ThemePref } from "@/lib/store";
import { emptyTimetable, newId, type Timetable } from "@/lib/timetable";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Orar" },
      { name: "description", content: "Language, appearance, backup and calendar export." },
      { property: "og:title", content: "Settings · Orar" },
      { property: "og:description", content: "Language, appearance, backup and calendar export." },
    ],
  }),
  component: SettingsPage,
});

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { v: T; l: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-full bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all ${
            value === o.v ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5">
      <span className="font-medium">{label}</span>
      {children}
    </div>
  );
}

function ActionRow({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-5 py-4 text-left font-medium active:bg-muted">
      <span className="text-primary">{icon}</span>
      {label}
    </button>
  );
}

function SettingsPage() {
  const { t, lang, setLang, theme, setTheme, data, setData } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const tt = data ?? emptyTimetable();

  const onImport = async (f: File) => {
    try {
      const j = JSON.parse(await f.text()) as Timetable;
      if (!Array.isArray(j.days) || j.days.length !== 5) throw new Error();
      setData({
        ...emptyTimetable(),
        ...j,
        days: j.days.map((d) => d.map((l) => ({ id: newId(), time: String(l.time), subject: String(l.subject) }))),
      });
      toast.success(t.imported);
    } catch {
      toast.error(t.importFailed);
    }
  };

  return (
    <Page>
      <PageHeader
        title={t.settings}
        right={
          <Link to="/" aria-label="Back" className="glass-pill grid size-11 place-items-center">
            <ChevronLeft className="size-5" />
          </Link>
        }
      />
      <h3 className="mb-2 px-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t.general}</h3>
      <div className="glass mb-6 divide-y divide-border">
        <Row label={t.language}>
          <Segmented value={lang} onChange={setLang} options={[{ v: "ro", l: "RO" }, { v: "en", l: "EN" }]} />
        </Row>
        <Row label={t.appearance}>
          <Segmented<ThemePref>
            value={theme}
            onChange={setTheme}
            options={[{ v: "auto", l: t.auto }, { v: "light", l: t.light }, { v: "dark", l: t.dark }]}
          />
        </Row>
      </div>

      <h3 className="mb-2 px-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t.data}</h3>
      <div className="glass divide-y divide-border overflow-hidden">
        <ActionRow
          icon={<Download className="size-5" />}
          label={t.exportJson}
          onClick={() => download("orar.json", JSON.stringify(tt, null, 2), "application/json")}
        />
        <ActionRow icon={<Upload className="size-5" />} label={t.importJson} onClick={() => fileRef.current?.click()} />
        <ActionRow
          icon={<CalendarPlus className="size-5" />}
          label={t.exportIcs}
          onClick={() => download("orar.ics", buildIcs(tt, t.reminder), "text/calendar")}
        />
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onImport(f);
          e.target.value = "";
        }}
      />
    </Page>
  );
}
