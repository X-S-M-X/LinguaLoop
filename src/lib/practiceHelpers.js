export const ACTIVITIES = [
  {
    id: "flashcards",
    label: "Learn the words",
    detail: "Turn a card. Make it stick.",
    icon: "cards",
    colour: "blue",
  },
  {
    id: "quiz",
    label: "Check your knowledge",
    detail: "Pick the right translation.",
    icon: "quiz",
    colour: "mint",
  },
  {
    id: "speak",
    label: "Say it out loud",
    detail: "Listen, repeat and build confidence.",
    icon: "mic",
    colour: "peach",
  },
];

export function activityStats(attempts, type) {
  const rows = attempts.filter((a) => a.activity_type === type);
  return {
    total: rows.length,
    correct: rows.filter((a) => a.was_correct).length,
    accuracy: rows.length
      ? Math.round(
          (rows.filter((a) => a.was_correct).length / rows.length) * 100,
        )
      : null,
  };
}

export function weeklyPractice(attempts, now = new Date()) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - 6 + index);
    date.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setDate(date.getDate() + 1);
    const rows = attempts.filter(
      (a) => new Date(a.created_at) >= date && new Date(a.created_at) < end,
    );
    return {
      key: date.toISOString(),
      label: date.toLocaleDateString("en", { weekday: "short" }),
      total: rows.length,
      correct: rows.filter((a) => a.was_correct).length,
      today: index === 6,
    };
  });
}
