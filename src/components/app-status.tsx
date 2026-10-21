import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { setupServiceWorker, refreshApp } from "@/lib/pwa";
import { dueReminders } from "@/lib/reminders";
export function AppStatus() {
  const { state, ready, t, storageError } = useApp(); const [offline, setOffline] = useState(false); const [update, setUpdate] = useState(false); const seen = useRef(new Set<string>()); const latest = useRef({ state, t });
  useEffect(() => { latest.current = { state, t }; }, [state, t]);
  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine); sync(); window.addEventListener("online", sync); window.addEventListener("offline", sync);
    void setupServiceWorker({ onReady: () => { try { if (!localStorage.getItem("orar.offlineReady")) { toast.success(latest.current.t.offlineReady); localStorage.setItem("orar.offlineReady", "1"); } } catch {} }, onUpdate: () => setUpdate(true) });
    return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", sync); };
  }, []);
  useEffect(() => {
    if (!ready) return;
    const check = async () => {
      const { state: current, t: text } = latest.current;
      for (const reminder of dueReminders(current, new Date())) {
        if (seen.current.has(reminder.id)) continue;
        const key = `orar.reminder:${reminder.id}`;
        try { if (sessionStorage.getItem(key)) continue; sessionStorage.setItem(key, "1"); } catch {}
        seen.current.add(reminder.id);
        const body = reminder.kind === "lesson" ? `${reminder.subject ?? ""} ${text.reminder}` : text.packingReminder;
        toast(body, { duration: 15_000 });
        if ("Notification" in window && Notification.permission === "granted") {
          try { const registration = await navigator.serviceWorker?.getRegistration(); if (registration) await registration.showNotification("Orar", { body, tag: reminder.id, icon: "/icon-192.png" }); else new Notification("Orar", { body, tag: reminder.id }); } catch {}
        }
      }
    };
    void check(); const timer = setInterval(() => void check(), 15_000); document.addEventListener("visibilitychange", check);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", check); };
  }, [ready]);
  if (!offline && !update && !storageError) return null;
  return <aside className="sticky top-0 z-40 bg-background px-4 py-2 text-center text-xs">{offline && <p className="flex items-center justify-center gap-2"><WifiOff className="size-4" />{t.offline}</p>}{storageError && <p className="text-destructive">{t.storageError}</p>}{update && <Button variant="ghost" className="h-auto whitespace-normal text-xs text-primary" onClick={() => void refreshApp()}><RefreshCw />{t.updateAvailable}</Button>}</aside>;
}
