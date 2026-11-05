import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import AppIcon from "../AppIcon.jsx";
import { supabase } from "../../lib/supabaseClient.js";
import {
  QUIZ_LEVELS,
  buildQuizSession,
  randomQuizPlan,
} from "../../lib/quizHelpers.js";
import QuizSession from "./QuizSession.jsx";

const failureMessages = {
  DAILY_LIMIT:
    "You have used today’s ten AI requests. Try again tomorrow or choose a standard quiz.",
  AI_NOT_CONFIGURED: "The AI service has not been configured yet.",
  AI_PROVIDER_AUTH: "The AI service’s API configuration needs checking.",
  AI_CREDIT_UNAVAILABLE:
    "The AI service has no available credit at the moment.",
  AI_MODEL_UNAVAILABLE: "The configured AI model is unavailable.",
  AI_TIMEOUT: "The AI request took too long. You can try again.",
  AI_DISABLED:
    "AI Quiz is switched off. Enable it in Settings before generating a quiz.",
  UNAUTHENTICATED:
    "Your sign-in has expired. Log in again before generating a quiz.",
  INVALID_AI_OUTPUT:
    "The AI response did not pass the quiz checks. Please try again.",
};

export default function GeneratedQuiz(props) {
  const { unit, cards, attempts, aiEnabled, onChangeActivity } = props;
  const [params, setParams] = useSearchParams();
  const selected = params.get("level") || "auto";
  const level = QUIZ_LEVELS.some((option) => option.id === selected)
    ? selected
    : "auto";
  const roundId = params.get("round");
  const [round, setRound] = useState(null);
  const [failure, setFailure] = useState(null);
  const [loading, setLoading] = useState(false);
  const activeRequest = useRef(null);
  const heading = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
    if (activeRequest.current && activeRequest.current.id !== roundId) {
      activeRequest.current.controller.abort();
      activeRequest.current = null;
      setLoading(false);
    }
  }, [roundId]);
  useEffect(() => () => activeRequest.current?.controller.abort(), []);

  function chooseLevel() {
    activeRequest.current?.controller.abort();
    activeRequest.current = null;
    setLoading(false);
    setFailure(null);
    setParams({ activity: "ai", level });
  }

  async function openQuiz(useAi) {
    if (activeRequest.current || (useAi && !aiEnabled)) return;
    const id = crypto.randomUUID();
    const controller = new AbortController();
    setRound(null);
    setFailure(null);
    setLoading(useAi);
    activeRequest.current = useAi ? { id, controller } : null;
    setParams({ activity: "ai", level, round: id });
    if (!useAi) {
      const plan = randomQuizPlan(cards, attempts, level);
      setRound({ id, plan, questions: buildQuizSession(plan, cards) });
      return;
    }
    try {
      const timeout = setTimeout(() => controller.abort(), 35000);
      let response;
      try {
        response = await supabase.functions.invoke("ai-practice-session", {
          body: { unitId: unit.id, level },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }
      if (activeRequest.current?.id !== id) return;
      const { data, error } = response;
      if (error) {
        let code;
        try {
          code = (await error.context?.json())?.code;
        } catch {
          /* Gateway errors may not include JSON. */
        }
        if (!code && error.context?.status === 401) code = "UNAUTHENTICATED";
        throw new Error(
          failureMessages[code] ||
            "The AI quiz could not be generated. Try again, or choose a standard quiz.",
        );
      }
      if (data?.items?.some((item) => !item?.format)) {
        throw new Error(
          "The AI quiz service needs updating to match this version of LinguaLoop.",
        );
      }
      const questions = buildQuizSession(data, cards);
      if (
        !questions ||
        data.source !== "openai" ||
        typeof data.focusTitle !== "string" ||
        typeof data.sessionReason !== "string"
      ) {
        throw new Error(failureMessages.INVALID_AI_OUTPUT);
      }
      setRound({ id, plan: data, questions });
    } catch (error) {
      if (activeRequest.current?.id !== id) return;
      setFailure({
        id,
        message: controller.signal.aborted
          ? failureMessages.AI_TIMEOUT
          : error.message ||
            "The AI request could not finish. Please try again.",
      });
    } finally {
      if (activeRequest.current?.id === id) {
        activeRequest.current = null;
        setLoading(false);
      }
    }
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
    const failed = failure?.id === roundId;
    return (
      <section className="lesson-shell generated-quiz-page">
        <div className="lesson-topbar">
          <button
            type="button"
            className="back-link back-link--button"
            onClick={chooseLevel}
          >
            ← Quiz setup
          </button>
          <span>{unit.title}</span>
        </div>
        <div className="generated-quiz-status" aria-busy={loading}>
          <span className="ai-coach-orb">
            <AppIcon name="spark" size={32} />
          </span>
          <p className="eyebrow">AI Quiz</p>
          <h1 ref={heading} tabIndex={-1}>
            {loading
              ? "Making your quiz"
              : failed
                ? "Your quiz couldn’t be created"
                : "Start a new quiz"}
          </h1>
          <p role={failed ? "alert" : "status"}>
            {loading
              ? "Creating five questions from your course. This can take a few moments."
              : failed
                ? failure.message
                : "This quiz is no longer loaded. Choose a level and start a new round."}
          </p>
          {!loading && (
            <div className="ai-coach-actions">
              {failed && aiEnabled && (
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => openQuiz(true)}
                >
                  Try AI Quiz again
                </button>
              )}
              {failed && (
                <button
                  type="button"
                  className="button button--outline"
                  onClick={() => openQuiz(false)}
                >
                  Start a standard quiz
                </button>
              )}
              {!failed && (
                <button
                  type="button"
                  className="button button--primary"
                  onClick={chooseLevel}
                >
                  Choose quiz level
                </button>
              )}
            </div>
          )}
          {loading && (
            <button
              type="button"
              className="button button--outline"
              onClick={chooseLevel}
            >
              Cancel
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="lesson-shell generated-quiz-page">
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
        <h1 ref={heading} tabIndex={-1}>
          Generate a practice quiz
        </h1>
        <p>Choose a level, then start a quiz based on your course’s phrases.</p>
      </header>
      <div className="ai-levels" aria-label="Quiz difficulty">
        {QUIZ_LEVELS.map((option) => (
          <button
            type="button"
            key={option.id}
            onClick={() =>
              setParams({ activity: "ai", level: option.id }, { replace: true })
            }
            aria-pressed={level === option.id}
          >
            <strong>{option.label}</strong>
            <span>{option.text}</span>
          </button>
        ))}
      </div>
      {!aiEnabled && (
        <p className="ai-coach-notice">
          AI Quiz is off. <Link to="/settings">Enable it in Settings</Link>, or
          start a standard quiz.
        </p>
      )}
      <div className="ai-coach-actions">
        {aiEnabled && (
          <button
            type="button"
            className="button button--primary"
            onClick={() => openQuiz(true)}
          >
            <AppIcon name="spark" size={17} />
            Generate my quiz
          </button>
        )}
        <button
          type="button"
          className="button button--outline"
          onClick={() => openQuiz(false)}
        >
          Try a standard quiz
        </button>
      </div>
      <p className="lesson-help">
        AI writes the situations and hints. Answers use the phrases taught in
        your course. Questions may occasionally repeat.
      </p>
    </section>
  );
}
