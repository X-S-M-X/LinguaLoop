import test from "node:test";
import assert from "node:assert/strict";
import {
  difficultyFromCounts,
  anonymousCandidates,
  validateGeneratedPlan,
} from "../../supabase/functions/_shared/adaptive.js";
import {
  recentCounts,
  localPracticePlan,
  buildAdaptiveQuestions,
  isWrittenAnswerCorrect,
} from "./adaptiveHelpers.js";

const cards = Array.from({ length: 6 }, (_, i) => ({
  id: `c${i}`,
  concept_id: `c${i}`,
  prompt: `Meaning ${i}`,
  answer: `Answer ${i}`,
  sort_order: i,
  difficulty: 1,
  correct_attempts: 0,
  incorrect_attempts: 0,
}));
const generated = () => ({
  focus_title: "Test session",
  session_reason: "Practise these phrases.",
  items: cards
    .slice(0, 5)
    .map((_, i) => ({
      card_ref: i + 1,
      format: "translate",
      question: "Which phrase fits?",
      reason: "Recent practice.",
      hint: "Think of the situation.",
    })),
});

test("difficulty requires evidence, advances at thresholds and drops after errors", () => {
  assert.equal(difficultyFromCounts(0, 0), "supported");
  assert.equal(difficultyFromCounts(2, 0), "supported");
  assert.equal(difficultyFromCounts(3, 0), "standard");
  assert.equal(difficultyFromCounts(4, 1), "challenge");
  assert.equal(difficultyFromCounts(7, 3), "standard");
  assert.equal(difficultyFromCounts(5, 5), "supported");
});
test("recent counts disregard older performance and unrelated concepts", () => {
  const history = Array.from({ length: 15 }, (_, i) => ({
    concept_id: "c0",
    was_correct: i < 5,
    created_at: `2026-09-${String(i + 1).padStart(2, "0")}`,
  }));
  assert.deepEqual(
    recentCounts("c0", [
      ...history,
      { concept_id: "other", was_correct: true, created_at: "2099" },
    ]),
    { correct: 0, incorrect: 10 },
  );
});
test("AI payload contains exactly the consented fields", () => {
  const payload = anonymousCandidates([
    {
      ...cards[0],
      email: "private",
      user_id: "private",
      created_at: "private",
      transcript: "private",
      romanization: "example",
    },
  ]);
  assert.deepEqual(Object.keys(payload[0]).sort(), [
    "answer",
    "card_ref",
    "correct_attempts",
    "incorrect_attempts",
    "prompt",
    "romanization",
  ]);
  assert.equal(JSON.stringify(payload).includes("private"), false);
});
test("server maps temporary references and calculates difficulty itself", () => {
  const candidates = cards.map((c) => ({ ...c, correct_attempts: 5 }));
  const output = generated();
  output.items.forEach((item) => (item.format = "write"));
  const plan = validateGeneratedPlan(output, candidates, 5);
  assert.equal(plan.items[0].conceptId, "c0");
  assert.equal(plan.items[0].difficulty, "challenge");
});
test("server rejects malformed, duplicate, oversized and out-of-bank AI output", () => {
  for (const mutate of [
    (p) => {
      p.items[0] = null;
    },
    (p) => {
      p.items[1].card_ref = 1;
    },
    (p) => {
      p.items[1].card_ref = 77;
    },
    (p) => {
      p.items[0].question = "x".repeat(241);
    },
    (p) => {
      p.items.pop();
    },
    (p) => {
      p.items[0].hint = "";
    },
  ]) {
    const p = generated();
    mutate(p);
    assert.equal(validateGeneratedPlan(p, cards, 5), null);
  }
  assert.equal(validateGeneratedPlan(null, cards, 5), null);
});
test("local fallback builds the complete five-question activity without AI", () => {
  const plan = localPracticePlan(cards, [], new Set());
  assert.equal(plan.source, "smart-review");
  const questions = buildAdaptiveQuestions(plan, cards, () => 0.3);
  assert.equal(questions.length, 5);
  for (const q of questions) {
    assert.equal(q.choices.length, 2);
    assert.equal(new Set(q.choices.map((c) => c.label)).size, 2);
    assert.equal(
      q.choices.some((c) => c.id === q.id),
      true,
    );
  }
});
test("client builds four-choice and written rounds and rejects untrusted plans", () => {
  const plan = localPracticePlan(cards, [], new Set());
  plan.items[0].difficulty = "standard";
  plan.items[1].difficulty = "challenge";
  const q = buildAdaptiveQuestions(plan, cards);
  assert.equal(q[0].choices.length, 4);
  assert.equal(q[1].choices.length, 0);
  plan.items[1].conceptId = plan.items[0].conceptId;
  assert.equal(buildAdaptiveQuestions(plan, cards), null);
  assert.equal(buildAdaptiveQuestions({ items: [null] }, cards), null);
});
test("written French preserves accents and tolerates curly apostrophes and case", () => {
  assert.equal(
    isWrittenAnswerCorrect("S’il vous plaît", "S'IL VOUS PLAÎT!", "fr-FR"),
    true,
  );
  assert.equal(
    isWrittenAnswerCorrect("À bientôt", "A bientot", "fr-FR"),
    false,
  );
  assert.equal(isWrittenAnswerCorrect("Bonjour", "Bonsoir", "fr-FR"), false);
  assert.equal(isWrittenAnswerCorrect("Bonjour", "   ", "fr-FR"), false);
});
test("written Chinese, Arabic and Japanese retain meaningful distinctions", () => {
  assert.equal(isWrittenAnswerCorrect("你好", "你 好！", "zh-CN"), true);
  assert.equal(isWrittenAnswerCorrect("شكرا", "شُكْرًا", "ar-SA"), true);
  assert.equal(isWrittenAnswerCorrect("لا أفهم", "لا افهم", "ar-SA"), false);
  assert.equal(isWrittenAnswerCorrect("ば", "は", "ja-JP"), false);
});
