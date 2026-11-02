import { difficultyFromCounts } from "../../supabase/functions/_shared/adaptive.js";
import {
  buildQuizQuestions,
  buildSmartReviewSession,
} from "./lessonHelpers.js";

export const DIFFICULTY_LABELS = {
  supported: "Two choices",
  standard: "Four choices",
  challenge: "Write the answer",
};

export function recentCounts(id, attempts) {
  const recent = attempts
    .filter((attempt) => attempt.concept_id === id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 10);
  return {
    correct: recent.filter((a) => a.was_correct).length,
    incorrect: recent.filter((a) => !a.was_correct).length,
  };
}

export function localPracticePlan(cards, attempts, completedIds) {
  const selected = buildSmartReviewSession(cards, attempts, completedIds, 5);
  return {
    source: "smart-review",
    focusTitle: "Your adaptive practice",
    sessionReason:
      "Two choices to start, four as you improve, then written recall. Difficulty uses your recent attempts on each card.",
    items: selected.map((card) => {
      const { correct, incorrect } = recentCounts(card.id, attempts);
      return {
        conceptId: card.id,
        question: `How would you express “${card.prompt}”?`,
        reason: "Selected using your mistakes and unlearned cards.",
        hint: "Think back to this phrase in your flashcards.",
        difficulty: difficultyFromCounts(correct, incorrect),
      };
    }),
  };
}

export function buildAdaptiveQuestions(plan, cards, random = Math.random) {
  if (
    !plan ||
    !Array.isArray(plan.items) ||
    plan.items.length !== Math.min(5, cards.length)
  )
    return null;
  const seen = new Set();
  const questions = [];
  for (const item of plan.items) {
    if (
      !item ||
      seen.has(item.conceptId) ||
      !Object.hasOwn(DIFFICULTY_LABELS, item.difficulty)
    )
      return null;
    const card = cards.find((c) => c.id === item.conceptId);
    if (
      !card ||
      ["question", "hint", "reason"].some(
        (key) =>
          typeof item[key] !== "string" ||
          !item[key].trim() ||
          item[key].length > 240,
      )
    )
      return null;
    seen.add(item.conceptId);
    const choices =
      item.difficulty === "challenge"
        ? []
        : buildQuizQuestions(cards, {
            choiceCount: item.difficulty === "supported" ? 2 : 4,
            random,
          }).find((q) => q.id === card.id).choices;
    questions.push({ ...card, ...item, choices });
  }
  return questions;
}

export function normalizeWrittenAnswer(value, locale = "en") {
  // Keep accents and Japanese voicing marks: they can change the word.
  let result = String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase(locale)
    .trim();
  if (locale.startsWith("ar"))
    result = result.replace(/[\u064B-\u065F\u0670\u0640]/g, "");
  result = result
    .replace(/[’‘']/g, "")
    .replace(/[^\p{Letter}\p{Number}\p{Mark}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
  return /^(zh|ja)/.test(locale) ? result.replace(/ /g, "") : result;
}

export function isWrittenAnswerCorrect(expected, actual, locale) {
  const answer = normalizeWrittenAnswer(actual, locale);
  return Boolean(answer) && normalizeWrittenAnswer(expected, locale) === answer;
}
