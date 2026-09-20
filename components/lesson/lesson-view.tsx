"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { savePosition, completeLesson, addNote } from "@/app/actions/learning";

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: string | HTMLElement,
        opts: Record<string, unknown>
      ) => {
        getCurrentTime: () => number;
        getDuration: () => number;
        destroy: () => void;
      };
      PlayerState: { PLAYING: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface NoteItem {
  id: string;
  content: string;
  timestamp_sec: number;
  created_at: string;
}

function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

export function LessonView({
  lessonId,
  videoId,
  initialPosition,
  initialCompleted,
  initialNotes,
}: {
  lessonId: string;
  videoId: string | null;
  initialPosition: number;
  initialCompleted: boolean;
  initialNotes: NoteItem[];
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [percent, setPercent] = useState<number | null>(null);
  const [currentSec, setCurrentSec] = useState(0);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const playerRef = useRef<{ getCurrentTime: () => number; getDuration: () => number; destroy: () => void } | null>(null);
  const doneRef = useRef(initialCompleted);

  useEffect(() => {
    if (!videoId) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    async function flush(sec: number, dur: number) {
      if (dur <= 0) return;
      const r = await savePosition(lessonId, sec, dur);
      if (!cancelled && r) {
        setPercent(r.percent);
        if (r.completed && !doneRef.current) {
          doneRef.current = true;
          setCompleted(true);
        }
      }
    }

    function boot() {
      if (cancelled || !window.YT?.Player) return;
      const player = new window.YT.Player("yt-player", {
        events: {
          onReady: (e: { target: { seekTo?: (s: number) => void } }) => {
            if (initialPosition > 5) e.target.seekTo?.(initialPosition);
          },
          onStateChange: (e: { data: number }) => {
            const YT = window.YT!;
            if (e.data === YT.PlayerState.PLAYING) {
              if (timer) clearInterval(timer);
              timer = setInterval(() => {
                try {
                  const p = playerRef.current;
                  if (!p) return;
                  const sec = p.getCurrentTime();
                  const dur = p.getDuration();
                  setCurrentSec(sec);
                  flush(sec, dur);
                } catch {
                  /* player not ready */
                }
              }, 5000);
            } else {
              if (timer) {
                clearInterval(timer);
                timer = null;
              }
              try {
                const p = playerRef.current;
                if (p) flush(p.getCurrentTime(), p.getDuration());
              } catch {
                /* ignore */
              }
            }
          },
        },
      });
      playerRef.current = player;
    }

    if (window.YT?.Player) {
      boot();
    } else {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = boot;
    }

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, lessonId]);

  async function onComplete() {
    setSaving(true);
    try {
      await completeLesson(lessonId);
      doneRef.current = true;
      setCompleted(true);
      setPercent(100);
    } finally {
      setSaving(false);
    }
  }

  async function onAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    try {
      await addNote(lessonId, note, currentSec);
      setNote("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        {videoId ? (
          <div className="aspect-video w-full overflow-hidden rounded-3xl border border-border/80 bg-slate-950 shadow-2xl">
            <iframe
              id="yt-player"
              title="lesson video"
              className="h-full w-full"
              src={youtubeEmbedUrl(videoId)}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="rounded-3xl border-2 border-dashed border-border p-10 text-center text-sm text-muted">
            لا يوجد فيديو مرفق بهذا الدرس بعد.
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/80 bg-surface/85 p-4 backdrop-blur-xl">
          <button
            onClick={onComplete}
            disabled={saving || completed}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-2 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:opacity-95 active:scale-[0.98] disabled:opacity-50 transition-all"
          >
            {completed ? "✓ مكتمل" : saving ? "..." : "تحديد كمكتمل"}
          </button>
          {percent !== null ? (
            <>
              <div className="h-2 min-w-32 flex-1 overflow-hidden rounded-full bg-border" dir="ltr">
                <div className="h-full rounded-full bg-gradient-brand transition-all" style={{ width: `${percent}%` }} />
              </div>
              <span className="text-sm font-bold text-primary" dir="ltr">{percent}%</span>
            </>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-3 rounded-3xl border border-border/80 bg-surface/85 p-5 backdrop-blur-xl">
        <h2 className="font-black">ملاحظاتي 📝</h2>
        <form onSubmit={onAddNote} className="flex flex-col gap-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`ملاحظة عند ${formatTime(currentSec)}...`}
            rows={3}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary"
          />
          <button
            type="submit"
            disabled={saving || !note.trim()}
            className="rounded-xl border border-border px-4 py-2 text-sm font-bold hover:border-primary/50 disabled:opacity-50 transition"
          >
            حفظ الملاحظة
          </button>
        </form>
        <div className="flex flex-col gap-2">
          {initialNotes.length === 0 ? (
            <p className="text-sm text-muted">لا توجد ملاحظات بعد.</p>
          ) : (
            initialNotes.map((n) => (
              <div key={n.id} className="rounded-xl border border-border bg-background/60 p-3 text-sm">
                <div className="mb-1 text-xs font-bold text-primary" dir="ltr">{formatTime(n.timestamp_sec)}</div>
                <div>{n.content}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
