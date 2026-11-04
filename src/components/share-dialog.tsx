import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, Download, Info, QrCode, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useApp } from "@/lib/store";
import { DEFAULT_SHARE_OPTIONS, MAX_QR_URL, encodeShare, shareFile, shareUrl, type ShareOptions } from "@/lib/share";
import { dateKey } from "@/lib/schedule-days";

export function ShareButton() {
  const { t, state } = useApp();
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ShareOptions>(DEFAULT_SHARE_OPTIONS);
  const code = useMemo(() => (open && state.timetable ? encodeShare(state, dateKey(new Date()), opts) : ""), [open, state, opts]);
  const url = code ? shareUrl(window.location.origin, code) : "";
  const tooLarge = url.length > MAX_QR_URL;
  const copy = async () => { try { await navigator.clipboard.writeText(url); toast.success(t.linkCopied); } catch { toast.error(url); } };
  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([shareFile(code)], { type: "application/json" }));
    a.download = "orar-share.json"; a.click(); URL.revokeObjectURL(a.href);
  };
  const toggle = (k: keyof ShareOptions, label: string) => (
    <label className="flex min-h-11 items-center justify-between gap-3 text-sm">{label}
      <input type="checkbox" role="switch" className="size-5 shrink-0 accent-primary" checked={opts[k]} onChange={e => setOpts(o => ({ ...o, [k]: e.target.checked }))} />
    </label>
  );
  return <>
    <Button variant="secondary" className="h-auto w-full justify-start rounded-full py-3 whitespace-normal text-left" onClick={() => state.timetable ? setOpen(true) : toast(t.shareEmpty)}><QrCode />{t.share}</Button>
    <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) setOpts(DEFAULT_SHARE_OPTIONS); }}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-32px)] max-w-sm overflow-y-auto rounded-3xl">
        <DialogTitle>{t.shareTitle}</DialogTitle>
        <DialogDescription>{t.shareHint}</DialogDescription>
        {url && !tooLarge && <div className="mx-auto rounded-2xl bg-white p-3"><QRCodeSVG value={url} size={220} level="L" className="block h-auto w-full max-w-[220px]" /></div>}
        {tooLarge && <p role="alert" className="flex gap-2 rounded-2xl bg-destructive/10 p-3 text-sm text-foreground"><TriangleAlert className="size-4 shrink-0 text-destructive" />{t.shareTooLarge}</p>}
        <p className="text-xs text-muted-foreground">{t.shareSize(url.length, MAX_QR_URL)}</p>
        <section aria-labelledby="share-fields">
          <h3 id="share-fields" className="mb-1 text-sm font-semibold">{t.shareIncludeTitle}</h3>
          <ul className="mb-1 space-y-1 text-sm">
            {[t.shareFieldTimes, t.shareFieldSubjects, t.shareFieldLengths].map(f => <li key={f} className="flex items-center gap-2"><Check className="size-4 text-primary" aria-hidden />{f}</li>)}
          </ul>
          {toggle("school", t.shareFieldSchool)}
          {toggle("className", t.shareFieldClass)}
          {toggle("homework", t.shareFieldHomework)}
          <p className="mt-1 text-xs text-muted-foreground">{t.shareNeverNotes}</p>
        </section>
        <section className="rounded-2xl bg-muted/60 p-3 text-xs" aria-labelledby="share-how">
          <h3 id="share-how" className="mb-1 flex items-center gap-1.5 text-sm font-semibold"><Info className="size-4" aria-hidden />{t.shareHowTitle}</h3>
          <p>{t.shareHowBody}</p><p className="mt-1 font-medium">{t.shareNoRevoke}</p>
        </section>
        <div className="grid gap-2">
          {!tooLarge && <Button className="min-h-11 rounded-full" onClick={() => void copy()}><Copy />{t.copyLink}</Button>}
          <Button variant={tooLarge ? "default" : "secondary"} className="min-h-11 rounded-full" onClick={download}><Download />{t.shareSaveFile}</Button>
        </div>
      </DialogContent>
    </Dialog>
  </>;
}
