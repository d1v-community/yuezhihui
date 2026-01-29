#!/usr/bin/env node
/**
 * Minimal API smoke test (auth + onboarding V2).
 *
 * Usage:
 *   APP_URL=http://localhost:5173 node scripts/api_smoke_test.mjs
 */

import assert from "node:assert/strict";

const BASE = process.env.APP_URL || "http://localhost:5173";

function url(path) {
  return `${BASE}${path}`;
}

async function jsonFetch(path, { method = "GET", token, body } = {}) {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(url(path), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // keep raw text for debugging
  }
  return { res, data, text };
}

async function main() {
  // OpenAPI
  const openapi = await jsonFetch("/api/openapi.json");
  assert.equal(openapi.res.status, 200, `openapi failed: ${openapi.text}`);
  assert.ok(openapi.data?.paths, "openapi should include paths");

  // --- Auth ---
  const email = `codex-smoke-${Date.now()}@example.com`;

  const send = await jsonFetch("/api/auth/send-code", {
    method: "POST",
    body: { email },
  });
  assert.equal(send.res.status, 200, `send-code failed: ${send.text}`);
  assert.equal(send.data?.success, true, `send-code success=false: ${send.text}`);
  assert.ok(send.data?.code, "send-code should return dev code (NODE_ENV!=production)");

  const verify = await jsonFetch("/api/auth/verify-login", {
    method: "POST",
    body: { email, code: send.data.code },
  });
  assert.equal(verify.res.status, 200, `verify-login failed: ${verify.text}`);
  assert.equal(verify.data?.success, true, `verify-login success=false: ${verify.text}`);
  const token = verify.data?.token;
  assert.ok(token, "verify-login should return token");

  const me = await jsonFetch("/api/auth/me", { token });
  assert.equal(me.res.status, 200, `auth/me failed: ${me.text}`);
  assert.equal(me.data?.authenticated, true, `auth/me authenticated=false: ${me.text}`);

  const sync = await jsonFetch("/api/auth/sync-cookie", { method: "POST", token, body: {} });
  assert.equal(sync.res.status, 200, `auth/sync-cookie failed: ${sync.text}`);
  assert.equal(sync.data?.success, true, `auth/sync-cookie success=false: ${sync.text}`);

  // --- Onboarding V2 ---
  const start = await jsonFetch("/api/onboarding/v2/start", { method: "POST", token, body: {} });
  assert.equal(start.res.status, 200, `onboarding start failed: ${start.text}`);
  assert.equal(start.data?.success, true, `onboarding start success=false: ${start.text}`);
  assert.equal(start.data?.session?.status, "in_progress");
  assert.equal(start.data?.session?.currentQuestionId, "A0_consent_research");

  async function answer(questionId, answerPayload, expectedNext) {
    const r = await jsonFetch("/api/onboarding/v2/answer", {
      method: "POST",
      token,
      body: { questionId, answer: answerPayload },
    });
    assert.equal(r.res.status, 200, `answer ${questionId} failed: ${r.text}`);
    assert.equal(r.data?.success, true, `answer ${questionId} success=false: ${r.text}`);
    assert.equal(r.data?.nextQuestionId ?? null, expectedNext ?? null, `next mismatch after ${questionId}`);

    const state = await jsonFetch("/api/onboarding/v2/state", { token });
    assert.equal(state.res.status, 200, `state failed after ${questionId}: ${state.text}`);
    assert.equal(state.data?.success, true);
    assert.equal(state.data?.session?.currentQuestionId ?? null, expectedNext ?? null);
  }

  await answer("A0_consent_research", { type: "single", value: "agree" }, "B1_birth_date");
  await answer(
    "B1_birth_date",
    { type: "object", value: { kind: "exact_date", date: "1990-01-01" } },
    "B2_region_level"
  );
  await answer("B2_region_level", { type: "single", value: "tier1" }, "C1_menarche_ever");
  await answer("C1_menarche_ever", { type: "single", value: "yes" }, "C6_menarche_age_band");
  await answer("C6_menarche_age_band", { type: "single", value: "13-14" }, "C3_menses_last_3m");
  await answer("C3_menses_last_3m", { type: "single", value: "yes" }, "C2_current_status");
  await answer("C2_current_status", { type: "single", value: "menstruating" }, "D1_period_length_days");
  await answer("D1_period_length_days", { type: "number", value: 5 }, "D2_cycle_regularity");
  await answer("D2_cycle_regularity", { type: "single", value: "regular" }, "D3_cycle_length_days");
  await answer("D3_cycle_length_days", { type: "number", value: 28 }, "D5_last_period_start");
  await answer("D5_last_period_start", { type: "date", value: "2026-01-01" }, "E1_products");
  await answer("E1_products", { type: "multi", values: ["pad"] }, "E1_pad_brand");
  await answer("E1_pad_brand", { type: "single", value: "sofy" }, "E2_change_frequency_peak");
  await answer("E2_change_frequency_peak", { type: "single", value: "2-4h" }, "E3_clots_leakage");
  await answer("E3_clots_leakage", { type: "multi", values: ["none"] }, "F1_health_conditions");
  await answer(
    "F1_health_conditions",
    { type: "multi", values: ["缺铁性贫血", "非经期出血"] },
    "F2_condition_source"
  );
  await answer("F2_condition_source", { type: "single", value: "doctor_dx" }, "M1_pregnancy_possible");
  await answer("M1_pregnancy_possible", { type: "single", value: "impossible" }, "M2_iron_deficiency_confirm");
  await answer("M2_iron_deficiency_confirm", { type: "single", value: "yes" }, "M3_iron_treatment");
  await answer("M3_iron_treatment", { type: "single", value: "no" }, "G1_bleeding_history_multi");
  await answer("G1_bleeding_history_multi", { type: "multi", values: ["都没有"] }, "H1_contraception_methods");
  await answer("H1_contraception_methods", { type: "multi", values: ["condom"] }, "H2_pregnancy_history");
  await answer("H2_pregnancy_history", { type: "single", value: "never" }, "H5_abortion_history");
  await answer("H5_abortion_history", { type: "single", value: "none" }, "I1_height_cm");
  await answer("I1_height_cm", { type: "number", value: 165 }, "I2_weight_kg");
  await answer("I2_weight_kg", { type: "number", value: 55 }, "J1_know_mbl");
  await answer("J1_know_mbl", { type: "single", value: "no" }, "J3_mbl_subjective");
  await answer("J3_mbl_subjective", { type: "single", value: "normal" }, null);

  // Position save (null is allowed)
  const pos = await jsonFetch("/api/onboarding/v2/position", {
    method: "POST",
    token,
    body: { currentQuestionId: null },
  });
  assert.equal(pos.res.status, 200, `position failed: ${pos.text}`);
  assert.equal(pos.data?.success, true);

  // Submit
  const submit = await jsonFetch("/api/onboarding/v2/submit", { method: "POST", token, body: {} });
  assert.equal(submit.res.status, 200, `submit failed: ${submit.text}`);
  assert.equal(submit.data?.success, true);
  assert.equal(submit.data?.status, "completed");

  const finalState = await jsonFetch("/api/onboarding/v2/state", { token });
  assert.equal(finalState.res.status, 200);
  assert.equal(finalState.data?.session?.status, "completed");
  assert.equal(finalState.data?.session?.currentQuestionId, null);

  const logout = await jsonFetch("/api/auth/logout", { method: "POST", body: {} });
  assert.equal(logout.res.status, 200, `auth/logout failed: ${logout.text}`);
  assert.equal(logout.data?.success, true, `auth/logout success=false: ${logout.text}`);

  console.log("✅ API smoke test passed:", { base: BASE, email });
}

main().catch((err) => {
  console.error("❌ API smoke test failed:", err?.stack || err);
  process.exit(1);
});
