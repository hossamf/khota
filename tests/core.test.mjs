import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { gradeAttempt, watchPercent, isLessonComplete } from "../lib/exams/grade.ts";
import { parseYouTubeId } from "../lib/youtube.ts";

describe("gradeAttempt", () => {
  const mcq = {
    id: "q1",
    type: "mcq",
    marks: 2,
    options: [
      { id: "a", isCorrect: false },
      { id: "b", isCorrect: true },
    ],
  };

  it("scores a correct mcq with full marks", () => {
    const r = gradeAttempt([mcq], [{ questionId: "q1", optionId: "b" }]);
    assert.equal(r.score, 2);
    assert.equal(r.percent, 100);
    assert.equal(r.correct, 1);
    assert.equal(r.details[0].status, "correct");
  });

  it("scores a wrong mcq with zero", () => {
    const r = gradeAttempt([mcq], [{ questionId: "q1", optionId: "a" }]);
    assert.equal(r.score, 0);
    assert.equal(r.wrong, 1);
    assert.equal(r.details[0].status, "wrong");
  });

  it("counts unanswered as skipped", () => {
    const r = gradeAttempt([mcq], []);
    assert.equal(r.skipped, 1);
    assert.equal(r.score, 0);
    assert.equal(r.percent, 0);
  });

  it("requires exact set match for multi", () => {
    const q = {
      id: "qm",
      type: "multi",
      marks: 3,
      options: [
        { id: "a", isCorrect: true },
        { id: "b", isCorrect: false },
        { id: "c", isCorrect: true },
      ],
    };
    const full = gradeAttempt([q], [{ questionId: "qm", multiIds: ["a", "c"] }]);
    assert.equal(full.score, 3);
    const partial = gradeAttempt([q], [{ questionId: "qm", multiIds: ["a"] }]);
    assert.equal(partial.score, 0);
    assert.equal(partial.wrong, 1);
  });

  it("marks short answers pending with zero auto marks", () => {
    const q = { id: "qs", type: "short", marks: 5, options: [] };
    const r = gradeAttempt([q], [{ questionId: "qs", text: "إجابتي" }]);
    assert.equal(r.details[0].status, "pending");
    assert.equal(r.score, 0);
    assert.equal(r.skipped, 1);
  });

  it("computes mixed percent correctly", () => {
    const q2 = { ...mcq, id: "q2" };
    const r = gradeAttempt([mcq, q2], [
      { questionId: "q1", optionId: "b" },
      { questionId: "q2", optionId: "a" },
    ]);
    assert.equal(r.score, 2);
    assert.equal(r.total, 4);
    assert.equal(r.percent, 50);
  });
});

describe("watch progress rule", () => {
  it("computes percent and clamps to 100", () => {
    assert.equal(watchPercent(45, 100), 45);
    assert.equal(watchPercent(200, 100), 100);
    assert.equal(watchPercent(0, 0), 0);
  });

  it("completes at 80% and above", () => {
    assert.equal(isLessonComplete(80), true);
    assert.equal(isLessonComplete(100), true);
    assert.equal(isLessonComplete(79), false);
  });
});

describe("parseYouTubeId", () => {
  it("accepts raw ids", () => {
    assert.equal(parseYouTubeId("aqz-KE-bpKQ"), "aqz-KE-bpKQ");
  });

  it("parses watch, share and shorts urls", () => {
    assert.equal(parseYouTubeId("https://www.youtube.com/watch?v=aqz-KE-bpKQ"), "aqz-KE-bpKQ");
    assert.equal(parseYouTubeId("https://youtu.be/aqz-KE-bpKQ"), "aqz-KE-bpKQ");
    assert.equal(parseYouTubeId("https://www.youtube.com/shorts/aqz-KE-bpKQ"), "aqz-KE-bpKQ");
    assert.equal(parseYouTubeId("https://www.youtube.com/embed/aqz-KE-bpKQ"), "aqz-KE-bpKQ");
  });

  it("rejects garbage", () => {
    assert.equal(parseYouTubeId("hello world"), null);
    assert.equal(parseYouTubeId("https://example.com/?v=123"), null);
    assert.equal(parseYouTubeId(""), null);
  });
});
