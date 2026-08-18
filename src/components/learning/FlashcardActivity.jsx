import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import AppIcon from '../AppIcon.jsx';
import { getSessionPercent, shuffleItems } from '../../lib/lessonHelpers.js';

export default function FlashcardActivity({
  unit,
  cards,
  completedIds,
  onCompleteConcept,
  onChangeActivity,
  showRomanization,
}) {
  const [sessionCards, setSessionCards] = useState(cards);
  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [knownThisSession, setKnownThisSession] = useState(new Set());
  const [missedIds, setMissedIds] = useState(new Set());

  const currentCard = sessionCards[cardIndex];
  const cardWasKnown = useMemo(
    () => Boolean(currentCard && completedIds.has(currentCard.id)),
    [completedIds, currentCard]
  );
  const sessionPercent = getSessionPercent(cardIndex, sessionCards.length, finished);

  function resetSession(nextCards) {
    setSessionCards(nextCards);
    setCardIndex(0);
    setRevealed(false);
    setFinished(false);
    setError(null);
    setKnownThisSession(new Set());
    setMissedIds(new Set());
  }

  function advance() {
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

  function markNotYet() {
    if (!currentCard || saving) return;
    setMissedIds((current) => new Set(current).add(currentCard.id));
    advance();
  }

  function reviewMissed() {
    const missedCards = cards.filter((card) => missedIds.has(card.id));
    resetSession(missedCards);
  }

  if (finished) {
    return (
      <section className="lesson-shell lesson-complete">
        <span className="lesson-complete__icon"><AppIcon name="check" size={44} /></span>
        <p className="eyebrow">Flashcards complete</p>
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
          <button
            type="button"
            className="button button--secondary"
            onClick={() => resetSession(cards)}
          >
            Restart all
          </button>
          <button type="button" className="button button--primary" onClick={onChangeActivity}>
            Choose activity <AppIcon name="arrow" size={18} />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="lesson-shell">
      <div className="lesson-topbar lesson-topbar--actions">
        <button type="button" className="back-link back-link--button" onClick={onChangeActivity}>
          ← Activities
        </button>
        <div>
          <button
            type="button"
            className="lesson-tool"
            onClick={() => resetSession(shuffleItems(sessionCards))}
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
        <p className="eyebrow">Flashcards · {unit.title}</p>
        <h1>{revealed ? 'Here is the answer' : 'What does this mean?'}</h1>
      </header>

      <article className={`flashcard${revealed ? ' flashcard--revealed' : ''}`}>
        <span className="flashcard__label">
          {revealed ? unit.language?.name : unit.sourceLanguage?.name || 'English'}
        </span>
        <strong
          className="flashcard__term"
          lang={revealed ? unit.language?.code : unit.sourceLanguage?.code}
        >
          {revealed ? currentCard.answer : currentCard.prompt}
        </strong>
        {revealed && showRomanization && currentCard.romanization && (
          <span className="flashcard__romanization">{currentCard.romanization}</span>
        )}
        {cardWasKnown && (
          <span className="known-badge"><AppIcon name="check" size={15} /> Previously learned</span>
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
            Review again
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={markKnown}
            disabled={saving}
          >
            {saving ? 'Saving…' : cardWasKnown ? 'Continue' : 'Got it'}
            {!saving && <AppIcon name="check" size={18} />}
          </button>
        </div>
      )}
      <p className="lesson-help" aria-live="polite">
        “Got it” saves the concept once. “Review again” adds it to your missed-card review.
      </p>
    </section>
  );
}
