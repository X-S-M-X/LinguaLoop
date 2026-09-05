export function buildLessonCards({
  concepts = [],
  translations = [],
  sourceLanguageId,
  targetLanguageId,
} = {}) {
  if (!sourceLanguageId || !targetLanguageId) return [];

  const translationMap = new Map(
    translations.map((translation) => [
      `${translation.concept_id}:${translation.language_id}`,
      translation,
    ])
  );

  return concepts.flatMap((concept) => {
    const source = translationMap.get(`${concept.id}:${sourceLanguageId}`);
    const target = translationMap.get(`${concept.id}:${targetLanguageId}`);

    if (!source?.term || !target?.term) return [];

    return [{
      ...concept,
      prompt: source.term,
      answer: target.term,
      romanization: target.romanization || null,
    }];
  });
}

export function shuffleItems(items = [], random = Math.random) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomValue = Math.min(Math.max(random(), 0), 0.9999999999999999);
    const swapIndex = Math.floor(randomValue * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function buildQuizQuestions(
  cards = [],
  { choiceCount = 4, random = Math.random } = {}
) {
  const safeChoiceCount = Math.max(2, choiceCount);

  return shuffleItems(cards, random).map((card) => {
    const seenAnswers = new Set([card.answer]);
    const distractors = [];

    for (const candidate of shuffleItems(cards, random)) {
      if (
        candidate.id === card.id
        || !candidate.answer
        || seenAnswers.has(candidate.answer)
      ) {
        continue;
      }

      distractors.push({ id: candidate.id, label: candidate.answer });
      seenAnswers.add(candidate.answer);

      if (distractors.length >= safeChoiceCount - 1) break;
    }

    return {
      ...card,
      choices: shuffleItems(
        [{ id: card.id, label: card.answer }, ...distractors],
        random
      ),
    };
  });
}

export function getSessionPercent(currentIndex, total, finished = false) {
  if (total <= 0) return 0;
  if (finished) return 100;
  return Math.round((currentIndex / total) * 100);
}

export function getFlashcardPool(cards = [], completedIds = new Set(), filter = 'all') {
  if (filter === 'unlearned') {
    return cards.filter((card) => !completedIds.has(card.id));
  }

  if (filter === 'learned') {
    return cards.filter((card) => completedIds.has(card.id));
  }

  return [...cards];
}

export function buildFlashcardSession(
  cards = [],
  {
    completedIds = new Set(),
    filter = 'all',
    size = 'all',
    random = Math.random,
  } = {}
) {
  const pool = shuffleItems(getFlashcardPool(cards, completedIds, filter), random);
  const requestedSize = Number(size);

  if (!Number.isFinite(requestedSize) || requestedSize <= 0) return pool;
  return pool.slice(0, requestedSize);
}

export function buildSmartReviewSession(
  cards = [],
  attempts = [],
  completedIds = new Set(),
  size = 5
) {
  const stats = new Map();

  for (const attempt of attempts) {
    const current = stats.get(attempt.concept_id) ?? {
      correct: 0,
      incorrect: 0,
      lastAttemptAt: '',
    };

    if (attempt.was_correct) current.correct += 1;
    else current.incorrect += 1;

    if (attempt.created_at > current.lastAttemptAt) {
      current.lastAttemptAt = attempt.created_at;
    }
    stats.set(attempt.concept_id, current);
  }

  return [...cards]
    .map((card) => {
      const cardStats = stats.get(card.id) ?? { correct: 0, incorrect: 0, lastAttemptAt: '' };
      const priority = (cardStats.incorrect * 4)
        - cardStats.correct
        + (completedIds.has(card.id) ? 0 : 2)
        + (Number(card.difficulty) || 1) / 10;

      return { card, priority, lastAttemptAt: cardStats.lastAttemptAt };
    })
    .sort((left, right) => (
      right.priority - left.priority
      || left.lastAttemptAt.localeCompare(right.lastAttemptAt)
      || left.card.sort_order - right.card.sort_order
    ))
    .slice(0, Math.min(Math.max(Number(size) || 5, 1), cards.length))
    .map(({ card }) => card);
}
