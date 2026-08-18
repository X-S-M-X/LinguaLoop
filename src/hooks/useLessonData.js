import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { buildLessonCards } from '../lib/lessonHelpers.js';

export function useLessonData(unitId, userId) {
  const [unit, setUnit] = useState(null);
  const [cards, setCards] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!userId || !unitId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const [unitResult, languagesResult, conceptsResult] = await Promise.all([
      supabase
        .from('units')
        .select('id, language_id, slug, title, description, sort_order')
        .eq('id', unitId)
        .maybeSingle(),
      supabase.from('languages').select('id, code, name'),
      supabase
        .from('concepts')
        .select('id, unit_id, slug, difficulty, sort_order')
        .eq('unit_id', unitId)
        .order('sort_order'),
    ]);

    const firstError = unitResult.error ?? languagesResult.error ?? conceptsResult.error;
    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }

    if (!unitResult.data) {
      setError('That lesson does not exist.');
      setLoading(false);
      return;
    }

    const concepts = conceptsResult.data ?? [];
    const conceptIds = concepts.map((concept) => concept.id);
    let translations = [];
    let progressRows = [];

    if (conceptIds.length > 0) {
      const [translationResult, progressResult] = await Promise.all([
        supabase
          .from('translations')
          .select('concept_id, language_id, term, romanization')
          .in('concept_id', conceptIds),
        supabase
          .from('progress')
          .select('concept_id, completed_at')
          .eq('user_id', userId)
          .in('concept_id', conceptIds),
      ]);

      const contentError = translationResult.error ?? progressResult.error;
      if (contentError) {
        setError(contentError.message);
        setLoading(false);
        return;
      }

      translations = translationResult.data ?? [];
      progressRows = progressResult.data ?? [];
    }

    const languages = languagesResult.data ?? [];
    const sourceLanguage = languages.find((language) => language.code === 'en');
    const targetLanguage = languages.find(
      (language) => language.id === unitResult.data.language_id
    );

    setUnit({
      ...unitResult.data,
      sourceLanguage: sourceLanguage ?? null,
      language: targetLanguage ?? null,
    });
    setCards(buildLessonCards({
      concepts,
      translations,
      sourceLanguageId: sourceLanguage?.id,
      targetLanguageId: targetLanguage?.id,
    }));
    setCompletedIds(
      new Set(progressRows.filter((row) => row.completed_at).map((row) => row.concept_id))
    );
    setLoading(false);
  }, [unitId, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const completeConcept = useCallback(async (conceptId, score = 100) => {
    const { error: progressError } = await supabase
      .from('progress')
      .upsert(
        {
          user_id: userId,
          concept_id: conceptId,
          completed_at: new Date().toISOString(),
          score,
        },
        { onConflict: 'user_id,concept_id' }
      );

    if (progressError) throw progressError;

    setCompletedIds((current) => {
      const next = new Set(current);
      next.add(conceptId);
      return next;
    });
  }, [userId]);

  return {
    unit,
    cards,
    completedIds,
    loading,
    error,
    reload: load,
    completeConcept,
  };
}
