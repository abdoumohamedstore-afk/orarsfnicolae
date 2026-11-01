import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useApp } from "@/lib/store";
import { encodeShare, shareUrl } from "@/lib/share";
import { dateKey } from "@/lib/schedule-days";

export function ShareButton() {
  const { t, state } = useApp();
  const [open, setOpen] = useState(false);
  const [withHw, setWithHw] = useState(true);
  const url = useMemo(() => {
    if (!open || !state.timetable) return "";
    return shareUrl(window.location.origin, encodeShare(state, dateKey(new Date()), withHw));
  }, [open, state, withHw]);
  const copy = async () => { try { await navigator.clipboard.writeText(url); toast.success(t.linkCopied); } catch { toast.error(url); } };
  return <>
    <Button variant="secondary" className="h-auto w-full justify-start rounded-full py-3 whitespace-normal text-left" onClick={() => state.timetable ? setOpen(true) : toast(t.shareEmpty)}><QrCode />{t.share}</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[calc(100%-32px)] max-w-sm rounded-3xl">
        <DialogTitle>{t.shareTitle}</DialogTitle>
        <DialogDescription>{t.shareHint}</DialogDescription>
        {url && <div className="mx-auto rounded-2xl bg-white p-3"><QRCodeSVG value={url} size={240} level="L" className="block h-auto w-full max-w-[240px]" /></div>}
        <label className="flex items-center justify-between gap-4 text-sm font-medium">{t.includeHomework}<input type="checkbox" role="switch" className="size-5 accent-primary" checked={withHw} onChange={e => setWithHw(e.target.checked)} /></label>
        <Button className="rounded-full" onClick={() => void copy()}><Copy />{t.copyLink}</Button>
      </DialogContent>
    </Dialog>
  </>;
}
