import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useProfile } from "../context/ProfileContext.jsx";
import { supabase } from "../lib/supabaseClient.js";

export default function Courses() {
  const { user } = useAuth();
  const { profile, refreshProfile } = useProfile();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const results = await Promise.all([
          supabase
            .from("languages")
            .select("id, code, name")
            .neq("code", "en")
            .order("name"),
          supabase.from("units").select("id, language_id, description"),
          supabase.from("concepts").select("id, unit_id"),
          supabase
            .from("progress")
            .select("concept_id, completed_at")
            .eq("user_id", user.id),
        ]);
        const failed = results.find((result) => result.error);
        if (failed) throw failed.error;
        const [languages, units, concepts, progress] = results.map(
          (result) => result.data || [],
        );
        const learned = new Set(
          progress
            .filter((row) => row.completed_at)
            .map((row) => row.concept_id),
        );
        const available = languages.flatMap((language) => {
          const courseUnits = units.filter(
            (unit) => unit.language_id === language.id,
          );
          const unitIds = new Set(courseUnits.map((unit) => unit.id));
          const courseCards = concepts.filter((card) =>
            unitIds.has(card.unit_id),
          );
          return courseCards.length
            ? [
                {
                  ...language,
                  description: courseUnits[0]?.description,
                  total: courseCards.length,
                  learned: courseCards.filter((card) => learned.has(card.id))
                    .length,
                },
              ]
            : [];
        });
        if (active) setCourses(available);
      } catch {
        if (active)
          setError("We could not load your courses. Refresh to try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [user.id]);

  async function selectCourse(id) {
    if (saving) return;
    setSaving(id);
    setError(null);
    try {
      const { error: saveError } = await supabase
        .from("profiles")
        .update({ learning_language_id: id })
        .eq("id", user.id)
        .select("id")
        .single();
      if (saveError) throw saveError;
      await refreshProfile();
      navigate("/dashboard");
    } catch {
      setError("Your course could not be changed. Please try again.");
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <p className="page-loading">Loading your courses…</p>;
  return (
    <section className="courses-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Choose a course</p>
          <h1>Your language courses</h1>
          <p>
            Switch courses at any time. Your progress stays saved for each
            language.
          </p>
        </div>
      </header>
      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}
      <div className="course-grid">
        {courses.map((course) => (
          <article className="course-choice" key={course.id}>
            <span className="course-badge">{course.code.toUpperCase()}</span>
            <h2>{course.name}</h2>
            <p>{course.description}</p>
            <progress
              className="progress-bar"
              max={course.total}
              value={course.learned}
              aria-label={`${course.name}: ${course.learned} of ${course.total} learned`}
            />
            <small>
              {course.learned} of {course.total} cards learned
            </small>
            <button
              type="button"
              className="button button--primary"
              disabled={Boolean(saving)}
              onClick={() => selectCourse(course.id)}
            >
              {saving === course.id
                ? "Opening…"
                : profile?.learning_language_id === course.id
                  ? "Continue current course"
                  : `Learn ${course.name}`}
            </button>
          </article>
        ))}
      </div>
      {!courses.length && !error && <p>No courses are available yet.</p>}
    </section>
  );
}
