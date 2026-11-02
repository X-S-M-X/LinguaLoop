import { Link } from "react-router-dom";
import AppIcon from "../AppIcon.jsx";
import { ACTIVITIES } from "../../lib/practiceHelpers.js";
export default function ActivityPicker({
  unit,
  cards,
  completedCount,
  onSelect,
}) {
  return (
    <section className="lesson-shell activity-picker">
      <div className="lesson-topbar">
        <Link to="/dashboard" className="back-link">
          ← Your learning path
        </Link>
        <span className="quiet-badge">{unit.language?.name}</span>
      </div>
      <header className="activity-heading">
        <p className="eyebrow">YOUR NEXT LITTLE LOOP</p>
        <h1>{unit.title}</h1>
        <p>{unit.description}</p>
        <div className="unit-mini-progress">
          <progress
            className="progress-bar"
            max={cards.length}
            value={completedCount}
            aria-label={`${completedCount} of ${cards.length} learned`}
          />
          <span>
            {completedCount} / {cards.length} learned
          </span>
        </div>
      </header>
      <div className="activity-list">
        {ACTIVITIES.filter(
          (a) =>
            a.id !== "speak" || cards.some((c) => c.speech_practice_enabled),
        ).map((a, i) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onSelect(a.id)}
            className="activity-row"
          >
            <span className={`icon-bubble tone-${a.colour}`}>
              <AppIcon name={a.icon} size={26} />
            </span>
            <span>
              <small>STEP {i + 1}</small>
              <strong>{a.label}</strong>
              <span>{a.detail}</span>
            </span>
            <AppIcon name="arrow" size={20} />
          </button>
        ))}
      </div>
      <div className="activity-practice-link">
        <AppIcon name="target" />
        <p>Want to revisit mistakes or try an AI Quiz?</p>
        <Link to="/practice" className="text-link">
          Open Practice
          <AppIcon name="arrow" size={16} />
        </Link>
      </div>
    </section>
  );
}
