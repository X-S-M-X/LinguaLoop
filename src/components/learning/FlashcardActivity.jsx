import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import AppIcon from '../AppIcon.jsx';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis.js';
import {
  buildFlashcardSession,
  buildSmartReviewSession,
  getFlashcardPool,
  getSessionPercent,
  shuffleItems,
} from '../../lib/lessonHelpers.js';

const FILTERS = [
  { value: 'all', label: 'All cards' },
  { value: 'unlearned', label: 'Not learned' },
  { value: 'learned', label: 'Learned' },
];

const DIRECTIONS = [
  { value: 'source-target', label: 'English first' },
  { value: 'target-source', label: 'Learning language first' },
];

export default function FlashcardActivity({
  unit,
  cards,
  completedIds,
  onCompleteConcept,
  onRecordAttempt,
  onChangeActivity,
  showRomanization,
  autoplayTts,
  speechRate,
  attempts = [],
  smartReview = false,
  presetCards = null,
  coachTitle = '',
  coachHints = {},
}) {
  const hasPresetSession = Array.isArray(presetCards) && presetCards.length > 0;
  const [filter, setFilter] = useState('all');
  const [sessionSize, setSessionSize] = useState('all');
  const [direction, setDirection] = useState('source-target');
  const [sessionCards, setSessionCards] = useState(() => (
    hasPresetSession
      ? presetCards
      : smartReview
        ? buildSmartReviewSession(cards, attempts, completedIds, 5)
        : []
  ));
  const [started, setStarted] = useState(smartReview || hasPresetSession);
  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [knownThisSession, setKnownThisSession] = useState(new Set());
  const [missedIds, setMissedIds] = useState(new Set());
  const synthesis = useSpeechSynthesis();

  const availableCards = useMemo(
    () => getFlashcardPool(cards, completedIds, filter),
    [cards, completedIds, filter]
  );
  const currentCard = sessionCards[cardIndex];
  const cardWasKnown = useMemo(
    () => Boolean(currentCard && completedIds.has(currentCard.id)),
    [completedIds, currentCard]
  );
  const sessionPercent = getSessionPercent(cardIndex, sessionCards.length, finished);
  const targetFirst = direction === 'target-source';
  const targetIsVisible = Boolean(
    currentCard && ((targetFirst && !revealed) || (!targetFirst && revealed))
  );
  const locale = unit.language?.speech_locale || unit.language?.code || 'en-US';
  const sizeOptions = [5, 10].filter((size) => size < availableCards.length);

  function resetRound(nextCards) {
    synthesis.stop();
    setSessionCards(nextCards);
    setCardIndex(0);
    setRevealed(false);
    setFinished(false);
    setError(null);
    setKnownThisSession(new Set());
    setMissedIds(new Set());
  }

  function startSession() {
    const nextCards = hasPresetSession
      ? presetCards
      : smartReview
        ? buildSmartReviewSession(cards, attempts, completedIds, 5)
        : buildFlashcardSession(cards, {
          completedIds,
          filter,
          size: sessionSize,
        });

    if (nextCards.length === 0) return;
    resetRound(nextCards);
    setStarted(true);
  }

  function advance() {
    synthesis.stop();
    if (cardIndex >= sessionCards.length - 1) {
      setFinished(true);
      return;
    }

    setCardIndex((index) => index + 1);
    setRevealed(false);
  }

  async function markKnown() {
    if (!currentCard || saving) return;

    setSaving(true);
    setError(null);

    try {
      if (!completedIds.has(currentCard.id)) {
        await onCompleteConcept(currentCard.id, 100);
      }

      try {
        await onRecordAttempt({
          conceptId: currentCard.id,
          activityType: hasPresetSession ? 'ai_review' : smartReview ? 'smart_review' : 'flashcard',
          wasCorrect: true,
          score: 100,
        });
      } catch (attemptError) {
        console.warn('Progress was saved, but the attempt history was not:', attemptError);
      }

      setKnownThisSession((current) => new Set(current).add(currentCard.id));
      setMissedIds((current) => {
        const next = new Set(current);
        next.delete(currentCard.id);
        return next;
      });
      advance();
    } catch (saveError) {
      setError(saveError.message || 'We could not save that card. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function markNotYet() {
    if (!currentCard || saving) return;
    setMissedIds((current) => new Set(current).add(currentCard.id));
    try {
      await onRecordAttempt({
        conceptId: currentCard.id,
        activityType: hasPresetSession ? 'ai_review' : smartReview ? 'smart_review' : 'flashcard',
        wasCorrect: false,
        score: 0,
      });
    } catch (attemptError) {
      console.warn('The review continued, but the attempt history was not saved:', attemptError);
    }
    advance();
  }

  function reviewMissed() {
    const missedCards = cards.filter((card) => missedIds.has(card.id));
    resetRound(shuffleItems(missedCards));
  }

  function playTarget() {
    if (!currentCard) return;
    synthesis.speak(currentCard.answer, { locale, rate: speechRate });
  }

  function returnToSetup() {
    synthesis.stop();
    if (smartReview || hasPresetSession) {
      onChangeActivity();
      return;
    }
    setStarted(false);
  }

  useEffect(() => {
    if (started && !finished && autoplayTts && targetIsVisible) {
      synthesis.speak(currentCard.answer, { locale, rate: speechRate });
    }
  }, [autoplayTts, cardIndex, currentCard, finished, locale, revealed, speechRate, started, synthesis.speak, targetIsVisible]);

  if (!started) {
    return (
      <section className="lesson-shell">
        <div className="lesson-topbar">
          <button type="button" className="back-link back-link--button" onClick={onChangeActivity}>
            ← Activities
          </button>
          <span>{cards.length} cards available</span>
        </div>

        <header className="lesson-heading flashcard-setup-heading">
          <p className="eyebrow">Flashcard setup · {unit.title}</p>
          <h1>Build your review round</h1>
          <p>Choose which cards to practise, how many to use and which side appears first.</p>
        </header>

        <div className="flashcard-setup-grid">
          <fieldset className="choice-panel">
            <legend>Cards</legend>
            <div className="segmented-options">
              {FILTERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={filter === option.value ? 'is-selected' : ''}
                  onClick={() => {
                    setFilter(option.value);
                    setSessionSize('all');
                  }}
                  aria-pressed={filter === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <small>{availableCards.length} cards match this selection.</small>
          </fieldset>

          <fieldset className="choice-panel">
            <legend>Round size</legend>
            <div className="segmented-options">
              {sizeOptions.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={String(sessionSize) === String(size) ? 'is-selected' : ''}
                  onClick={() => setSessionSize(String(size))}
                  aria-pressed={String(sessionSize) === String(size)}
                >
                  {size}
                </button>
              ))}
              <button
                type="button"
                className={sessionSize === 'all' ? 'is-selected' : ''}
                onClick={() => setSessionSize('all')}
                aria-pressed={sessionSize === 'all'}
              >
                All {availableCards.length}
              </button>
            </div>
          </fieldset>

          <fieldset className="choice-panel choice-panel--wide">
            <legend>Direction</legend>
            <div className="segmented-options">
              {DIRECTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={direction === option.value ? 'is-selected' : ''}
                  onClick={() => setDirection(option.value)}
                  aria-pressed={direction === option.value}
                >
                  <AppIcon name="swap" size={17} /> {option.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        {availableCards.length === 0 && (
          <div className="notice">
            <strong>No cards match yet</strong>
            <span>Choose All cards, or learn some cards before selecting Learned.</span>
          </div>
        )}

        <button
          type="button"
          className="button button--primary lesson-reveal"
          onClick={startSession}
          disabled={availableCards.length === 0}
        >
          Start flashcards <AppIcon name="arrow" size={18} />
        </button>
      </section>
    );
  }

  if (finished) {
    return (
      <section className="lesson-shell lesson-complete">
        <span className="lesson-complete__icon"><AppIcon name="check" size={44} /></span>
        <p className="eyebrow">
          {hasPresetSession ? 'AI practice complete' : smartReview ? 'Smart review complete' : 'Flashcards complete'}
        </p>
        <h1>You finished this review.</h1>
        <p>
          You understood <strong>{knownThisSession.size} of {sessionCards.length}</strong> cards
          this round. Your account now has <strong>{completedIds.size} of {cards.length}</strong>{' '}
          cards learned in this unit.
        </p>
        <progress
          className="progress-bar progress-bar--large"
          max="100"
          value={Math.round((completedIds.size / cards.length) * 100)}
          aria-label={`${completedIds.size} of ${cards.length} cards learned`}
        />
        <div className="lesson-complete__actions">
          {missedIds.size > 0 && (
            <button type="button" className="button button--secondary" onClick={reviewMissed}>
              Review {missedIds.size} missed
            </button>
          )}
          <button type="button" className="button button--secondary" onClick={startSession}>
            {hasPresetSession ? 'Repeat plan' : smartReview ? 'Refresh review' : 'New round'}
          </button>
          <button type="button" className="button button--primary" onClick={onChangeActivity}>
            Choose activity <AppIcon name="arrow" size={18} />
          </button>
        </div>
      </section>
    );
  }

  const frontText = targetFirst ? currentCard.answer : currentCard.prompt;
  const backText = targetFirst ? currentCard.prompt : currentCard.answer;
  const frontLanguage = targetFirst ? unit.language : unit.sourceLanguage;
  const backLanguage = targetFirst ? unit.sourceLanguage : unit.language;

  return (
    <section className="lesson-shell">
      <div className="lesson-topbar lesson-topbar--actions">
        <button type="button" className="back-link back-link--button" onClick={returnToSetup}>
          {smartReview || hasPresetSession ? '← Activities' : '← Flashcard setup'}
        </button>
        <div>
          <button
            type="button"
            className="lesson-tool"
            onClick={() => resetRound(shuffleItems(sessionCards))}
            disabled={saving}
          >
            <AppIcon name="shuffle" size={17} /> Shuffle and restart
          </button>
          <Link to="/dashboard" className="lesson-tool">Leave unit</Link>
        </div>
      </div>

      <div className="lesson-progress-row">
        <progress
          className="progress-bar progress-bar--large"
          max="100"
          value={sessionPercent}
          aria-label={`Card ${cardIndex + 1} of ${sessionCards.length}`}
        />
        <strong>{cardIndex + 1}/{sessionCards.length}</strong>
      </div>

      <header className="lesson-heading">
        <p className="eyebrow">
          {hasPresetSession ? 'AI coach' : smartReview ? 'Smart review' : 'Flashcards'} · {unit.title}
        </p>
        {hasPresetSession && coachTitle && <span className="ai-coach-focus">{coachTitle}</span>}
        <h1>{revealed ? 'Here is the answer' : 'What does this mean?'}</h1>
      </header>

      <article className={`flashcard${revealed ? ' flashcard--revealed' : ''}`}>
        <span className="flashcard__label">
          {revealed ? backLanguage?.name : frontLanguage?.name}
        </span>
        <strong
          className="flashcard__term"
          lang={(revealed ? backLanguage : frontLanguage)?.code}
        >
          {revealed ? backText : frontText}
        </strong>
        {targetIsVisible && showRomanization && currentCard.romanization && (
          <span className="flashcard__romanization">{currentCard.romanization}</span>
        )}
        {cardWasKnown && (
          <span className="known-badge"><AppIcon name="check" size={15} /> Previously learned</span>
        )}
        {hasPresetSession && revealed && coachHints[currentCard.id] && (
          <span className="ai-card-hint">
            <AppIcon name="spark" size={16} /> Coach hint: {coachHints[currentCard.id]}
          </span>
        )}
        {targetIsVisible && (
          <button
            type="button"
            className="flashcard-listen"
            onClick={playTarget}
            disabled={!synthesis.supported || synthesis.speaking}
          >
            <AppIcon name="speaker" size={18} />
            {synthesis.speaking ? 'Speaking…' : 'Listen'}
          </button>
        )}
      </article>

      {error && <p className="form__error lesson-save-error" role="alert">{error}</p>}

      {!revealed ? (
        <button
          type="button"
          className="button button--primary lesson-reveal"
          onClick={() => setRevealed(true)}
        >
          Reveal answer
        </button>
      ) : (
        <div className="lesson-actions" aria-label="Rate this flashcard">
          <button
            type="button"
            className="button button--secondary"
            onClick={markNotYet}
            disabled={saving}
          >
            Need practice
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={markKnown}
            disabled={saving}
          >
            {saving ? 'Saving…' : cardWasKnown ? 'Continue' : 'Know it'}
            {!saving && <AppIcon name="check" size={18} />}
          </button>
        </div>
      )}
      <p className="lesson-help" aria-live="polite">
        {hasPresetSession
          ? 'AI chose the order. LinguaLoop still checks answers and saves completion normally.'
          : smartReview
          ? 'This round is ordered from your saved mistakes and unlearned concepts.'
          : '“Know it” saves the concept once. “Need practice” adds it to the review round.'}
      </p>
    </section>
  );
}
