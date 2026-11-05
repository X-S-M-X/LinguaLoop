import test from "node:test";
import assert from "node:assert/strict";
import {
  randomQuizPlan,
  buildQuizSession,
  quizDifficulty,
} from "./quizHelpers.js";
import { weeklyPractice } from "./practiceHelpers.js";
const cards = Array.from({ length: 8 }, (_, i) => ({
  id: `c${i}`,
  concept_id: `c${i}`,
  prompt: `Meaning ${i}`,
  answer: `Phrase ${i}`,
  sort_order: i,
  correct_attempts: 0,
  incorrect_attempts: 0,
}));
test("chosen quiz levels override adaptive evidence consistently", () => {
  assert.equal(quizDifficulty("easy", 10, 0), "supported");
  assert.equal(quizDifficulty("hard", 0, 10), "challenge");
  assert.equal(quizDifficulty("medium", 10, 0), "standard");
  assert.equal(quizDifficulty("auto", 5, 0), "challenge");
});
test("fresh local quizzes are separate from mistake review and vary their selected cards", () => {
  const a = randomQuizPlan(cards, [], "easy", () => 0.1),
    b = randomQuizPlan(cards, [], "easy", () => 0.9);
  assert.equal(a.source, "local-quiz");
  assert.notDeepEqual(
    a.items.map((x) => x.conceptId),
    b.items.map((x) => x.conceptId),
  );
  assert.equal(new Set(a.items.map((x) => x.conceptId)).size, 5);
});
test("easy quiz builds two target-language options; medium can reverse to English", () => {
  const a = buildQuizSession(randomQuizPlan(cards, [], "easy"), cards);
  assert.equal(a[0].choices.length, 2);
  assert.ok(
    a[0].choices.some((c) => c.id === a[0].id && c.label === a[0].answer),
  );
  const b = buildQuizSession(randomQuizPlan(cards, [], "medium"), cards);
  assert.equal(b[0].format, "meaning");
  assert.equal(b[0].choices.length, 4);
  assert.ok(
    b[0].choices.some((c) => c.id === b[0].id && c.label === b[0].prompt),
  );
});
test("hard quiz uses written answers and rejects invalid or duplicate questions", () => {
  const p = randomQuizPlan(cards, [], "hard");
  const q = buildQuizSession(p, cards);
  assert.equal(q[0].format, "write");
  assert.equal(q[0].choices.length, 0);
  p.items[1].conceptId = p.items[0].conceptId;
  assert.equal(buildQuizSession(p, cards), null);
  p.items[0].format = "hallucinated";
  assert.equal(buildQuizSession(p, cards), null);
});
test("adaptive quiz uses each card's recent results to set its answer format", () => {
  const attempts = cards.flatMap((card, index) =>
    Array.from({ length: index === 0 ? 5 : index === 1 ? 3 : 0 }, (_, day) => ({
      concept_id: card.id,
      was_correct: true,
      created_at: `2026-11-0${day + 1}`,
    })),
  );
  const pool = cards.slice(0, 3);
  const questions = buildQuizSession(randomQuizPlan(pool, attempts), pool);
  assert.equal(questions.find((q) => q.id === "c0").format, "write");
  assert.equal(questions.find((q) => q.id === "c1").difficulty, "standard");
  assert.equal(questions.find((q) => q.id === "c2").difficulty, "supported");
  assert.equal(questions.length, 3);
});
test("small courses and duplicate translations cannot create duplicate answer choices", () => {
  const pool = cards.slice(0, 3).map((card) => ({ ...card, answer: "Same phrase" }));
  const questions = buildQuizSession(randomQuizPlan(pool, [], "easy"), pool);
  assert.equal(questions.length, 3);
  for (const question of questions) {
    assert.equal(question.choices.length, 1);
    assert.equal(question.choices[0].id, question.id);
  }
});
test("weekly activity excludes future and older attempts and includes the current day", () => {
  const now = new Date(2026, 9, 23, 12);
  const row = (d) => ({
    created_at: new Date(2026, 9, d, 10).toISOString(),
    was_correct: true,
  });
  const week = weeklyPractice([row(16), row(17), row(23), row(24)], now);
  assert.equal(week.length, 7);
  assert.equal(
    week.reduce((n, d) => n + d.total, 0),
    2,
  );
  assert.equal(week[6].total, 1);
});
