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
