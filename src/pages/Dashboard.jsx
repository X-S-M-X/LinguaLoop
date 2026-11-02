import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useProfile } from "../context/ProfileContext.jsx";
import { useLearningOverview } from "../hooks/useLearningOverview.js";
import AppIcon from "../components/AppIcon.jsx";

const steps = [
  {
    id: "flashcards",
    label: "Learn",
    title: "Learn the words",
    description: "Flashcards",
    icon: "cards",
  },
  {
    id: "quiz",
    label: "Check",
    title: "Check your knowledge",
    description: "Quick quiz",
    icon: "quiz",
  },
  {
    id: "speak",
    label: "Speak",
    title: "Say it out loud",
    description: "Speak & repeat",
    icon: "mic",
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const {
    language,
    units,
    courseProgress,
    nextUnit,
    unitProgress,
    loading,
    error,
  } = useLearningOverview(user?.id, profile?.learning_language_id);
  if (profileLoading || loading)
    return <p className="page-loading">Loading your learning path…</p>;
  const current = nextUnit || units[0];
  return (
    <section className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Your learning path</p>
          <h1>Ready for another loop, {profile?.display_name || "Learner"}?</h1>
          <p>Continue your course or choose an activity below.</p>
        </div>
        <Link
          to="/courses"
          className="active-language-chip"
          aria-label="Switch learning language"
        >
          <span>{language?.code?.toUpperCase() || "+"}</span>
          <div>
            <small>Learning</small>
            <strong>{language?.name || "Choose a language"}</strong>
          </div>
          <AppIcon name="swap" size={17} />
        </Link>
      </header>
      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}
      {!current ? (
        <div className="empty-state">
          <h2>Choose a course to get started</h2>
          <p>Your learning path will appear here.</p>
          <Link to="/courses" className="button button--primary">
            Browse courses
          </Link>
        </div>
      ) : (
        <div className="dashboard-layout">
          <div className="learning-column">
            <section className="course-banner">
              <div>
                <p>{language?.name}</p>
                <h2>
                  {nextUnit
                    ? `Continue: ${current.title}`
                    : "Keep practising your course"}
                </h2>
                <span>Pick up with a short flashcard round.</span>
              </div>
              <Link
                to={`/lessons/${current.id}?activity=flashcards`}
                className="button button--light"
              >
                Continue
                <AppIcon name="arrow" size={18} />
              </Link>
            </section>
            <section
              className="learning-path learning-path--guided"
              aria-labelledby="learning-path-title"
            >
              <div className="section-heading section-heading--row">
                <div>
                  <p className="eyebrow">Current course</p>
                  <h2 id="learning-path-title">Learning path</h2>
                </div>
                <span className="path-total">
                  {units.length} {units.length === 1 ? "unit" : "units"}
                </span>
              </div>
              <ol className="guided-unit-list">
                {units.map((unit, i) => {
                  const progress = unitProgress(unit.id);
                  return (
                    <li className="guided-unit" key={unit.id}>
                      <header className="guided-unit__header">
                        <div>
                          <span>Unit {i + 1}</span>
                          <h3>{unit.title}</h3>
                          <p>{unit.description}</p>
                        </div>
                      </header>
                      <div
                        className="loop-path"
                        aria-label={`${unit.title} activities`}
                      >
                        <svg
                          className="loop-path__line"
                          viewBox="0 0 360 340"
                          preserveAspectRatio="none"
                          aria-hidden="true"
                        >
                          <path d="M100 52 C100 110 260 105 260 165 S140 225 140 278" />
                        </svg>
                        {steps.map((step, j) => (
                          <div
                            className={`loop-path__stop loop-path__stop--${j + 1}`}
                            key={step.id}
                          >
                            <Link
                              to={`/lessons/${unit.id}?activity=${step.id}`}
                              className={`path-activity-node loop-node loop-node--${step.id}`}
                              aria-label={step.title}
                            >
                              <AppIcon name={step.icon} size={28} />
                            </Link>
                            <strong>{step.label}</strong>
                            <span>{step.description}</span>
                          </div>
                        ))}
                      </div>
                      <footer className="guided-unit__footer">
                        <progress
                          className="progress-bar"
                          max="100"
                          value={progress.percent}
                          aria-label={`${unit.title}: ${progress.completed} of ${progress.total} learned`}
                        />
                        <div>
                          <span>
                            {progress.completed} of {progress.total} cards
                            learned
                          </span>
                          <Link
                            to={`/lessons/${unit.id}`}
                            className="button button--outline button--small"
                          >
                            All activities
                            <AppIcon name="arrow" size={15} />
                          </Link>
                        </div>
                      </footer>
                    </li>
                  );
                })}
              </ol>
            </section>
          </div>
          <aside className="dashboard-rail" aria-label="Learning summary">
            <section className="summary-card summary-card--goal">
              <span className="summary-card__icon">
                <AppIcon name="target" />
              </span>
              <div>
                <small>Daily goal</small>
                <strong>{profile?.daily_goal_minutes || 10} minutes</strong>
                <p>Your chosen practice target.</p>
              </div>
            </section>
            <section className="summary-card summary-card--quiet">
              <p className="eyebrow">Extra practice</p>
              <h3>Review or try a new quiz</h3>
              <p>
                Smart Review revisits tricky cards. AI Quiz creates questions
                around your course.
              </p>
              <Link
                to="/practice"
                className="button button--outline button--small"
              >
                Open Practice
                <AppIcon name="arrow" size={15} />
              </Link>
            </section>
            <Link to="/progress" className="dashboard-progress-link">
              <AppIcon name="progress" size={18} />
              {courseProgress.completedCards} cards learned · View progress
              <AppIcon name="arrow" size={14} />
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
}
