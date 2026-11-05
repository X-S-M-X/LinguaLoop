import test from "node:test";
import assert from "node:assert/strict";
import { createHandler } from "./handler.js";

const unitId = "11111111-1111-4111-8111-111111111111";
function fixture(options = {}) {
  let calls = 0;
  let reservations = 0;
  let requestBody;
  const concepts = Array.from({ length: 5 }, (_, i) => ({
    id: `card${i}`,
    sort_order: i,
  }));
  const generated = {
    focus_title: "French practice",
    session_reason: "Practise everyday phrases.",
    items: concepts.map((_, i) => ({
      card_ref: i + 1,
      format: options.format || "translate",
      question: "Greet a friend. What would you say?",
      reason: "New phrase.",
      hint: "Use the greeting from your course.",
    })),
  };
  const data = {
    profiles: { ai_coaching_enabled: options.enabled ?? true },
    units: { id: unitId, language_id: "fr" },
    languages: [
      { id: "en", code: "en" },
      { id: "fr", code: "fr" },
    ],
    concepts,
    translations: concepts.flatMap((c, i) => [
      { concept_id: c.id, language_id: "en", term: `Meaning ${i}` },
      { concept_id: c.id, language_id: "fr", term: `Phrase ${i}` },
    ]),
    learning_attempts: concepts.flatMap((c) =>
      Array.from({ length: options.correctAttempts || 0 }, () => ({
        concept_id: c.id,
        was_correct: true,
        created_at: new Date().toISOString(),
      })),
    ),
  };
  const client = {
    auth: {
      getUser: async () => ({
        data: {
          user: options.invalidUser
            ? null
            : { id: "private-user", email: "private-email" },
        },
      }),
    },
    from(table) {
      const query = {
        then(resolve) {
          return Promise.resolve({
            data: data[table],
            error: options.dbError ? new Error("DB") : null,
          }).then(resolve);
        },
      };
      for (const method of [
        "select",
        "eq",
        "maybeSingle",
        "in",
        "order",
        "limit",
      ])
        query[method] = () => query;
      return query;
    },
    rpc: async () => {
      reservations++;
      return { data: !options.limit };
    },
  };
  const handler = createHandler({
    createClient: () => client,
    getEnv: (key) =>
      key === "OPENAI_MODEL"
        ? null
        : key === "OPENAI_API_KEY" && options.missingKey
          ? null
          : "test-config",
    fetch: async (_url, init) => {
      calls++;
      requestBody = JSON.parse(init.body);
      if (options.timeout) throw new DOMException("Timed out", "TimeoutError");
      if (options.providerError)
        return Response.json(
          {
            error: {
              code: options.providerCode,
              message: "private provider detail",
            },
          },
          { status: options.providerStatus || 503 },
        );
      if (options.nullItem) generated.items[0] = null;
      return Response.json({
        output: [
          {
            content: [{ type: "output_text", text: JSON.stringify(generated) }],
          },
        ],
      });
    },
  });
  return { handler, inspect: () => ({ calls, reservations, requestBody }) };
}
function request(body = { unitId }, authorization = true, method = "POST") {
  return new Request("https://example.test/coach", {
    method,
    headers: authorization
      ? {
          Authorization: "Bearer test-token",
          "Content-Type": "application/json",
        }
      : {},
    ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
  });
}

