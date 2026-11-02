import test from "node:test";
import assert from "node:assert/strict";
import {
  randomQuizPlan,
  buildQuizSession,
  quizDifficulty,
} from "./quizHelpers.js";
import { validateGeneratedPlan } from "../../supabase/functions/_shared/adaptive.js";
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
test("hard quiz uses written answers and rejects invalid or duplicate AI items", () => {
  const p = randomQuizPlan(cards, [], "hard");
  const q = buildQuizSession(p, cards);
  assert.equal(q[0].format, "write");
  assert.equal(q[0].choices.length, 0);
  p.items[1].conceptId = p.items[0].conceptId;
  assert.equal(buildQuizSession(p, cards), null);
  p.items[0].format = "hallucinated";
  assert.equal(buildQuizSession(p, cards), null);
});
test("backend rejects a generated format that does not match the requested level", () => {
  const plan = {
    focus_title: "Practice",
    session_reason: "Try these.",
    items: cards
      .slice(0, 5)
      .map((_, i) => ({
        card_ref: i + 1,
        format: "write",
        question: "Produce the phrase.",
        reason: "Recall.",
        hint: "Think of the course.",
      })),
  };
  assert.equal(validateGeneratedPlan(plan, cards, 5, "easy"), null);
  assert.equal(
    validateGeneratedPlan(plan, cards, 5, "hard").items[0].difficulty,
    "challenge",
  );
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
