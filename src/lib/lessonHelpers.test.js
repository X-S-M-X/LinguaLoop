import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSmartReviewSession,
  buildFlashcardSession,
  buildLessonCards,
  buildQuizQuestions,
  getFlashcardPool,
  getSessionPercent,
  shuffleItems,
} from './lessonHelpers.js';

const cards = [
  { id: 'a', answer: 'Hola', prompt: 'Hello' },
  { id: 'b', answer: 'Gracias', prompt: 'Thank you' },
  { id: 'c', answer: 'Adiós', prompt: 'Goodbye' },
  { id: 'd', answer: 'Por favor', prompt: 'Please' },
  { id: 'e', answer: 'Buenos días', prompt: 'Good morning' },
];

test('buildLessonCards joins source and target translations without language-specific code', () => {
  const result = buildLessonCards({
    concepts: [{ id: 'concept-1', slug: 'hello', sort_order: 0 }],
    translations: [
      { concept_id: 'concept-1', language_id: 'en', term: 'Hello' },
      { concept_id: 'concept-1', language_id: 'es', term: 'Hola' },
    ],
    sourceLanguageId: 'en',
    targetLanguageId: 'es',
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].prompt, 'Hello');
  assert.equal(result[0].answer, 'Hola');
});

test('buildLessonCards leaves out concepts with missing translations', () => {
  const result = buildLessonCards({
    concepts: [{ id: 'concept-1' }],
    translations: [
      { concept_id: 'concept-1', language_id: 'en', term: 'Hello' },
    ],
    sourceLanguageId: 'en',
    targetLanguageId: 'es',
  });

  assert.deepEqual(result, []);
});

test('shuffleItems returns a new array and keeps every item', () => {
  const original = ['a', 'b', 'c', 'd'];
  const shuffled = shuffleItems(original, () => 0);

  assert.notEqual(shuffled, original);
  assert.deepEqual([...shuffled].sort(), original);
});

test('buildQuizQuestions creates unique choices containing the correct answer', () => {
  const questions = buildQuizQuestions(cards, { random: () => 0.42 });

  assert.equal(questions.length, cards.length);
  for (const question of questions) {
    assert.equal(question.choices.length, 4);
    assert.equal(new Set(question.choices.map((choice) => choice.label)).size, 4);
    assert.ok(question.choices.some((choice) => choice.id === question.id));
  }
});

test('getSessionPercent reports progress before and after completion', () => {
  assert.equal(getSessionPercent(0, 10), 0);
  assert.equal(getSessionPercent(4, 10), 40);
  assert.equal(getSessionPercent(9, 10, true), 100);
  assert.equal(getSessionPercent(0, 0), 0);
});

test('getFlashcardPool separates learned and unlearned cards', () => {
  const testCards = [{ id: 'one' }, { id: 'two' }, { id: 'three' }];
  const completedIds = new Set(['two']);

  assert.deepEqual(getFlashcardPool(testCards, completedIds, 'learned'), [{ id: 'two' }]);
  assert.deepEqual(
    getFlashcardPool(testCards, completedIds, 'unlearned'),
    [{ id: 'one' }, { id: 'three' }]
  );
});

test('buildFlashcardSession respects the requested session size', () => {
  const testCards = Array.from({ length: 15 }, (_, index) => ({ id: String(index + 1) }));
  const session = buildFlashcardSession(testCards, { size: 5, random: () => 0.5 });

  assert.equal(session.length, 5);
  assert.equal(new Set(session.map((card) => card.id)).size, 5);
});

test('buildSmartReviewSession prioritises repeated mistakes and unlearned cards', () => {
  const reviewCards = cards.map((card, index) => ({
    ...card,
    difficulty: 1,
    sort_order: index,
  }));
  const attempts = [
    { concept_id: 'c', was_correct: false, created_at: '2026-08-24T10:00:00Z' },
    { concept_id: 'c', was_correct: false, created_at: '2026-08-25T10:00:00Z' },
    { concept_id: 'a', was_correct: true, created_at: '2026-08-25T09:00:00Z' },
  ];

  const result = buildSmartReviewSession(
    reviewCards,
    attempts,
    new Set(['a', 'b', 'c', 'd', 'e']),
    3
  );

  assert.equal(result.length, 3);
  assert.equal(result[0].id, 'c');
  assert.equal(new Set(result.map((card) => card.id)).size, 3);
});
