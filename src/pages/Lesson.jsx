import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ActivityPicker from '../components/learning/ActivityPicker.jsx';
import FlashcardActivity from '../components/learning/FlashcardActivity.jsx';
import QuizActivity from '../components/learning/QuizActivity.jsx';
import AppIcon from '../components/AppIcon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useProfile } from '../context/ProfileContext.jsx';
import { useLessonData } from '../hooks/useLessonData.js';

export default function Lesson() {
  const { unitId } = useParams();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [activity, setActivity] = useState(null);
  const {
    unit,
    cards,
    completedIds,
    loading,
    error,
    completeConcept,
  } = useLessonData(unitId, user?.id);

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
        onChangeActivity={() => setActivity(null)}
        showRomanization={profile?.show_romanization ?? true}
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
        onChangeActivity={() => setActivity(null)}
      />
    );
  }

  return (
    <ActivityPicker
      unit={unit}
      cards={cards}
      completedCount={completedIds.size}
      onSelect={setActivity}
    />
  );
}
