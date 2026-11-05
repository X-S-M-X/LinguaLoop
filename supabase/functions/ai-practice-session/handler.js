const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// Old clients must not make provider requests after AI Quiz is removed.
export function handleRequest(req) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") {
    return Response.json({ code: "METHOD_NOT_ALLOWED", message: "Use POST." }, { status: 405, headers });
  }
  return Response.json({
    code: "AI_QUIZ_RETIRED",
    message: "AI Quiz has been replaced by Practice Quiz. Refresh LinguaLoop to use it.",
  }, { status: 410, headers });
}