test("endpoint rejects unauthenticated, invalid-session and malformed requests before AI", async () => {
  for (const [req, options, status] of [
    [request({}, false), {}, 401],
    [request(), { invalidUser: true }, 401],
    [request(null), {}, 400],
    [request({ unitId: "invalid" }), {}, 400],
    [request({}, true, "GET"), {}, 405],
  ]) {
    const f = fixture(options);
    assert.equal((await f.handler(req)).status, status);
    assert.equal(f.inspect().calls, 0);
  }
});
test("disabled consent, missing configuration and quota prevent external calls", async () => {
  for (const [options, status, reservations] of [
    [{ enabled: false }, 403, 0],
    [{ missingKey: true }, 503, 0],
    [{ limit: true }, 429, 1],
  ]) {
    const f = fixture(options);
    assert.equal((await f.handler(request())).status, status);
    assert.equal(f.inspect().calls, 0);
    assert.equal(f.inspect().reservations, reservations);
  }
});
test("successful endpoint sends anonymous curriculum and returns a graded session", async () => {
  const f = fixture();
  const response = await f.handler(request());
  assert.equal(response.status, 200);
  const plan = await response.json();
  assert.equal(plan.items.length, 5);
  assert.equal(plan.items[0].difficulty, "supported");
  const body = f.inspect().requestBody;
  assert.equal(body.store, false);
  const sent = JSON.parse(body.input[1].content[0].text);
  assert.deepEqual(Object.keys(sent.cards[0]).sort(), [
    "answer",
    "card_ref",
    "correct_attempts",
    "incorrect_attempts",
    "prompt",
    "romanization",
  ]);
  assert.equal(JSON.stringify(sent).includes("private-"), false);
  const schema = body.text.format.schema;
  assert.deepEqual(
    Object.keys(schema.properties).sort(),
    [...schema.required].sort(),
  );
  assert.deepEqual(
    Object.keys(schema.properties.items.items.properties).sort(),
    [...schema.properties.items.items.required].sort(),
  );
});
test("provider failures, timeouts and malformed output return controlled failures", async () => {
  for (const [options, status] of [
    [{ providerError: true }, 502],
    [{ timeout: true }, 504],
    [{ nullItem: true }, 502],
    [{ dbError: true }, 500],
  ]) {
    const f = fixture(options);
    const response = await f.handler(request());
    assert.equal(response.status, status);
    assert.equal(response.headers.get("access-control-allow-origin"), "*");
    assert.equal(typeof (await response.json()).code, "string");
  }
});

test("legacy callers get compatible translation plans and cannot receive meaning questions", async () => {
  const legacy = fixture({ correctAttempts: 3 });
  const response = await legacy.handler(request());
  assert.equal(response.status, 200);
  const plan = await response.json();
  assert.ok(
    plan.items.every(
      (item) => item.format === "translate" && item.difficulty === "standard",
    ),
  );
  const mismatch = fixture({ correctAttempts: 3, format: "meaning" });
  assert.equal((await mismatch.handler(request())).status, 502);
  const modern = fixture({ correctAttempts: 3, format: "meaning" });
  const modernResponse = await modern.handler(
    request({ unitId, level: "auto" }),
  );
  assert.equal(modernResponse.status, 200);
  assert.ok(
    (await modernResponse.json()).items.every(
      (item) => item.format === "meaning",
    ),
  );
});

test("explicit hard level permits written questions and unknown levels never invoke AI", async () => {
  const hard = fixture({ format: "write" });
  const response = await hard.handler(request({ unitId, level: "hard" }));
  assert.equal(response.status, 200);
  assert.ok(
    (await response.json()).items.every(
      (item) => item.format === "write" && item.difficulty === "challenge",
    ),
  );
  const invalid = fixture();
  assert.equal(
    (await invalid.handler(request({ unitId, level: "impossible" }))).status,
    400,
  );
  assert.equal(invalid.inspect().calls, 0);
});

test("provider configuration failures have useful codes without leaking provider details", async () => {
  for (const [providerStatus, providerCode, expected] of [
    [401, "invalid_api_key", "AI_PROVIDER_AUTH"],
    [429, "insufficient_quota", "AI_CREDIT_UNAVAILABLE"],
    [404, "model_not_found", "AI_MODEL_UNAVAILABLE"],
  ]) {
    const f = fixture({ providerError: true, providerStatus, providerCode });
    const response = await f.handler(request({ unitId, level: "easy" }));
    assert.equal(response.status, 502);
    const text = await response.text();
    assert.equal(JSON.parse(text).code, expected);
    assert.equal(text.includes("private provider detail"), false);
  }
});
