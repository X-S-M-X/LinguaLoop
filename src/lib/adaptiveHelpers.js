export function difficultyFromCounts(correct = 0, incorrect = 0) {
  const total = correct + incorrect;
  if (total < 3 || correct / total < 0.6) return "supported";
  if (total >= 5 && correct / total >= 0.8) return "challenge";
  return "standard";
}

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
