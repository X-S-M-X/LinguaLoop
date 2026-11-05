import { useEffect, useRef, useState } from "react";
import {
  DIFFICULTY_LABELS,
  isWrittenAnswerCorrect,
} from "../../lib/adaptiveHelpers.js";
import { useSpeechSynthesis } from "../../hooks/useSpeechSynthesis.js";

export default function QuizSession({
  unit,
  plan,
  questions,
  completedIds,
  onCompleteConcept,
  onRecordAttempt,
  onChangeActivity,
  showRomanization,
  autoplayTts,
  speechRate,
  onNewQuiz,
}) {
  const [index, setIndex] = useState(0);
  const [written, setWritten] = useState("");
  const [result, setResult] = useState(null);
  const [hint, setHint] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const busy = useRef(false);
  const saved = useRef({ attempt: false, progress: false });
  const heading = useRef(null);
  const synthesis = useSpeechSynthesis();
  const question = questions[index];
  const locale = unit.language?.speech_locale || unit.language?.code || "en-US";

  useEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
  }, [index]);

  async function saveAnswer(answer) {
    if (busy.current) return false;
    busy.current = true;
    setSaving(true);
    setError(null);
    try {
      if (!saved.current.attempt) {
        await onRecordAttempt({
          conceptId: question.id,
          activityType: "quiz",
          wasCorrect: answer.correct,
          score: answer.correct ? 100 : 0,
        });
        saved.current.attempt = true;
      }
      if (
        answer.correct &&
        !saved.current.progress &&
        !completedIds.has(question.id)
      ) {
        await onCompleteConcept(question.id, 100);
        saved.current.progress = true;
      }
      return true;
    } catch {
      setError(
        "Your result could not be saved. Retry before continuing, or return to activities.",
      );
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  async function answer(choiceId) {
    if (result || busy.current) return;
    const correct =
      question.format === "write"
        ? isWrittenAnswerCorrect(question.answer, written, locale)
        : choiceId === question.id;
    const nextResult = { correct, choiceId };
    setResult(nextResult);
    if (correct) setCorrectCount((count) => count + 1);
    if (autoplayTts)
      synthesis.speak(question.answer, { locale, rate: speechRate });
    await saveAnswer(nextResult);
  }

  async function next() {
    if (busy.current || !result) return;
    if (error && !(await saveAnswer(result))) return;
    synthesis.stop();
    saved.current = { attempt: false, progress: false };
    setIndex((value) => value + 1);
    setResult(null);
    setWritten("");
    setHint(false);
  }

  if (!question)
    return (
      <section className="lesson-shell lesson-complete practice-quiz-session">
        <p className="eyebrow">Practice complete</p>
        <h1 ref={heading} tabIndex={-1}>
          {correctCount} of {questions.length} correct
        </h1>
        <p>
          Your results are saved. Your next session will use these attempts to
          adjust difficulty.
        </p>
        <div className="lesson-complete__actions">
          <button className="button button--primary" onClick={onNewQuiz}>
            Try a fresh quiz
          </button>
          <button className="button button--outline" onClick={onChangeActivity}>
            Choose activity
          </button>
        </div>
      </section>
    );

  return (
    <section className="lesson-shell adaptive-practice practice-quiz-session">
      <div className="lesson-topbar">
        <button
          type="button"
          className="back-link back-link--button"
          onClick={onChangeActivity}
        >
          ← Activities
        </button>
        <span>
          {index + 1} / {questions.length}
        </span>
      </div>
      <progress
        className="progress-bar progress-bar--large"
        max={questions.length}
        value={index}
        aria-label="Practice progress"
      />
      <header className="lesson-heading">
        <p className="eyebrow">
          Practice Quiz ·{" "}
          {DIFFICULTY_LABELS[question.difficulty]}
        </p>
        <h1 ref={heading} tabIndex={-1}>{plan.focusTitle}</h1>
      </header>
      <article className="quiz-prompt" aria-live="polite">
        <span>
          {question.format === "meaning"
            ? `What does this ${unit.language?.name} phrase mean?`
            : `Express this meaning in ${unit.language?.name}`}
        </span>
        <strong
          lang={question.format === "meaning" ? unit.language?.code : "en"}
          dir="auto"
        >
          {question.format === "meaning" ? question.answer : question.prompt}
        </strong>
      </article>
      {!result && (
        <div className="adaptive-hint">
          <button
            type="button"
            className="lesson-tool"
            onClick={() => setHint(!hint)}
            aria-expanded={hint}
          >
            {hint ? "Hide hint" : "Show hint"}
          </button>
          {hint && <p>{question.hint}</p>}
        </div>
      )}
      {question.format === "write" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (written.trim()) answer();
          }}
          className="adaptive-answer-form"
        >
          <label htmlFor="written-answer">
            Write the course phrase in {unit.language?.name}
          </label>
          <input
            id="written-answer"
            value={written}
            onChange={(event) => setWritten(event.target.value)}
            lang={unit.language?.code}
            dir={unit.language?.code === "ar" ? "rtl" : "ltr"}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            disabled={Boolean(result)}
            maxLength={200}
          />
          <small>
            Use the spelling learned in this course. Accents matter; punctuation
            and letter case do not.
          </small>
          {!result && (
            <button
              className="button button--primary"
              disabled={!written.trim() || saving}
            >
              Check answer
            </button>
          )}
        </form>
      ) : (
        <div className="quiz-options" aria-label="Answer choices">
          {question.choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              className={`quiz-option${result && choice.id === question.id ? " quiz-option--correct" : result?.choiceId === choice.id ? " quiz-option--wrong" : ""}`}
              disabled={Boolean(result) || saving}
              onClick={() => answer(choice.id)}
            >
              <strong
                lang={
                  question.format === "meaning" ? "en" : unit.language?.code
                }
                dir="auto"
              >
                {choice.label}
              </strong>
            </button>
          ))}
        </div>
      )}
      {result && (
        <div
          className={`quiz-feedback ${result.correct ? "quiz-feedback--correct" : "quiz-feedback--wrong"}`}
          aria-live="polite"
        >
          <div>
            <strong>
              {result.correct ? "Correct!" : "Keep practising this phrase"}
            </strong>
            <span lang={unit.language?.code} dir="auto">
              {question.answer}
            </span>
            <span>{question.prompt}</span>
            {showRomanization && question.romanization && (
              <span dir="ltr">{question.romanization}</span>
            )}
            <button
              type="button"
              className="lesson-tool"
              disabled={!synthesis.supported || synthesis.speaking}
              onClick={() =>
                synthesis.speak(question.answer, {
                  locale,
                  rate: speechRate,
                })
              }
            >
              Listen to answer
            </button>
          </div>
          <button
            type="button"
            className="button button--primary"
            disabled={saving}
            onClick={next}
          >
            {saving
              ? "Saving…"
              : error
                ? "Retry save"
                : index === questions.length - 1
                  ? "Finish"
                  : "Continue"}
          </button>
        </div>
      )}
      {error && (
        <p className="form__error" role="alert">
          {error}
        </p>
      )}
      <p className="lesson-help">
        Correct answers use the phrases taught in your course.
      </p>
    </section>
  );
}
