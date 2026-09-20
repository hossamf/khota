"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitAttempt, type AnswerInput } from "@/app/actions/student-exams";

export interface TakeQuestion {
  id: string;
  text: string;
  type: string;
  options: { id: string; text: string }[];
}

function formatLeft(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function TakeExam({
  attemptId,
  durationMin,
  questions,
}: {
  attemptId: string;
  durationMin: number;
  questions: TakeQuestion[];
}) {
  const router = useRouter();
  const [single, setSingle] = useState<Record<string, string>>({});
  const [multi, setMulti] = useState<Record<string, string[]>>({});
  const [text, setText] = useState<Record<string, string>>({});
  const [left, setLeft] = useState(durationMin * 60);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const doneRef = useRef(false);

  const payload: AnswerInput[] = useMemo(
    () =>
      questions.map((q) => ({
        questionId: q.id,
        optionId: single[q.id],
        multiIds: multi[q.id],
        text: text[q.id],
      })),
    [questions, single, multi, text]
  );

  async function submit() {
    if (doneRef.current || submitting) return;
    doneRef.current = true;
    setSubmitting(true);
    try {
      await submitAttempt(attemptId, payload);
      router.push(`/exams/attempts/${attemptId}`);
      router.refresh();
    } catch (err) {
      doneRef.current = false;
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "فشل التسليم");
    }
  }

  useEffect(() => {
    if (left <= 0) {
      const t = setTimeout(() => {
        void submit();
      }, 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

  function toggleMulti(qid: string, oid: string) {
    setMulti((prev) => {
      const cur = prev[qid] ?? [];
      return { ...prev, [qid]: cur.includes(oid) ? cur.filter((x) => x !== oid) : [...cur, oid] };
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="sticky top-20 z-30 flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-surface/90 p-3 shadow-lg backdrop-blur-xl">
        <span className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-black ${left < 300 ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"}`}>
          ⏱ المتبقي: <span dir="ltr">{formatLeft(left)}</span>
        </span>
        <button onClick={submit} disabled={submitting} className="rounded-xl bg-gradient-brand px-6 py-2 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:opacity-95 disabled:opacity-50 transition-all">
          {submitting ? "جاري التسليم..." : "تسليم الامتحان"}
        </button>
      </div>
      {error ? <p className="rounded-xl border border-danger/40 bg-danger/5 p-3 text-sm text-danger">{error}</p> : null}
      {questions.map((q, i) => (
        <div key={q.id} className="rounded-3xl border border-border/80 bg-surface/85 p-5 backdrop-blur-xl">
          <div className="mb-3 font-bold">({i + 1}) {q.text}</div>
          {q.type === "short" ? (
            <textarea
              value={text[q.id] ?? ""}
              onChange={(e) => setText({ ...text, [q.id]: e.target.value })}
              rows={3}
              placeholder="اكتب إجابتك (تُصحح يدوياً لاحقاً)"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary"
            />
          ) : q.type === "multi" ? (
            <div className="flex flex-col gap-2">
              {q.options.map((o) => {
                const checked = (multi[q.id] ?? []).includes(o.id);
                return (
                  <label key={o.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${checked ? "border-primary/60 bg-primary/5" : "border-border hover:border-primary/40"}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleMulti(q.id, o.id)} className="accent-primary" />
                    {o.text}
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {q.options.map((o) => {
                const checked = single[q.id] === o.id;
                return (
                  <label key={o.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${checked ? "border-primary/60 bg-primary/5" : "border-border hover:border-primary/40"}`}>
                    <input type="radio" name={q.id} checked={checked} onChange={() => setSingle({ ...single, [q.id]: o.id })} className="accent-primary" />
                    {o.text}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      ))}
      <button onClick={submit} disabled={submitting} className="rounded-2xl bg-gradient-brand px-6 py-3.5 font-bold text-white shadow-lg shadow-primary/25 hover:opacity-95 disabled:opacity-50 transition-all">
        {submitting ? "جاري التسليم..." : "تسليم الامتحان"}
      </button>
    </div>
  );
}
