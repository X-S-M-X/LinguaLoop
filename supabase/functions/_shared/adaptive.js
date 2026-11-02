// Shared by the Edge Function and browser. No user identifiers cross the AI boundary.
export function difficultyFromCounts(correct = 0, incorrect = 0) {
  const total = correct + incorrect;
  if (total < 3 || correct / total < 0.6) return "supported";
  if (total >= 5 && correct / total >= 0.8) return "challenge";
  return "standard";
}

export function anonymousCandidates(candidates) {
  return candidates.map((card, index) => ({
    card_ref: index + 1,
    prompt: card.prompt,
    answer: card.answer,
    romanization: card.romanization ?? null,
    correct_attempts: card.correct_attempts,
    incorrect_attempts: card.incorrect_attempts,
  }));
}

export function validateGeneratedPlan(plan, candidates, size, level = "auto") {
  const text = (value, max) =>
    typeof value === "string" && value.trim().length > 0 && value.length <= max;
  if (
    !plan ||
    !text(plan.focus_title, 80) ||
    !text(plan.session_reason, 180) ||
    !Array.isArray(plan.items) ||
    plan.items.length !== size
  )
    return null;
  const seen = new Set();
  const items = [];
  for (const item of plan.items) {
    if (
      !item ||
      !Number.isInteger(item.card_ref) ||
      seen.has(item.card_ref) ||
      item.card_ref < 1 ||
      item.card_ref > candidates.length ||
      !["translate", "meaning", "write"].includes(item.format) ||
      !text(item.question, 240) ||
      !text(item.reason, 140) ||
      !text(item.hint, 140)
    )
      return null;
    seen.add(item.card_ref);
    const card = candidates[item.card_ref - 1];
    const difficulty =
      { easy: "supported", medium: "standard", hard: "challenge" }[level] ||
      difficultyFromCounts(card.correct_attempts, card.incorrect_attempts);
    if (
      (difficulty === "challenge" && item.format !== "write") ||
      (difficulty === "supported" && item.format !== "translate") ||
      (difficulty === "standard" && item.format === "write")
    )
      return null;
    items.push({
      conceptId: card.concept_id,
      question: item.question.trim(),
      format: item.format,
      reason: item.reason.trim(),
      hint: item.hint.trim(),
      difficulty,
    });
  }
  return {
    focusTitle: plan.focus_title.trim(),
    sessionReason: plan.session_reason.trim(),
    items,
  };
}
