import { Link } from 'react-router-dom';
import { useState } from 'react';
import AppIcon from '../AppIcon.jsx';
import { buildQuizQuestions, getSessionPercent } from '../../lib/lessonHelpers.js';

export default function QuizActivity({
  unit,
  cards,
  completedIds,
  onCompleteConcept,
  onRecordAttempt,
  onChangeActivity,
}) {
  const [questions, setQuestions] = useState(() => buildQuizQuestions(cards));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedChoiceId, setSelectedChoiceId] = useState(null);
  const [answerWasCorrect, setAnswerWasCorrect] = useState(null);
  const [correctIds, setCorrectIds] = useState(new Set());
  const [incorrectIds, setIncorrectIds] = useState(new Set());
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const currentQuestion = questions[questionIndex];
  const sessionPercent = getSessionPercent(questionIndex, questions.length, finished);

  function restartQuiz() {
    setQuestions(buildQuizQuestions(cards));
    setQuestionIndex(0);
    setSelectedChoiceId(null);
    setAnswerWasCorrect(null);
    setCorrectIds(new Set());
    setIncorrectIds(new Set());
    setFinished(false);
    setSaving(false);
    setSaveError(null);
  }

  async function saveCorrectAnswer() {
    if (completedIds.has(currentQuestion.id)) return true;

    setSaving(true);
    setSaveError(null);

    try {
      await onCompleteConcept(currentQuestion.id, 100);
      return true;
    } catch (error) {
      setSaveError(error.message || 'Your answer was correct, but progress could not be saved.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function chooseAnswer(choiceId) {
    if (selectedChoiceId || saving) return;

    const isCorrect = choiceId === currentQuestion.id;
    setSelectedChoiceId(choiceId);
    setAnswerWasCorrect(isCorrect);

    try {
      await onRecordAttempt({
        conceptId: currentQuestion.id,
        activityType: 'quiz',
        wasCorrect: isCorrect,
        score: isCorrect ? 100 : 0,
      });
    } catch (attemptError) {
      console.warn('The quiz continued, but the attempt history was not saved:', attemptError);
    }

    if (isCorrect) {
      setCorrectIds((current) => new Set(current).add(currentQuestion.id));
      await saveCorrectAnswer();
      return;
    }

    setIncorrectIds((current) => new Set(current).add(currentQuestion.id));
  }

  async function continueQuiz() {
    if (saving) return;

    if (answerWasCorrect && saveError) {
      const saved = await saveCorrectAnswer();
      if (!saved) return;
    }

    if (questionIndex >= questions.length - 1) {
      setFinished(true);
      return;
    }

    setQuestionIndex((index) => index + 1);
    setSelectedChoiceId(null);
    setAnswerWasCorrect(null);
    setSaveError(null);
  }

  if (finished) {
    const score = Math.round((correctIds.size / questions.length) * 100);

    return (
      <section className="lesson-shell lesson-complete quiz-complete">
        <span className="lesson-complete__icon lesson-complete__icon--purple">
          <AppIcon name="quiz" size={42} />
        </span>
        <p className="eyebrow">Quiz complete</p>
        <h1>{score >= 80 ? 'Strong result!' : 'Good practice. Keep looping.'}</h1>
        <div className="quiz-score" aria-label={`Quiz score ${score}%`}>
          <strong>{score}%</strong>
          <span>{correctIds.size} correct · {incorrectIds.size} to review</span>
        </div>
        <p>
          Correct answers were saved to your concept progress. Incorrect answers did not mark
          those concepts as complete.
        </p>
        <div className="lesson-complete__actions">
          <button type="button" className="button button--secondary" onClick={restartQuiz}>
            Try quiz again
          </button>
          <button type="button" className="button button--primary" onClick={onChangeActivity}>
            Choose activity <AppIcon name="arrow" size={18} />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="lesson-shell">
      <div className="lesson-topbar lesson-topbar--actions">
        <button type="button" className="back-link back-link--button" onClick={onChangeActivity}>
          ← Activities
        </button>
        <Link to="/dashboard" className="lesson-tool">Leave unit</Link>
      </div>

      <div className="lesson-progress-row">
        <progress
          className="progress-bar progress-bar--large progress-bar--purple"
          max="100"
          value={sessionPercent}
          aria-label={`Question ${questionIndex + 1} of ${questions.length}`}
        />
        <strong>{questionIndex + 1}/{questions.length}</strong>
      </div>

      <header className="lesson-heading">
        <p className="eyebrow">Quick quiz · {unit.title}</p>
        <h1>Choose the {unit.language?.name} answer</h1>
      </header>

      <article className="quiz-prompt">
        <span>{unit.sourceLanguage?.name || 'English'}</span>
        <strong lang={unit.sourceLanguage?.code}>{currentQuestion.prompt}</strong>
      </article>

      <div className="quiz-options" aria-label="Answer choices">
        {currentQuestion.choices.map((choice, index) => {
          const showCorrect = selectedChoiceId && choice.id === currentQuestion.id;
          const showWrong = selectedChoiceId === choice.id && !answerWasCorrect;
          const stateClass = showCorrect
            ? ' quiz-option--correct'
            : showWrong
              ? ' quiz-option--wrong'
              : '';

          return (
            <button
              key={choice.id}
              type="button"
              className={`quiz-option${stateClass}`}
              onClick={() => chooseAnswer(choice.id)}
              disabled={Boolean(selectedChoiceId) || saving}
            >
              <span>{index + 1}</span>
              <strong lang={unit.language?.code}>{choice.label}</strong>
              {showCorrect && <AppIcon name="check" size={20} />}
            </button>
          );
        })}
      </div>

      {selectedChoiceId && (
        <div
          className={`quiz-feedback${answerWasCorrect ? ' quiz-feedback--correct' : ' quiz-feedback--wrong'}`}
          aria-live="polite"
        >
          <div>
            <strong>{answerWasCorrect ? 'Correct!' : 'Not quite'}</strong>
            <span>
              {answerWasCorrect
                ? 'Your learned progress is up to date.'
                : `The correct answer is ${currentQuestion.answer}.`}
            </span>
            {saveError && <span className="quiz-feedback__error">{saveError}</span>}
          </div>
          <button
            type="button"
            className="button button--primary"
            onClick={continueQuiz}
            disabled={saving}
          >
            {saving ? 'Saving…' : saveError ? 'Retry save' : 'Continue'}
            {!saving && !saveError && <AppIcon name="arrow" size={18} />}
          </button>
        </div>
      )}
    </section>
  );
}
