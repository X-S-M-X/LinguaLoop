import test from "node:test";
import assert from "node:assert/strict";
import { handleRequest } from "./handler.js";

test("retired AI endpoint cannot make provider or database requests", async (t) => {
  const network = t.mock.method(globalThis, "fetch", () => { throw new Error("Unexpected network call"); });
  for (const method of ["POST", "GET", "OPTIONS"]) {
    const response = handleRequest(new Request("https://example.test/ai-practice-session", { method }));
    assert.equal(response.status, { POST: 410, GET: 405, OPTIONS: 204 }[method]);
    assert.equal(response.headers.get("access-control-allow-origin"), "*");
    if (method === "POST") assert.equal((await response.json()).code, "AI_QUIZ_RETIRED");
  }
  assert.equal(network.mock.callCount(), 0);
});
