import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import AppIcon from '../AppIcon.jsx';
import { supabase } from '../../lib/supabaseClient.js';
import { buildSmartReviewSession } from '../../lib/lessonHelpers.js';
import FlashcardActivity from './FlashcardActivity.jsx';

export default function AiCoachActivity({
  unit,
  cards,
  completedIds,
  attempts,
  aiEnabled,
  onCompleteConcept,
  onRecordAttempt,
  onChangeActivity,
  showRomanization,
  autoplayTts,
  speechRate,
}) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [started, setStarted] = useState(false);
  const fallbackCards = useMemo(
    () => buildSmartReviewSession(cards, attempts, completedIds, 5),
    [attempts, cards, completedIds]
  );

  function useDeterministicFallback(reason = null) {
    setPlan({
      source: 'smart-review',
      focusTitle: 'Smart review fallback',
      sessionReason: 'This session uses your saved mistakes and unlearned concepts without an AI call.',
      cards: fallbackCards,
      items: fallbackCards.map((card) => ({
        conceptId: card.id,
        reason: 'Selected from your local practice priority.',
        hint: 'Recall the situation where you would use this word or phrase.',
      })),
    });
    setMessage(reason);
  }

  async function generatePlan() {
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase.functions.invoke('ai-practice-session', {
      body: { unitId: unit.id },
    });
    setLoading(false);

    if (error || !data || !Array.isArray(data.items)) {
      useDeterministicFallback(
        'The AI coach is unavailable or not configured, so LinguaLoop prepared a Smart Review instead.'
      );
      return;
    }

    const cardMap = new Map(cards.map((card) => [card.id, card]));
    const selectedCards = data.items
      .map((item) => cardMap.get(item.conceptId))
      .filter(Boolean);
    if (selectedCards.length !== data.items.length || selectedCards.length < 2) {
      useDeterministicFallback(
        'The AI plan did not match the reviewed curriculum, so LinguaLoop replaced it with Smart Review.'
      );
      return;
    }

    setPlan({
      source: 'openai',
      model: data.model,
      focusTitle: data.focusTitle,
      sessionReason: data.sessionReason,
      items: data.items,
      cards: selectedCards,
    });
  }

  if (!aiEnabled) {
    return (
      <section className="lesson-shell ai-coach-shell">
        <button type="button" className="back-link back-link--button" onClick={onChangeActivity}>
          ← Activities
        </button>
        <div className="ai-coach-intro">
          <span className="ai-coach-orb"><AppIcon name="spark" size={40} /></span>
          <p className="eyebrow">Optional feature</p>
          <h1>Turn on AI coaching first</h1>
          <p>
            AI coaching is opt-in. Review the privacy note in Settings, turn it on,
            and save your changes before generating a session.
          </p>
          <Link to="/settings" className="button button--primary">Open settings</Link>
        </div>
      </section>
    );
  }

  if (started && plan) {
    const hints = Object.fromEntries(plan.items.map((item) => [item.conceptId, item.hint]));
    return (
      <FlashcardActivity
        unit={unit}
        cards={cards}
        presetCards={plan.cards}
        coachTitle={plan.focusTitle}
        coachHints={hints}
        completedIds={completedIds}
        onCompleteConcept={onCompleteConcept}
        onRecordAttempt={onRecordAttempt}
        onChangeActivity={onChangeActivity}
        showRomanization={showRomanization}
        autoplayTts={autoplayTts}
        speechRate={speechRate}
      />
    );
  }

  return (
    <section className="lesson-shell ai-coach-shell">
      <div className="lesson-topbar">
        <button type="button" className="back-link back-link--button" onClick={onChangeActivity}>
          ← Activities
        </button>
        <span>Maximum 10 AI plans per day</span>
      </div>

      <header className="ai-coach-intro">
        <span className="ai-coach-orb"><AppIcon name="spark" size={40} /></span>
        <p className="eyebrow">Adaptive practice coach</p>
        <h1>{plan ? plan.focusTitle : 'Build a focused five-card session'}</h1>
        <p>
          {plan
            ? plan.sessionReason
            : 'The coach can use your anonymous attempt counts to choose a useful review order. LinguaLoop keeps control of the curriculum and correct answers.'}
        </p>
      </header>

      {message && <p className="notice ai-coach-notice" role="status">{message}</p>}

      {plan ? (
        <div className="ai-plan-card">
          <div className="ai-plan-card__label">
            <span><AppIcon name={plan.source === 'openai' ? 'spark' : 'target'} size={17} /></span>
            {plan.source === 'openai' ? 'AI-generated practice order' : 'Deterministic Smart Review'}
          </div>
          <ol>
            {plan.items.map((item, index) => {
              const card = cards.find((candidate) => candidate.id === item.conceptId);
              return (
                <li key={item.conceptId}>
                  <span>{index + 1}</span>
                  <div><strong>{card?.prompt}</strong><small>{item.reason}</small></div>
                </li>
              );
            })}
          </ol>
          <div className="ai-plan-card__actions">
            <button type="button" className="button button--primary" onClick={() => setStarted(true)}>
              Start this session <AppIcon name="arrow" size={18} />
            </button>
            {plan.source === 'openai' && (
              <button type="button" className="button button--secondary" onClick={generatePlan} disabled={loading}>
                Generate another
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="ai-coach-actions">
          <button type="button" className="button button--primary" onClick={generatePlan} disabled={loading}>
            <AppIcon name="spark" size={18} />
            {loading ? 'Building your plan…' : 'Generate AI session'}
          </button>
          <button type="button" className="button button--secondary" onClick={() => useDeterministicFallback()}>
            Use Smart Review instead
          </button>
        </div>
      )}

      <p className="lesson-help">
        AI selects from reviewed cards only. It cannot add course content, change correct answers,
        or mark a concept complete.
      </p>
    </section>
  );
}
