import { Link } from 'react-router-dom';
import AppIcon from '../AppIcon.jsx';
import { isSpeechRecognitionSupported } from '../../lib/speechHelpers.js';

export default function ActivityPicker({
  unit,
  cards,
  completedCount,
  attemptCount,
  aiEnabled,
  onSelect,
}) {
  const microphoneSupported = isSpeechRecognitionSupported();
  const speechCardCount = cards.filter((card) => card.speech_practice_enabled).length;

  return (
    <section className="lesson-shell">
      <div className="lesson-topbar">
        <Link to="/dashboard" className="back-link">← Back to learning path</Link>
        <span>{unit.language?.name}</span>
      </div>

      <header className="activity-heading">
        <p className="eyebrow">{unit.title}</p>
        <h1>How do you want to practise?</h1>
        <p>{unit.description}</p>
        <div className="activity-heading__stats" aria-label="Unit progress">
          <span><strong>{cards.length}</strong> cards</span>
          <span><strong>{completedCount}</strong> learned</span>
        </div>
      </header>

      <div className="activity-grid">
        <button
          type="button"
          className="activity-card activity-card--smart"
          onClick={() => onSelect('review')}
        >
          <span className="activity-card__icon"><AppIcon name="spark" size={30} /></span>
          <span className="activity-card__body">
            <strong>Smart review</strong>
            <small>
              {attemptCount > 0
                ? `Focus on weak concepts using your last ${attemptCount} saved attempts.`
                : 'Start with unlearned concepts, then adapt as your attempt history grows.'}
            </small>
          </span>
          <AppIcon name="arrow" size={20} />
        </button>

        <button
          type="button"
          className="activity-card activity-card--ai"
          onClick={() => onSelect('ai')}
        >
          <span className="activity-card__icon"><AppIcon name="spark" size={30} /></span>
          <span className="activity-card__body">
            <strong>AI practice coach</strong>
            <small>
              {aiEnabled
                ? 'Generate a bounded five-card plan from your recent practice history.'
                : 'Optional and off by default. Review the privacy note in Settings to enable it.'}
            </small>
          </span>
          <AppIcon name="arrow" size={20} />
        </button>

        <button
          type="button"
          className="activity-card"
          onClick={() => onSelect('flashcards')}
        >
          <span className="activity-card__icon"><AppIcon name="cards" size={30} /></span>
          <span className="activity-card__body">
            <strong>Flashcards</strong>
            <small>Reveal each answer, shuffle the deck and review cards you missed.</small>
          </span>
          <AppIcon name="arrow" size={20} />
        </button>

        <button
          type="button"
          className="activity-card activity-card--purple"
          onClick={() => onSelect('quiz')}
        >
          <span className="activity-card__icon"><AppIcon name="quiz" size={30} /></span>
          <span className="activity-card__body">
            <strong>Quick quiz</strong>
            <small>Choose the correct translation and get immediate feedback.</small>
          </span>
          <AppIcon name="arrow" size={20} />
        </button>

        {speechCardCount > 0 && (
          <button
            type="button"
            className="activity-card activity-card--gold"
            onClick={() => onSelect('speak')}
          >
            <span className="activity-card__icon"><AppIcon name="mic" size={30} /></span>
            <span className="activity-card__body">
              <strong>Speak and repeat</strong>
              <small>
                {microphoneSupported
                  ? `Listen to five of ${speechCardCount} phrases, then compare the recognised words.`
                  : 'Listen and repeat in manual mode. Microphone matching is unavailable here.'}
              </small>
            </span>
            <AppIcon name="arrow" size={20} />
          </button>
        )}
      </div>
    </section>
  );
}
