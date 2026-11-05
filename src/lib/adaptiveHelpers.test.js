import test from "node:test";
import assert from "node:assert/strict";
import {
  difficultyFromCounts,
  recentCounts,
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
