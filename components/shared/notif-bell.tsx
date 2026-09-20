"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { markNotificationRead, markAllNotificationsRead } from "@/app/actions/notifications";

export interface Notif {
  id: string;
  type: string;
  title_ar: string;
  body_ar: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export function NotifBell({ initial, unread }: { initial: Notif[]; unread: number }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function read(id: string, link: string | null) {
    await markNotificationRead(id);
    if (link) {
      router.push(link);
    } else {
      router.refresh();
    }
    setOpen(false);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="الإشعارات"
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-surface/80 text-foreground hover:bg-surface-raised hover:text-primary active:scale-95 transition-all shadow-sm"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white ring-2 ring-background animate-pulse">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute left-0 z-50 mt-2 w-80 sm:w-96 rounded-2xl border border-border/80 bg-surface/95 backdrop-blur-xl p-3 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
          <div className="mb-2 flex items-center justify-between border-b border-border/60 pb-2.5 px-2">
            <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
              <Bell className="h-3.5 w-3.5 text-primary" />
              <span>الإشعارات</span>
              {unread > 0 && (
                <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {unread} جديد
                </span>
              )}
            </div>
            {unread > 0 ? (
              <button
                onClick={async () => {
                  await markAllNotificationsRead();
                  router.refresh();
                }}
                className="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>قراءة الكل</span>
              </button>
            ) : null}
          </div>

          {initial.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted">
              <Inbox className="h-8 w-8 stroke-1 opacity-50 mb-1" />
              <p className="text-xs">لا توجد إشعارات حالياً</p>
            </div>
          ) : (
            <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto pr-1">
              {initial.map((n) => (
                <button
                  key={n.id}
                  onClick={() => read(n.id, n.link)}
                  className={`w-full rounded-xl p-3 text-right text-sm transition-all ${
                    n.is_read
                      ? "bg-surface-raised/40 text-muted hover:bg-surface-raised"
                      : "bg-primary/5 text-foreground font-semibold border border-primary/15 hover:bg-primary/10"
                  }`}
                >
                  <div className="text-xs leading-snug">{n.title_ar}</div>
                  {n.body_ar ? (
                    <div className="mt-1 text-[11px] text-muted line-clamp-2 font-normal">
                      {n.body_ar}
                    </div>
                  ) : null}
                  <div className="mt-1 text-[9px] text-muted/70" dir="ltr">
                    {new Date(n.created_at).toLocaleTimeString("ar-EG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
