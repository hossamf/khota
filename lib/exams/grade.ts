/** Pure exam-grading logic. No DB, no I/O — unit testable. */

export interface GradeOption {
  id: string;
  isCorrect: boolean;
}

export interface GradeQuestion {
  id: string;
  type: string; // mcq | true_false | multi | short
  marks: number;
  options: GradeOption[];
}

export interface GradeAnswer {
  questionId: string;
  optionId?: string;
  multiIds?: string[];
  text?: string;
}

export type AnswerStatus = "correct" | "wrong" | "skipped" | "pending";

export interface GradeDetail {
  questionId: string;
  status: AnswerStatus;
  marksAwarded: number;
  selectedOptionId: string | null;
  answerText: string | null;
}

export interface GradeResult {
  score: number;
  total: number;
  percent: number;
  correct: number;
  wrong: number;
  skipped: number;
  details: GradeDetail[];
}

function isEmpty(a: GradeAnswer | undefined): boolean {
  if (!a) return true;
  return !a.optionId && !(a.multiIds?.length) && !a.text?.trim();
}

export function gradeAttempt(
  questions: GradeQuestion[],
  answers: GradeAnswer[]
): GradeResult {
  const byId = new Map(answers.map((a) => [a.questionId, a]));
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  let score = 0;
  let total = 0;
  const details: GradeDetail[] = [];

  for (const q of questions) {
    const marks = q.marks ?? 1;
    total += marks;
    const ans = byId.get(q.id);

    if (q.type === "short") {
      // Manual grading later; never auto-awarded.
      details.push({
        questionId: q.id,
        status: isEmpty(ans) ? "skipped" : "pending",
        marksAwarded: 0,
        selectedOptionId: null,
        answerText: ans?.text?.trim() ? ans.text.trim() : null,
      });
      skipped++;
      continue;
    }

    if (isEmpty(ans)) {
      skipped++;
      details.push({
        questionId: q.id,
        status: "skipped",
        marksAwarded: 0,
        selectedOptionId: null,
        answerText: null,
      });
      continue;
    }

    let ok = false;
    let selectedOptionId: string | null = null;
    let answerText: string | null = null;
    if (q.type === "multi") {
      const picked = new Set(ans!.multiIds ?? []);
      const right = new Set(q.options.filter((o) => o.isCorrect).map((o) => o.id));
      ok = picked.size === right.size && [...picked].every((x) => right.has(x));
      answerText = JSON.stringify([...picked]);
    } else {
      const chosen = q.options.find((o) => o.id === ans!.optionId);
      ok = Boolean(chosen?.isCorrect);
      selectedOptionId = ans!.optionId ?? null;
    }

    if (ok) {
      correct++;
      score += marks;
      details.push({ questionId: q.id, status: "correct", marksAwarded: marks, selectedOptionId, answerText });
    } else {
      wrong++;
      details.push({ questionId: q.id, status: "wrong", marksAwarded: 0, selectedOptionId, answerText });
    }
  }

  return {
    score,
    total,
    percent: total === 0 ? 0 : Math.round((score / total) * 100),
    correct,
    wrong,
    skipped,
    details,
  };
}

/** 80% watch rule for lesson completion. */
export function isLessonComplete(watchPercent: number): boolean {
  return watchPercent >= 80;
}

export function watchPercent(positionSec: number, durationSec: number): number {
  if (durationSec <= 0) return 0;
  return Math.min(100, Math.round((positionSec / durationSec) * 100));
}
