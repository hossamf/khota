"use client";

import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** Button that subscribes this device for push notifications. */
export function PushEnabler() {
  const [state, setState] = useState<"unsupported" | "off" | "on" | "busy" | "blocked">(() =>
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window
      ? "off"
      : "unsupported"
  );

  useEffect(() => {
    if (
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      return;
    }
    let cancelled = false;
    navigator.serviceWorker
      .getRegistration()
      .then(async (reg) => {
        if (cancelled) return;
        const r = reg ?? (await navigator.serviceWorker.register("/sw.js"));
        const sub = await r.pushManager.getSubscription();
        if (!cancelled) setState(sub ? "on" : Notification.permission === "denied" ? "blocked" : "off");
      })
      .catch(() => {
        if (!cancelled) setState("unsupported");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!pub) return;
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("blocked");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(pub),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setState(res.ok ? "on" : "off");
    } catch {
      setState("off");
    }
  }

  async function disable() {
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("off");
    } catch {
      setState("on");
    }
  }

  if (state === "unsupported") return null;

  return (
    <button
      onClick={state === "on" ? disable : enable}
      disabled={state === "busy"}
      className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${
        state === "on"
          ? "border-success/40 bg-success/10 text-success"
          : "border-border hover:border-primary/50"
      }`}
    >
      <BellRing className="h-3.5 w-3.5" />
      {state === "on"
        ? "إشعارات الجهاز مفعّلة ✓"
        : state === "blocked"
          ? "الإشعارات محظورة من المتصفح"
          : state === "busy"
            ? "..."
            : "تفعيل إشعارات الجهاز"}
    </button>
  );
}
