import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useProfile } from "../context/ProfileContext.jsx";
import { useLearningOverview } from "../hooks/useLearningOverview.js";
import PageHeading from "../components/PageHeading.jsx";
import AppIcon from "../components/AppIcon.jsx";
import { ACTIVITIES } from "../lib/practiceHelpers.js";

export default function Practice() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { language, units, attemptRows, loading, error } = useLearningOverview(
    user?.id,
    profile?.learning_language_id,
  );
  const [selected, setSelected] = useState("");
  const unit = units.find((u) => u.id === selected) || units[0];
  const mistakes = new Set(
    attemptRows.filter((a) => !a.was_correct).map((a) => a.concept_id),
  ).size;
  if (loading)
    return <p className="page-loading">Opening your practice space…</p>;
  return (
    <section className="practice-page">
      <PageHeading
        eyebrow="Extra practice"
        title="Choose your practice"
        text="Review tricky cards, try a new quiz or practise one skill."
      >
        {unit && (
          <label className="unit-select">
            PRACTISING
            <select
              aria-label="Practice unit"
              value={unit.id}
              onChange={(e) => setSelected(e.target.value)}
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.title}
                </option>
              ))}
            </select>
          </label>
        )}
      </PageHeading>
      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}
      {!unit ? (
        <div className="empty-state">
          <h2>Choose a course first.</h2>
          <Link to="/courses" className="button button--primary">
            Explore courses
          </Link>
        </div>
      ) : (
        <>
          <div className="practice-features">
            <article className="practice-feature practice-feature--review">
              <span className="icon-bubble tone-mint">
                <AppIcon name="target" size={28} />
              </span>
              <span className="tag">Review your cards</span>
              <h2>Smart Review</h2>
              <p>
                A five-card round built around mistakes and words you haven’t
                learned yet.
              </p>
              <div className="feature-footnote">
                {mistakes
                  ? `${mistakes} words with recent mistakes`
                  : "A good place to build your foundations"}
              </div>
              <Link
                to={`/lessons/${unit.id}?activity=review`}
                className="button button--dark"
              >
                Review my words
                <AppIcon name="arrow" size={18} />
              </Link>
            </article>
            <article className="practice-feature practice-feature--quiz">
              <span className="icon-bubble tone-blue">
                <AppIcon name="quiz" size={28} />
              </span>
              <span className="tag">Five questions</span>
              <h2>Practice Quiz</h2>
              <p>
                Choose a difficulty and practise five shuffled questions from
                your course. Try written answers when you want a challenge.
              </p>
              <div className="feature-footnote">
                Easy · Medium · Hard · Adapt to me
              </div>
              <Link
                to={`/lessons/${unit.id}?activity=practice`}
                className="button button--primary"
              >
                Start a practice quiz
                <AppIcon name="arrow" size={18} />
              </Link>
            </article>
          </div>
          <div className="panel-heading practice-section-heading">
            <div>
              <p className="eyebrow">Activities</p>
              <h2>Practise one skill</h2>
            </div>
            <span className="quiet-badge">{language?.name}</span>
          </div>
          <div className="skill-grid">
            {ACTIVITIES.map((a) => (
              <Link
                className="skill-card"
                key={a.id}
                to={`/lessons/${unit.id}?activity=${a.id}`}
              >
                <span className={`icon-bubble tone-${a.colour}`}>
                  <AppIcon name={a.icon} size={25} />
                </span>
                <h3>
                  {a.id === "flashcards"
                    ? "Flashcards"
                    : a.id === "quiz"
                      ? "Quick Quiz"
                      : "Speak & Repeat"}
                </h3>
                <p>{a.detail}</p>
                <span className="text-link">
                  Open activity <AppIcon name="arrow" size={16} />
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
