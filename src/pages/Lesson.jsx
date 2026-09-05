import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import ActivityPicker from '../components/learning/ActivityPicker.jsx';
import FlashcardActivity from '../components/learning/FlashcardActivity.jsx';
import QuizActivity from '../components/learning/QuizActivity.jsx';
import SpeakAndRepeatActivity from '../components/learning/SpeakAndRepeatActivity.jsx';
import AppIcon from '../components/AppIcon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useProfile } from '../context/ProfileContext.jsx';
import { useLessonData } from '../hooks/useLessonData.js';

export default function Lesson() {
  const { unitId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { profile } = useProfile();
  const requestedActivity = searchParams.get('activity');
  const [activity, setActivity] = useState(
    ['flashcards', 'quiz', 'speak', 'review'].includes(requestedActivity) ? requestedActivity : null
  );
  const {
    unit,
    cards,
    completedIds,
    attempts,
    loading,
    error,
    completeConcept,
    recordAttempt,
  } = useLessonData(unitId, user?.id);
  const speechCards = cards.filter((card) => card.speech_practice_enabled);

  function selectActivity(nextActivity) {
    setActivity(nextActivity);
    setSearchParams({ activity: nextActivity });
  }

  function returnToActivities() {
    setActivity(null);
    setSearchParams({});
  }

  if (loading) {
    return <p className="page-loading">Preparing your activities…</p>;
  }

  if (error && !unit) {
    return (
      <section className="lesson-shell">
        <div className="notice notice--error" role="alert">
          <strong>We could not open this unit.</strong>
          <span>{error}</span>
          <Link to="/dashboard">Return to your path</Link>
        </div>
      </section>
    );
  }

  if (cards.length === 0) {
    return (
      <section className="lesson-shell">
        <Link to="/dashboard" className="back-link">← Back to learning path</Link>
        <div className="empty-state lesson-empty-state">
          <AppIcon name="learn" size={34} />
          <h1>This unit has no complete cards yet</h1>
          <p>Each concept needs both a source and target translation before it can be practised.</p>
        </div>
      </section>
    );
  }

  if (activity === 'flashcards') {
    return (
      <FlashcardActivity
        unit={unit}
        cards={cards}
        completedIds={completedIds}
        onCompleteConcept={completeConcept}
        onRecordAttempt={recordAttempt}
        onChangeActivity={returnToActivities}
        showRomanization={profile?.show_romanization ?? true}
        autoplayTts={profile?.autoplay_tts ?? false}
        speechRate={Number(profile?.speech_rate ?? 1)}
      />
    );
  }

  if (activity === 'review') {
    return (
      <FlashcardActivity
        unit={unit}
        cards={cards}
        completedIds={completedIds}
        attempts={attempts}
        smartReview
        onCompleteConcept={completeConcept}
        onRecordAttempt={recordAttempt}
        onChangeActivity={returnToActivities}
        showRomanization={profile?.show_romanization ?? true}
        autoplayTts={profile?.autoplay_tts ?? false}
        speechRate={Number(profile?.speech_rate ?? 1)}
      />
    );
  }

  if (activity === 'speak' && speechCards.length > 0) {
    return (
      <SpeakAndRepeatActivity
        unit={unit}
        cards={speechCards}
        completedIds={completedIds}
        onCompleteConcept={completeConcept}
        onRecordAttempt={recordAttempt}
        onChangeActivity={returnToActivities}
        showRomanization={profile?.show_romanization ?? true}
        autoplayTts={profile?.autoplay_tts ?? false}
        speechRate={Number(profile?.speech_rate ?? 1)}
      />
    );
  }

  if (activity === 'quiz') {
    return (
      <QuizActivity
        unit={unit}
        cards={cards}
        completedIds={completedIds}
        onCompleteConcept={completeConcept}
        onRecordAttempt={recordAttempt}
        onChangeActivity={returnToActivities}
      />
    );
  }

  return (
    <ActivityPicker
      unit={unit}
      cards={cards}
      completedCount={completedIds.size}
      attemptCount={attempts.length}
      onSelect={selectActivity}
    />
  );
}
