import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useProfile } from "../context/ProfileContext.jsx";
import { useLearningOverview } from "../hooks/useLearningOverview.js";
import { activityStats, weeklyPractice } from "../lib/practiceHelpers.js";
import PageHeading from "../components/PageHeading.jsx";
import AppIcon from "../components/AppIcon.jsx";

export default function Progress() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const {
    language,
    units,
    courseProgress,
    unitProgress,
    practiceSummary,
    attemptRows,
    loading,
    error,
  } = useLearningOverview(user?.id, profile?.learning_language_id);
  if (profileLoading || loading)
    return <p className="page-loading">Gathering your little wins…</p>;
  const week = weeklyPractice(attemptRows);
  const largest = Math.max(...week.map((d) => d.total), 1);
  const groups = [
    ["flashcard", "Flashcards", "cards"],
    ["quiz", "Quick Quiz", "quiz"],
    ["speech", "Speak & Repeat", "mic"],
    ["smart_review", "Smart Review", "target"],
    ["ai_review", "AI Quiz", "spark"],
  ];
  return (
    <section className="results-page">
      <PageHeading
        eyebrow="Your progress"
        title="Course progress"
        text={`Every saved attempt is a step forward${language ? ` in ${language.name}` : ""}.`}
      >
        <Link className="button button--outline button--small" to="/courses">
          Switch course
          <AppIcon name="swap" size={16} />
        </Link>
      </PageHeading>
      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}
      {!profile?.learning_language_id ? (
        <div className="empty-state">
          <h2>Let’s find your first course.</h2>
          <Link className="button button--primary" to="/courses">
            Explore courses
          </Link>
        </div>
      ) : (
        <>
          <div className="result-stats">
            {[
              [courseProgress.completedCards, "Words learned", "cards", "blue"],
              [
                practiceSummary.accuracy === null
                  ? "—"
                  : `${practiceSummary.accuracy}%`,
                "Recent accuracy",
                "target",
                "mint",
              ],
              [practiceSummary.total, "Saved attempts", "progress", "peach"],
            ].map(([value, label, icon, tone]) => (
              <article key={label}>
                <span className={`icon-bubble tone-${tone}`}>
                  <AppIcon name={icon} />
                </span>
                <div>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              </article>
            ))}
          </div>
          <div className="results-layout">
            <section className="panel weekly-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Recent practice</p>
                  <h2>Your last seven days</h2>
                </div>
                <span className="quiet-badge">
                  {week.reduce((n, d) => n + d.total, 0)} attempts
                </span>
              </div>
              <div
                className="week-chart"
                aria-label="Saved practice attempts in the last seven days"
              >
                {week.map((day) => (
                  <div
                    className={`week-day${day.today ? " week-day--today" : ""}`}
                    key={day.key}
                  >
                    <strong>{day.total}</strong>
                    <div className="bar-track">
                      <span
                        style={{ height: `${(day.total / largest) * 100}%` }}
                      />
                    </div>
                    <small>{day.label}</small>
                  </div>
                ))}
              </div>
              <p className="muted small">
                Saved practice attempts, not time spent. No activity on a day?
                Start a small loop today.
              </p>
            </section>
            <section className="panel course-completion">
              <p className="eyebrow">{language?.name || "YOUR COURSE"}</p>
              <h2>Course completion</h2>
              <div
                className="progress-ring"
                style={{ "--progress": `${courseProgress.percent * 3.6}deg` }}
              >
                <span>
                  <strong>{courseProgress.percent}%</strong>
                  <small>learned</small>
                </span>
              </div>
              <p>
                <strong>
                  {courseProgress.completedCards} of {courseProgress.totalCards}
                </strong>{" "}
                words learned
              </p>
              <Link to="/dashboard" className="text-link">
                Keep learning
                <AppIcon name="arrow" size={16} />
              </Link>
            </section>
          </div>
          <div className="results-layout results-layout--bottom">
            <section className="panel">
              <div className="panel-heading">
                <h2>Practice breakdown</h2>
                <span className="quiet-badge">Recent results</span>
              </div>
              <div className="practice-breakdown">
                {groups.map(([id, name, icon]) => {
                  const stats = activityStats(attemptRows, id);
                  return (
                    <div key={id}>
                      <AppIcon name={icon} size={20} />
                      <strong>{name}</strong>
                      <span>{stats.total} attempts</span>
                      <b>
                        {stats.accuracy === null ? "—" : `${stats.accuracy}%`}
                      </b>
                    </div>
                  );
                })}
              </div>
              <p className="muted small">
                Based on up to 500 recent attempts in this course. Flashcards
                include your own “Know it” ratings.
              </p>
            </section>
            <section className="panel">
              <div className="panel-heading">
                <h2>Unit progress</h2>
              </div>
              {units.map((unit, i) => {
                const p = unitProgress(unit.id);
                return (
                  <Link
                    to={`/lessons/${unit.id}`}
                    className="unit-result"
                    key={unit.id}
                  >
                    <span className="unit-number">{i + 1}</span>
                    <div>
                      <strong>{unit.title}</strong>
                      <p>
                        {p.completed} of {p.total} learned
                      </p>
                      <progress
                        className="progress-bar"
                        max="100"
                        value={p.percent}
                        aria-label={`${unit.title} ${p.percent}%`}
                      />
                    </div>
                    <AppIcon name="arrow" size={17} />
                  </Link>
                );
              })}
            </section>
          </div>
        </>
      )}
    </section>
  );
}
