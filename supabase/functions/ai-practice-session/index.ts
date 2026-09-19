import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEFAULT_MODEL = "gpt-5.6-luna";
const SESSION_SIZE = 5;

type AttemptRow = {
  concept_id: string;
  was_correct: boolean;
  created_at: string;
};

type Candidate = {
  concept_id: string;
  prompt: string;
  answer: string;
  romanization: string | null;
  correct_attempts: number;
  incorrect_attempts: number;
};

type AiCandidate = {
  card_ref: number;
  prompt: string;
  answer: string;
  romanization: string | null;
  correct_attempts: number;
  incorrect_attempts: number;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractOutputText(payload: Record<string, unknown>) {
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as { content?: unknown }).content)
      ? (item as { content: unknown[] }).content
      : [];
    for (const part of content) {
      if (
        part
        && typeof part === "object"
        && (part as { type?: unknown }).type === "output_text"
        && typeof (part as { text?: unknown }).text === "string"
      ) {
        return (part as { text: string }).text;
      }
    }
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ code: "METHOD_NOT_ALLOWED", message: "Use POST." }, 405);
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return jsonResponse({ code: "UNAUTHENTICATED", message: "Sign in first." }, 401);
  }

  let body: { unitId?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ code: "INVALID_BODY", message: "Send a JSON request." }, 400);
  }

  if (typeof body.unitId !== "string" || !UUID_PATTERN.test(body.unitId)) {
    return jsonResponse({ code: "INVALID_UNIT", message: "Choose a valid learning unit." }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ code: "SERVER_CONFIG", message: "The coach is not configured." }, 503);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const token = authorization.slice("Bearer ".length);
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return jsonResponse({ code: "UNAUTHENTICATED", message: "Your session is no longer valid." }, 401);
  }

  const [profileResult, unitResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("ai_coaching_enabled")
      .eq("id", userData.user.id)
      .maybeSingle(),
    supabase
      .from("units")
      .select("id, language_id")
      .eq("id", body.unitId)
      .maybeSingle(),
  ]);

  if (profileResult.error || unitResult.error) {
    return jsonResponse({ code: "DATA_ERROR", message: "The coach could not load this unit." }, 500);
  }
  if (!profileResult.data?.ai_coaching_enabled) {
    return jsonResponse({ code: "AI_DISABLED", message: "Enable AI coaching in Settings first." }, 403);
  }
  if (!unitResult.data) {
    return jsonResponse({ code: "INVALID_UNIT", message: "That learning unit does not exist." }, 404);
  }

  const [languagesResult, conceptsResult] = await Promise.all([
    supabase.from("languages").select("id, code"),
    supabase
      .from("concepts")
      .select("id, sort_order")
      .eq("unit_id", unitResult.data.id)
      .order("sort_order"),
  ]);
  if (languagesResult.error || conceptsResult.error) {
    return jsonResponse({ code: "DATA_ERROR", message: "The coach could not load the curriculum." }, 500);
  }

  const sourceLanguage = languagesResult.data?.find((language) => language.code === "en");
  const targetLanguage = languagesResult.data?.find(
    (language) => language.id === unitResult.data.language_id,
  );
  const concepts = conceptsResult.data ?? [];
  const conceptIds = concepts.map((concept) => concept.id);
  if (!sourceLanguage || !targetLanguage || conceptIds.length < 2) {
    return jsonResponse({ code: "INCOMPLETE_UNIT", message: "This unit needs more reviewed curriculum." }, 409);
  }

  const [translationsResult, attemptsResult] = await Promise.all([
    supabase
      .from("translations")
      .select("concept_id, language_id, term, romanization")
      .in("concept_id", conceptIds),
    supabase
      .from("learning_attempts")
      .select("concept_id, was_correct, created_at")
      .eq("user_id", userData.user.id)
      .in("concept_id", conceptIds)
      .order("created_at", { ascending: false })
      .limit(250),
  ]);
  if (translationsResult.error || attemptsResult.error) {
    return jsonResponse({ code: "DATA_ERROR", message: "The coach could not load practice history." }, 500);
  }

  const attemptsByConcept = new Map<string, AttemptRow[]>();
  for (const attempt of (attemptsResult.data ?? []) as AttemptRow[]) {
    attemptsByConcept.set(
      attempt.concept_id,
      [...(attemptsByConcept.get(attempt.concept_id) ?? []), attempt],
    );
  }

  const translations = translationsResult.data ?? [];
  const candidates: Candidate[] = concepts.flatMap((concept) => {
    const prompt = translations.find(
      (translation) => translation.concept_id === concept.id
        && translation.language_id === sourceLanguage.id,
    );
    const answer = translations.find(
      (translation) => translation.concept_id === concept.id
        && translation.language_id === targetLanguage.id,
    );
    if (!prompt?.term || !answer?.term) return [];

    const attempts = attemptsByConcept.get(concept.id) ?? [];
    return [{
      concept_id: concept.id,
      prompt: prompt.term,
      answer: answer.term,
      romanization: answer.romanization ?? null,
      correct_attempts: attempts.filter((attempt) => attempt.was_correct).length,
      incorrect_attempts: attempts.filter((attempt) => !attempt.was_correct).length,
    }];
  });

  const sessionSize = Math.min(SESSION_SIZE, candidates.length);
  if (sessionSize < 2) {
    return jsonResponse({ code: "INCOMPLETE_UNIT", message: "This unit needs more complete cards." }, 409);
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const model = Deno.env.get("OPENAI_MODEL") || DEFAULT_MODEL;
  if (!apiKey) {
    return jsonResponse({ code: "AI_NOT_CONFIGURED", message: "The AI key has not been added yet." }, 503);
  }

  const { data: reserved, error: reserveError } = await supabase.rpc("reserve_ai_session", {
    requested_unit_id: unitResult.data.id,
    requested_model: model,
  });
  if (reserveError) {
    return jsonResponse({ code: "RATE_LIMIT_ERROR", message: "The coach could not reserve a session." }, 500);
  }
  if (!reserved) {
    return jsonResponse({ code: "DAILY_LIMIT", message: "You have reached today’s 10 AI sessions." }, 429);
  }

  // Only this reduced, anonymous view crosses the OpenAI boundary. The
  // temporary card_ref exists only for this request and is mapped back to the
  // database concept ID after the response is validated.
  const aiCandidates: AiCandidate[] = candidates.map((candidate, index) => ({
    card_ref: index + 1,
    prompt: candidate.prompt,
    answer: candidate.answer,
    romanization: candidate.romanization,
    correct_attempts: candidate.correct_attempts,
    incorrect_attempts: candidate.incorrect_attempts,
  }));

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      focus_title: { type: "string" },
      session_reason: { type: "string" },
      items: {
        type: "array",
        minItems: sessionSize,
        maxItems: sessionSize,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            card_ref: { type: "integer", minimum: 1, maximum: aiCandidates.length },
            reason: { type: "string" },
            hint: { type: "string" },
          },
          required: ["card_ref", "reason", "hint"],
        },
      },
    },
    required: ["focus_title", "session_reason", "items"],
  };

  const aiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      reasoning: { effort: "low" },
      max_output_tokens: 900,
      input: [
        {
          role: "system",
          content: [{
            type: "input_text",
            text: [
              "You are LinguaLoop's bounded adaptive practice planner.",
              "Select only from the supplied human-authored cards.",
              `Return exactly ${sessionSize} different card references.`,
              "Prioritise repeated mistakes, then unseen or less-practised concepts.",
              "Do not change translations or decide completion.",
              "Keep focus_title under 55 characters, session_reason under 140 characters,",
              "and each reason and hint under 110 characters. Hints should guide without giving the full answer.",
            ].join(" "),
          }],
        },
        {
          role: "user",
          content: [{
            type: "input_text",
            text: JSON.stringify({ cards: aiCandidates }),
          }],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "adaptive_practice_plan",
          strict: true,
          schema,
        },
      },
    }),
  });

  if (!aiResponse.ok) {
    console.error("OpenAI request failed", aiResponse.status);
    return jsonResponse({ code: "AI_UNAVAILABLE", message: "The AI coach is temporarily unavailable." }, 502);
  }

  const aiPayload = await aiResponse.json() as Record<string, unknown>;
  const outputText = extractOutputText(aiPayload);
  if (!outputText) {
    return jsonResponse({ code: "INVALID_AI_OUTPUT", message: "The coach returned an incomplete plan." }, 502);
  }

  let plan: {
    focus_title?: unknown;
    session_reason?: unknown;
    items?: Array<{ card_ref?: unknown; reason?: unknown; hint?: unknown }>;
  };
  try {
    plan = JSON.parse(outputText);
  } catch {
    return jsonResponse({ code: "INVALID_AI_OUTPUT", message: "The coach returned an unreadable plan." }, 502);
  }

  const seenRefs = new Set<number>();
  const items = (Array.isArray(plan.items) ? plan.items : []).filter((item) => {
    if (!Number.isInteger(item.card_ref)) return false;
    const cardRef = Number(item.card_ref);
    if (cardRef < 1 || cardRef > aiCandidates.length || seenRefs.has(cardRef)) return false;
    if (typeof item.reason !== "string" || typeof item.hint !== "string") return false;
    seenRefs.add(cardRef);
    return true;
  });

  if (
    typeof plan.focus_title !== "string"
    || typeof plan.session_reason !== "string"
    || items.length !== sessionSize
  ) {
    return jsonResponse({ code: "INVALID_AI_OUTPUT", message: "The coach selected an invalid plan." }, 502);
  }

  return jsonResponse({
    source: "openai",
    model,
    focusTitle: plan.focus_title.slice(0, 80),
    sessionReason: plan.session_reason.slice(0, 180),
    items: items.map((item) => ({
      conceptId: candidates[Number(item.card_ref) - 1].concept_id,
      reason: String(item.reason).slice(0, 140),
      hint: String(item.hint).slice(0, 140),
    })),
  });
});
