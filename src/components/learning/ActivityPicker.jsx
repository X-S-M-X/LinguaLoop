import { Link } from 'react-router-dom';
import AppIcon from '../AppIcon.jsx';

export default function ActivityPicker({ unit, cards, completedCount, onSelect }) {
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
      </div>
    </section>
  );
}
