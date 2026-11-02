import { Link } from "react-router-dom";
import { useRef, useState } from "react";
import AppIcon from "../AppIcon.jsx";
import { supabase } from "../../lib/supabaseClient.js";
import {
  QUIZ_LEVELS,
  buildQuizSession,
  randomQuizPlan,
} from "../../lib/quizHelpers.js";
import QuizSession from "./QuizSession.jsx";

export default function GeneratedQuiz(props) {
  const { unit, cards, attempts, aiEnabled, onChangeActivity } = props;
  const [level, setLevel] = useState("auto");
  const [plan, setPlan] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [started, setStarted] = useState(false);
  const busy = useRef(false);
  function localQuiz(reason) {
    const next = randomQuizPlan(cards, attempts, level);
    setPlan(next);
    setQuestions(buildQuizSession(next, cards));
    setMessage(reason);
  }
  async function generate() {
    if (busy.current || !aiEnabled) return;
    busy.current = true;
    setLoading(true);
    setMessage(null);
    setPlan(null);
    try {
      const { data, error } = await supabase.functions.invoke(
        "ai-practice-session",
        {
          body: { unitId: unit.id, level },
          signal: AbortSignal.timeout(35000),
        },
      );
      if (error) {
        let code;
        try {
          code = (await error.context?.json())?.code;
        } catch {
          /* Gateway errors may not be JSON. */
        }
        const reason =
          {
            DAILY_LIMIT: "You have used today’s ten AI requests.",
            AI_NOT_CONFIGURED: "AI quizzes are not configured yet.",
            AI_TIMEOUT: "The AI request took too long.",
            AI_DISABLED: "AI quizzes are switched off.",
            UNAUTHENTICATED: "Your sign-in has expired.",
          }[code] || "The AI quiz could not be generated.";
        localQuiz(`${reason} A standard quiz is ready below.`);
        return;
      }
      const built = buildQuizSession(data, cards);
      if (
        !built ||
        data.source !== "openai" ||
        typeof data.focusTitle !== "string" ||
        typeof data.sessionReason !== "string"
      ) {
        localQuiz(
          "The quiz response could not be checked. A standard quiz is ready instead.",
        );
        return;
      }
      setPlan(data);
      setQuestions(built);
    } catch {
      localQuiz(
        "The AI request could not finish. A standard quiz is ready instead.",
      );
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }
  if (started && plan && questions)
    return (
      <QuizSession
        {...props}
        plan={plan}
        questions={questions}
        onNewQuiz={() => {
          setStarted(false);
          setPlan(null);
          setQuestions(null);
          setMessage(null);
        }}
      />
    );
  return (
    <section className="lesson-shell">
      <div className="lesson-topbar">
        <button
          type="button"
          className="back-link back-link--button"
          onClick={onChangeActivity}
        >
          ← Activities
        </button>
        <span>5 questions · Up to 10 AI requests daily</span>
      </div>
      <header className="ai-coach-intro">
        <span className="ai-coach-orb">
          <AppIcon name="spark" size={32} />
        </span>
        <p className="eyebrow">AI Quiz</p>
        <h1>Generate a practice quiz</h1>
        <p>
          AI builds questions around this course’s phrases. Choose your level,
          then put what you know into a new context.
        </p>
      </header>
      <div className="ai-levels" aria-label="Quiz difficulty">
        {QUIZ_LEVELS.map((l) => (
          <button
            type="button"
            key={l.id}
            onClick={() => {
              setLevel(l.id);
              setPlan(null);
            }}
            aria-pressed={level === l.id}
            disabled={loading}
          >
            <strong>{l.label}</strong>
            <span>{l.text}</span>
          </button>
        ))}
      </div>
      {!aiEnabled && (
        <p className="notice">
          AI Quiz is off. <Link to="/settings">Enable it in Settings</Link>, or
          try a standard quiz below.
        </p>
      )}
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {plan ? (
        <div className="ai-plan-card">
          <div className="ai-plan-card__label">
            {plan.source === "openai"
              ? "YOUR AI-GENERATED QUIZ"
              : "STANDARD QUIZ · NO AI USED"}
          </div>
          <h2 style={{ marginTop: 12 }}>{plan.focusTitle}</h2>
          <p className="muted small" style={{ marginTop: 12 }}>
            {plan.sessionReason}
          </p>
          <ol>
            {plan.items.map((item, i) => (
              <li key={item.conceptId}>
                <span>0{i + 1}</span>
                <div>
                  <strong>
                    {item.format === "write"
                      ? "Write from memory"
                      : item.format === "meaning"
                        ? "Find the meaning"
                        : "Choose the phrase"}
                  </strong>
                  <small>
                    {item.difficulty === "challenge"
                      ? "Written recall"
                      : item.difficulty === "standard"
                        ? "Four choices"
                        : "Two choices"}
                  </small>
                </div>
              </li>
            ))}
          </ol>
          <div className="ai-plan-card__actions">
            <button
              className="button button--primary"
              onClick={() => setStarted(true)}
            >
              Start quiz <AppIcon name="arrow" size={17} />
            </button>
            {aiEnabled && (
              <button
                className="button button--outline"
                onClick={generate}
                disabled={loading}
              >
                {loading ? "Generating…" : "Generate a different quiz"}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="ai-coach-actions">
          {aiEnabled && (
            <button
              className="button button--primary"
              onClick={generate}
              disabled={loading}
            >
              <AppIcon name="spark" size={17} />
              {loading ? "Making your quiz…" : "Generate my quiz"}
            </button>
          )}
          <button
            className="button button--outline"
            disabled={loading}
            onClick={() => localQuiz(null)}
          >
            Try a standard quiz
          </button>
        </div>
      )}
      <p className="lesson-help">
        AI creates the question wording and situations; answers stay tied to
        your course. Questions may occasionally repeat or need clarification.
        Smart Review is available in Practice for revisiting mistakes.
      </p>
    </section>
  );
}
