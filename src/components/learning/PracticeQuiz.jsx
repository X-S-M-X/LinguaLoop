import { useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import AppIcon from "../AppIcon.jsx";
import {
  QUIZ_LEVELS,
  buildQuizSession,
  randomQuizPlan,
} from "../../lib/quizHelpers.js";
import QuizSession from "./QuizSession.jsx";

export default function PracticeQuiz(props) {
  const { unit, cards, attempts, onChangeActivity } = props;
  const [params, setParams] = useSearchParams();
  const selected = params.get("level");
  const level = QUIZ_LEVELS.some((option) => option.id === selected)
    ? selected
    : "auto";
  const roundId = params.get("round");
  const [round, setRound] = useState(null);
  const heading = useRef(null);
  const size = Math.min(5, cards.length);

  useEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
  }, [roundId]);

  function chooseLevel() {
    setParams({ activity: "practice", level });
  }

  function startQuiz() {
    const id = crypto.randomUUID();
    const plan = randomQuizPlan(cards, attempts, level);
    setRound({ id, plan, questions: buildQuizSession(plan, cards) });
    setParams({ activity: "practice", level, round: id });
  }

  if (roundId && round?.id === roundId && round.questions) {
    return (
      <QuizSession
        key={roundId}
        {...props}
        plan={round.plan}
        questions={round.questions}
        onNewQuiz={chooseLevel}
      />
    );
  }

  if (roundId) {
    return (
      <section className="lesson-shell practice-quiz-page">
        <div className="practice-quiz-status">
          <p className="eyebrow">Practice Quiz</p>
          <h1 ref={heading} tabIndex={-1}>Start a new round</h1>
          <p>
            This round is no longer loaded. Your saved attempts are kept.
            Choose a difficulty to start again.
          </p>
          <button
            type="button"
            className="button button--primary"
            onClick={chooseLevel}
          >
            Choose quiz level
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="lesson-shell practice-quiz-page">
      <div className="lesson-topbar">
        <button
          type="button"
          className="back-link back-link--button"
          onClick={onChangeActivity}
        >
          ← Activities
        </button>
        <span>{size} questions · {unit.title}</span>
      </div>
      <header className="quiz-intro">
        <span className="quiz-icon">
          <AppIcon name="quiz" size={32} />
        </span>
        <p className="eyebrow">Practice Quiz</p>
        <h1 ref={heading} tabIndex={-1}>Choose your challenge</h1>
        <p>Pick a difficulty and practise a short round from your course.</p>
      </header>
      <div className="quiz-levels" aria-label="Quiz difficulty">
        {QUIZ_LEVELS.map((option) => (
          <button
            type="button"
            key={option.id}
            aria-pressed={level === option.id}
            onClick={() => setParams(
              { activity: "practice", level: option.id },
              { replace: true },
            )}
          >
            <strong>{option.label}</strong>
            <span>{option.text}</span>
          </button>
        ))}
      </div>
      <div className="quiz-actions">
        <button
          type="button"
          className="button button--primary"
          onClick={startQuiz}
        >
          Start quiz <AppIcon name="arrow" size={17} />
        </button>
      </div>
      <p className="lesson-help">
        Questions and choices are shuffled from your unit. Phrases can appear
        again as you practise.
      </p>
    </section>
  );
}
