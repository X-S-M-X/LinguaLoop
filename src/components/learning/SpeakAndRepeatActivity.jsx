import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import AppIcon from '../AppIcon.jsx';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition.js';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis.js';
import { getSessionPercent, shuffleItems } from '../../lib/lessonHelpers.js';
import { getSpeechMatch } from '../../lib/speechHelpers.js';

const SESSION_SIZE = 5;

export default function SpeakAndRepeatActivity({
  unit,
  cards,
  completedIds,
  onCompleteConcept,
  onRecordAttempt,
  onChangeActivity,
  autoplayTts,
  speechRate,
  showRomanization,
}) {
  const [sessionCards, setSessionCards] = useState(() => (
    shuffleItems(cards).slice(0, Math.min(SESSION_SIZE, cards.length))
  ));
  const [cardIndex, setCardIndex] = useState(0);
  const [match, setMatch] = useState(null);
  const [matchedIds, setMatchedIds] = useState(new Set());
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const synthesis = useSpeechSynthesis();
  const recognition = useSpeechRecognition();

  const currentCard = sessionCards[cardIndex];
  const locale = unit.language?.speech_locale || unit.language?.code || 'en-US';
  const sessionPercent = getSessionPercent(cardIndex, sessionCards.length, finished);
  const resultCopy = useMemo(() => {
    if (!match) return null;
    if (match.status === 'matched') {
      return { title: 'Matched!', body: 'The browser heard the expected phrase.' };
    }
    if (match.status === 'almost') {
      return { title: 'Almost there', body: 'That was close. Listen once more and try again.' };
    }
    return { title: 'Try again', body: 'The recognised words did not match this phrase yet.' };
  }, [match]);

  function playCurrentPhrase() {
    recognition.stopListening();
    synthesis.speak(currentCard.answer, { locale, rate: speechRate });
  }

  async function handleTranscript(nextTranscript) {
    const nextMatch = getSpeechMatch(currentCard.answer, nextTranscript, locale);
    setMatch(nextMatch);

    try {
      await onRecordAttempt({
        conceptId: currentCard.id,
        activityType: 'speech',
        wasCorrect: nextMatch.status === 'matched',
        score: nextMatch.score,
      });
    } catch (attemptError) {
      console.warn('Speaking practice continued, but the attempt history was not saved:', attemptError);
    }

    if (nextMatch.status !== 'matched') return;

    setMatchedIds((current) => new Set(current).add(currentCard.id));
    if (completedIds.has(currentCard.id)) return;

    setSaving(true);
    setSaveError(null);
    try {
      await onCompleteConcept(currentCard.id, nextMatch.score);
    } catch (error) {
      setSaveError(error.message || 'The phrase matched, but progress could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  function startMicrophone() {
    synthesis.stop();
    setMatch(null);
    setSaveError(null);
    recognition.clearResult();
    recognition.startListening(locale, handleTranscript);
  }

  function retryPhrase() {
    setMatch(null);
    setSaveError(null);
    recognition.clearResult();
  }

  function continueSession() {
    if (saving) return;
    if (cardIndex >= sessionCards.length - 1) {
      setFinished(true);
      return;
    }

    setCardIndex((index) => index + 1);
    retryPhrase();
  }

  function restartSession() {
    synthesis.stop();
    recognition.stopListening();
    setSessionCards(shuffleItems(cards).slice(0, Math.min(SESSION_SIZE, cards.length)));
    setCardIndex(0);
    setMatch(null);
    setMatchedIds(new Set());
    setFinished(false);
    setSaving(false);
    setSaveError(null);
    recognition.clearResult();
  }

  useEffect(() => {
    if (autoplayTts && currentCard && synthesis.supported && !finished) {
      synthesis.speak(currentCard.answer, { locale, rate: speechRate });
    }
  }, [autoplayTts, cardIndex, currentCard, finished, locale, speechRate, synthesis.speak, synthesis.supported]);

  if (finished) {
    return (
      <section className="lesson-shell lesson-complete speak-complete">
        <span className="lesson-complete__icon lesson-complete__icon--purple">
          <AppIcon name="mic" size={42} />
        </span>
        <p className="eyebrow">Speaking practice complete</p>
        <h1>You finished this round.</h1>
        <p>
          The browser matched <strong>{matchedIds.size} of {sessionCards.length}</strong> phrases.
          This is a transcript match, not a full pronunciation score.
        </p>
        <div className="lesson-complete__actions">
          <button type="button" className="button button--secondary" onClick={restartSession}>
            Practise 5 more
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
        <Link to="/dashboard" className="lesson-tool">Leave unit</Link>
      </div>

      <div className="lesson-progress-row">
        <progress
          className="progress-bar progress-bar--large progress-bar--purple"
          max="100"
          value={sessionPercent}
          aria-label={`Phrase ${cardIndex + 1} of ${sessionCards.length}`}
        />
        <strong>{cardIndex + 1}/{sessionCards.length}</strong>
      </div>

      <header className="lesson-heading">
        <p className="eyebrow">Speak and repeat · {unit.title}</p>
        <h1>Listen, then repeat the phrase</h1>
      </header>

      <article className="speak-card">
        <span>{unit.sourceLanguage?.name || 'English'}</span>
        <p>{currentCard.prompt}</p>
        <strong lang={unit.language?.code}>{currentCard.answer}</strong>
        {showRomanization && currentCard.romanization && (
          <small>{currentCard.romanization}</small>
        )}
        <button
          type="button"
          className="button button--secondary speak-listen-button"
          onClick={playCurrentPhrase}
          disabled={!synthesis.supported || synthesis.speaking}
        >
          <AppIcon name="speaker" size={19} />
          {synthesis.speaking ? 'Speaking…' : 'Listen'}
        </button>
      </article>

      {!synthesis.supported && (
        <div className="notice notice--error" role="alert">
          <strong>Text to speech is unavailable</strong>
          <span>Try the latest Chrome, Edge or Safari browser for this activity.</span>
        </div>
      )}

      {recognition.supported ? (
        <div className="speech-controls">
          {!match && (
            <button
              type="button"
              className={`button button--primary microphone-button${recognition.listening ? ' microphone-button--listening' : ''}`}
              onClick={startMicrophone}
              disabled={recognition.listening || synthesis.speaking}
            >
              <AppIcon name="mic" size={20} />
              {recognition.listening ? 'Listening…' : 'Start microphone'}
            </button>
          )}

          {recognition.error && (
            <p className="form__error" role="alert">{recognition.error}</p>
          )}

          {recognition.transcript && (
            <div className="speech-transcript" aria-live="polite">
              <span>The browser heard</span>
              <strong>{recognition.transcript}</strong>
            </div>
          )}

          {match && resultCopy && (
            <div className={`speech-result speech-result--${match.status}`} aria-live="polite">
              <div>
                <strong>{resultCopy.title}</strong>
                <span>{resultCopy.body}</span>
                {saveError && <span className="quiz-feedback__error">{saveError}</span>}
              </div>
              <div className="speech-result__actions">
                {match.status !== 'matched' && (
                  <button type="button" className="button button--secondary" onClick={retryPhrase}>
                    Try again
                  </button>
                )}
                {saveError && (
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => handleTranscript(recognition.transcript)}
                    disabled={saving}
                  >
                    Retry save
                  </button>
                )}
                <button
                  type="button"
                  className="button button--primary"
                  onClick={continueSession}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Continue'}
                  {!saving && <AppIcon name="arrow" size={18} />}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="speech-fallback">
          <strong>Listen-only mode</strong>
          <p>
            This browser cannot compare microphone speech. Listen, repeat the phrase aloud,
            then continue without a saved speech score.
          </p>
          <button type="button" className="button button--primary" onClick={continueSession}>
            I repeated it <AppIcon name="arrow" size={18} />
          </button>
        </div>
      )}

      <p className="lesson-help">
        Your browser or its speech service processes recognition. LinguaLoop does not upload or store microphone audio.
      </p>
    </section>
  );
}
