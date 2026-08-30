import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useProfile } from '../context/ProfileContext.jsx';
import { useLearningOverview } from '../hooks/useLearningOverview.js';
import AppIcon from '../components/AppIcon.jsx';

const PATH_ACTIVITIES = [
  {
    id: 'flashcards',
    label: 'Learn',
    title: 'Build the words',
    icon: 'cards',
    threshold: 34,
  },
  {
    id: 'quiz',
    label: 'Check',
    title: 'Quick quiz',
    icon: 'quiz',
    threshold: 67,
  },
  {
    id: 'speak',
    label: 'Speak',
    title: 'Say it aloud',
    icon: 'mic',
    threshold: 100,
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

  if (profileLoading || loading) {
    return <p className="page-loading">Building your learning path…</p>;
  }

  const learnerName = profile?.display_name || profile?.username || 'Learner';
  const languageCode = language?.code?.toUpperCase() || 'N/A';

  return (
    <section className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Your learning path</p>
          <h1>Ready for another loop, {learnerName}?</h1>
          <p>Small steps count. Pick up from your next unfinished unit.</p>
        </div>
        <div className="active-language-chip">
          <span>{languageCode}</span>
          <div><small>Learning</small><strong>{language?.name || 'Choose a language'}</strong></div>
        </div>
      </header>

      {error && (
        <div className="notice notice--error" role="alert">
          <strong>We couldn’t load your path.</strong>
          <span>{error}</span>
        </div>
      )}

      {!profile?.learning_language_id && !error && (
        <div className="notice">
          <strong>Choose your learning language.</strong>
          <span>Open Settings to select one of the available courses before starting.</span>
          <Link to="/settings">Open settings</Link>
        </div>
      )}

      <div className="dashboard-layout">
        <div className="learning-column">
          <section className="course-banner">
            <div>
              <p>{language?.name || 'Your course'}</p>
              <h2>
                {nextUnit
                  ? `Continue: ${nextUnit.title}`
                  : courseProgress.totalCards > 0
                    ? 'Course complete, for now'
                    : 'Your first unit is coming soon'}
              </h2>
              <span>{courseProgress.completedCards} of {courseProgress.totalCards} cards learned</span>
            </div>
            {nextUnit && (
              <Link to={`/lessons/${nextUnit.id}`} className="button button--light">
                {courseProgress.completedCards > 0 ? 'Open unit' : 'Start unit'}
                <AppIcon name="arrow" size={18} />
              </Link>
            )}
          </section>

          <section className="learning-path learning-path--guided" aria-labelledby="learning-path-title">
            <div className="section-heading section-heading--row">
              <div>
                <p className="eyebrow">Current course</p>
                <h2 id="learning-path-title">Learning path</h2>
              </div>
              <span className="path-total">{courseProgress.percent}% complete</span>
            </div>

            {units.length === 0 && !error ? (
              <div className="empty-state">
                <AppIcon name="learn" size={32} />
                <h3>No units are available yet</h3>
                <p>Choose another language in Settings or check back after content is added.</p>
              </div>
            ) : (
              <ol className="guided-unit-list">
                {units.map((unit, index) => {
                  const progress = unitProgress(unit.id);
                  return (
                    <li key={unit.id} className="guided-unit">
                      <header className="guided-unit__header">
                        <div>
                          <span>Unit {index + 1}</span>
                          <h3>{unit.title}</h3>
                          <p>{unit.description}</p>
                        </div>
                        <strong>{progress.completed}/{progress.total}</strong>
                      </header>

                      <div className="guided-path" aria-label={`${unit.title} activities`}>
                        {PATH_ACTIVITIES.map((pathActivity, activityIndex) => {
                          const previousThreshold = activityIndex === 0
                            ? 0
                            : PATH_ACTIVITIES[activityIndex - 1].threshold;
                          const isDone = progress.percent >= pathActivity.threshold;
                          const isCurrent = !isDone && progress.percent >= previousThreshold;

                          return (
                            <div
                              key={pathActivity.id}
                              className={`guided-path__stop guided-path__stop--${activityIndex + 1}`}
                            >
                              <Link
                                to={`/lessons/${unit.id}?activity=${pathActivity.id}`}
                                className={`path-activity-node${isDone ? ' path-activity-node--done' : ''}${isCurrent ? ' path-activity-node--current' : ''}`}
                                aria-label={`${pathActivity.title}, ${isDone ? 'completed stage' : 'open activity'}`}
                              >
                                <AppIcon name={isDone ? 'check' : pathActivity.icon} size={28} />
                              </Link>
                              <span>{pathActivity.label}</span>
                            </div>
                          );
                        })}
                      </div>

                      <footer className="guided-unit__footer">
                        <progress
                          className="progress-bar"
                          max="100"
                          value={progress.percent}
                          aria-label={`${unit.title}: ${progress.percent}% complete`}
                        />
                        <div>
                          <span>{progress.isComplete ? 'Unit complete' : `${progress.percent}% complete`}</span>
                          <Link to={`/lessons/${unit.id}`} className="button button--outline button--small">
                            All activities
                            <AppIcon name="arrow" size={16} />
                          </Link>
                        </div>
                      </footer>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        <aside className="dashboard-rail" aria-label="Learning summary">
          <section className="summary-card summary-card--goal">
            <span className="summary-card__icon"><AppIcon name="target" /></span>
            <div>
              <small>Daily goal</small>
              <strong>{profile?.daily_goal_minutes ?? 10} minutes</strong>
              <p>Your chosen practice target.</p>
            </div>
          </section>

          <section className="summary-card">
            <p className="eyebrow">Course progress</p>
            <div className="stat-grid">
              <div><strong>{courseProgress.completedCards}</strong><span>Cards learned</span></div>
              <div><strong>{courseProgress.completedUnits}</strong><span>Units finished</span></div>
            </div>
          </section>

          <section className="summary-card summary-card--quiet">
            <p className="eyebrow">Learning preferences</p>
            <h3>Make the path yours</h3>
            <p>Switch languages, adjust your daily goal, or control pronunciation audio.</p>
            <Link to="/settings" className="inline-link">Open settings <AppIcon name="arrow" size={16} /></Link>
          </section>
        </aside>
      </div>
    </section>
  );
}
