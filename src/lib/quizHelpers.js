import { shuffleItems } from "./lessonHelpers.js";
import { recentCounts } from "./adaptiveHelpers.js";
import { difficultyFromCounts } from "../../supabase/functions/_shared/adaptive.js";
export const QUIZ_LEVELS = [
  { id: "auto", label: "Adapt to me", text: "Use my recent results" },
  { id: "easy", label: "Easy", text: "Recognise the phrase" },
  { id: "medium", label: "Medium", text: "Switch between meanings" },
  { id: "hard", label: "Hard", text: "Write it from memory" },
];
export function quizDifficulty(level, correct = 0, incorrect = 0) {
  return (
    { easy: "supported", medium: "standard", hard: "challenge" }[level] ||
    difficultyFromCounts(correct, incorrect)
  );
}
export function buildQuizSession(plan, cards, random = Math.random) {
  if (
    !plan ||
    !Array.isArray(plan.items) ||
    plan.items.length !== Math.min(5, cards.length)
  )
    return null;
  const seen = new Set();
  return plan.items
    .map((item) => {
      if (
        !item ||
        seen.has(item.conceptId) ||
        !["supported", "standard", "challenge"].includes(item.difficulty) ||
        !["translate", "meaning", "write"].includes(item.format) ||
        ["question", "hint", "reason"].some(
          (key) =>
            typeof item[key] !== "string" ||
            !item[key].trim() ||
            item[key].length > 240,
        )
      )
        return null;
      const card = cards.find((c) => c.id === item.conceptId);
      if (!card) return null;
      seen.add(card.id);
      const kind =
        item.difficulty === "challenge"
          ? "write"
          : item.format === "meaning"
            ? "meaning"
            : "translate";
      const value = (c) => (kind === "meaning" ? c.prompt : c.answer);
      const unique = new Set([value(card)]);
      const other = shuffleItems(
        cards.filter((c) => c.id !== card.id),
        random,
      ).filter((c) => {
        const text = value(c);
        if (unique.has(text)) return false;
        unique.add(text);
        return true;
      });
      const choices =
        kind === "write"
          ? []
          : shuffleItems(
              [
                card,
                ...other.slice(0, item.difficulty === "supported" ? 1 : 3),
              ].map((c) => ({ id: c.id, label: value(c) })),
              random,
            );
      return { ...card, ...item, format: kind, choices };
    })
    .reduce((questions, q) => (questions && q ? [...questions, q] : null), []);
}
export function randomQuizPlan(
  cards,
  attempts,
  level = "auto",
  random = Math.random,
) {
  return {
    source: "local-quiz",
    focusTitle: "A fresh practice round",
    sessionReason:
      "Five shuffled questions from your course. No AI call needed.",
    items: shuffleItems(cards, random)
      .slice(0, 5)
      .map((card, i) => {
        const { correct, incorrect } = recentCounts(card.id, attempts);
        const difficulty = quizDifficulty(level, correct, incorrect);
        return {
          conceptId: card.id,
          difficulty,
          format:
            difficulty === "challenge"
              ? "write"
              : difficulty === "standard" && i % 2 === 0
                ? "meaning"
                : "translate",
          question:
            difficulty === "challenge"
              ? "Write the course phrase that expresses this meaning."
              : "Choose the course phrase or meaning that matches.",
          hint: "Think of this phrase from your flashcards.",
          reason: "Shuffled from your selected unit.",
        };
      }),
  };
}
