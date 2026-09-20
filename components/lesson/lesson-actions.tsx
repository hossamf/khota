"use client";

import { useState } from "react";
import { toggleFavoriteLesson, toggleWatchLater } from "@/app/actions/library";

export function LessonActions({
  lessonId,
  initialFav,
  initialWL,
}: {
  lessonId: string;
  initialFav: boolean;
  initialWL: boolean;
}) {
  const [fav, setFav] = useState(initialFav);
  const [wl, setWl] = useState(initialWL);
  const [busy, setBusy] = useState(false);

  async function onFav() {
    setBusy(true);
    try {
      setFav(await toggleFavoriteLesson(lessonId));
    } finally {
      setBusy(false);
    }
  }

  async function onWl() {
    setBusy(true);
    try {
      setWl(await toggleWatchLater(lessonId));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-2">
      <button onClick={onFav} disabled={busy} aria-label="مفضلة"
        className={`rounded-xl border px-3 py-1.5 text-sm font-bold transition active:scale-95 ${fav ? "border-warning/50 bg-warning/15 text-warning" : "border-border bg-surface hover:border-warning/50"}`}>
        {fav ? "★ مفضلة" : "☆ مفضلة"}
      </button>
      <button onClick={onWl} disabled={busy} aria-label="مشاهدة لاحقا"
        className={`rounded-xl border px-3 py-1.5 text-sm font-bold transition active:scale-95 ${wl ? "border-secondary/50 bg-secondary/15 text-secondary" : "border-border bg-surface hover:border-secondary/50"}`}>
        {wl ? "✓ لاحقاً" : "+ لاحقاً"}
      </button>
    </div>
  );
}
