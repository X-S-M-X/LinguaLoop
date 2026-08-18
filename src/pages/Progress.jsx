import { Link } from 'react-router-dom';
import AppIcon from '../components/AppIcon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useProfile } from '../context/ProfileContext.jsx';
import { useLearningOverview } from '../hooks/useLearningOverview.js';

export default function Progress() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const {
    language,
    units,
    courseProgress,
    unitProgress,
    loading,
    error,
  } = useLearningOverview(user?.id, profile?.learning_language_id);

  if (profileLoading || loading) {
    return <p className="page-loading">Calculating your progress…</p>;
  }

  return (
    <section className="progress-page">
      <header className="progress-page__header">
        <div>
          <p className="eyebrow">Your progress</p>
          <h1>{language?.name || 'Learning'} course summary</h1>
          <p>These totals come from concepts you have actually completed and saved.</p>
        </div>
        <div className="progress-ring" style={{ '--progress': `${courseProgress.percent * 3.6}deg` }}>
          <span><strong>{courseProgress.percent}%</strong><small>complete</small></span>
        </div>
      </header>

      {error && (
        <div className="notice notice--error" role="alert">
          <strong>We could not load your progress.</strong>
          <span>{error}</span>
        </div>
      )}

      {!profile?.learning_language_id && !error && (
        <div className="notice">
          <strong>Choose a learning language first.</strong>
          <span>Your progress summary will appear after you select a course.</span>
          <Link to="/settings">Open settings</Link>
        </div>
      )}

      <div className="progress-summary-grid">
        <article>
          <span><AppIcon name="cards" /></span>
          <strong>{courseProgress.completedCards}</strong>
          <p>Cards learned</p>
        </article>
        <article>
          <span><AppIcon name="learn" /></span>
          <strong>{courseProgress.totalCards}</strong>
          <p>Cards available</p>
        </article>
        <article>
          <span><AppIcon name="check" /></span>
          <strong>{courseProgress.completedUnits}</strong>
          <p>Units completed</p>
        </article>
      </div>

      <section className="progress-units" aria-labelledby="progress-units-title">
        <div className="section-heading section-heading--row">
          <div>
            <p className="eyebrow">Unit breakdown</p>
            <h2 id="progress-units-title">Keep the loop moving</h2>
          </div>
          <Link to="/dashboard" className="button button--outline button--small">
            Back to Learn
          </Link>
        </div>

        {units.length === 0 ? (
          <div className="empty-state">
            <AppIcon name="progress" size={32} />
            <h3>No unit progress yet</h3>
            <p>Select a course in Settings, then complete your first activity.</p>
          </div>
        ) : (
          <div className="progress-unit-list">
            {units.map((unit, index) => {
              const progress = unitProgress(unit.id);
              return (
                <article key={unit.id} className="progress-unit-card">
                  <span className="progress-unit-card__number">{index + 1}</span>
                  <div>
                    <div className="progress-unit-card__heading">
                      <h3>{unit.title}</h3>
                      <strong>{progress.percent}%</strong>
                    </div>
                    <p>{progress.completed} of {progress.total} concepts learned</p>
                    <progress
                      className="progress-bar"
                      max="100"
                      value={progress.percent}
                      aria-label={`${unit.title}: ${progress.percent}% complete`}
                    />
                  </div>
                  <Link to={`/lessons/${unit.id}`} className="button button--outline button--small">
                    Practise
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
