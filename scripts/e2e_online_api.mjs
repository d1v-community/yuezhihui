import { config as loadDotenv } from "dotenv";
import { neon } from "@neondatabase/serverless";

loadDotenv();

const DATABASE_URL = process.env.DATABASE_URL;
const APP_URL = (process.env.APP_URL || "https://femalemenstrualrecord819e28.vercel.app").replace(/\/$/, "");

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const stamp = Date.now();
const email = `flowcycle-e2e-${stamp}@example.com`;
const dailyDate = "2026-05-01";
const rangeEnd = "2026-05-03";
const tempBrandName = `E2E Brand ${stamp}`;
const tempSeriesName = `E2E Series ${stamp}`;

const tested = new Set();
let tempBrandId = null;

function log(step, message) {
  console.log(`[e2e] ${step}: ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(path, { method = "GET", token, body, headers } = {}) {
  const url = `${APP_URL}${path}`;
  const finalHeaders = new Headers(headers || {});

  if (token) {
    finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  let payload;
  if (body !== undefined) {
    finalHeaders.set("Content-Type", "application/json");
    payload = JSON.stringify(body);
  }

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body: payload,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  return { response, data, url };
}

async function expectJson(path, options, expectedStatus = 200) {
  const { response, data, url } = await request(path, options);
  if (response.status !== expectedStatus) {
    throw new Error(`${options?.method || "GET"} ${url} expected ${expectedStatus}, got ${response.status}: ${JSON.stringify(data)}`);
  }
  tested.add(`${options?.method || "GET"} ${path}`);
  return { response, data };
}

async function cleanupTempUser() {
  await sql`delete from verification_codes where email = ${email}`;
  await sql`delete from users where email = ${email}`;
}

async function cleanupTempBrand() {
  if (!tempBrandId) return;
  await sql`delete from product_brands where id = ${tempBrandId}`;
  tempBrandId = null;
}

async function waitForVerificationCode() {
  for (let i = 0; i < 10; i += 1) {
    const rows = await sql`
      select code
      from verification_codes
      where email = ${email}
      order by created_at desc
      limit 1
    `;
    if (rows[0]?.code) {
      return rows[0].code;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Verification code was not created");
}

async function verifyDeleted(userId) {
  const [userRows, dailyRows, eventRows, cycleRows, shareRows, feedbackRows, onboardingRows, answerRows, codeRows] = await Promise.all([
    sql`select id from users where id = ${userId} limit 1`,
    sql`select user_id from menstrual_daily where user_id = ${userId} limit 1`,
    sql`select user_id from menstrual_event where user_id = ${userId} limit 1`,
    sql`select user_id from menstrual_cycle where user_id = ${userId} limit 1`,
    sql`select owner_user_id from share_record where owner_user_id = ${userId} limit 1`,
    sql`select user_id from feedback where user_id = ${userId} limit 1`,
    sql`select user_id from onboarding_sessions where user_id = ${userId} limit 1`,
    sql`
      select oa.id
      from onboarding_answers oa
      join onboarding_sessions os on os.id = oa.session_id
      where os.user_id = ${userId}
      limit 1
    `,
    sql`select email from verification_codes where email = ${email} limit 1`,
  ]);

  assert(userRows.length === 0, "user row still exists after deletion");
  assert(dailyRows.length === 0, "menstrual_daily rows still exist after deletion");
  assert(eventRows.length === 0, "menstrual_event rows still exist after deletion");
  assert(cycleRows.length === 0, "menstrual_cycle rows still exist after deletion");
  assert(shareRows.length === 0, "share_record rows still exist after deletion");
  assert(feedbackRows.length === 0, "feedback rows still exist after deletion");
  assert(onboardingRows.length === 0, "onboarding_sessions rows still exist after deletion");
  assert(answerRows.length === 0, "onboarding_answers rows still exist after deletion");
  assert(codeRows.length === 0, "verification_codes rows still exist after deletion");
}

async function main() {
  log("setup", `testing ${APP_URL}`);
  await cleanupTempUser();
  await cleanupTempBrand();

  const openapi = await expectJson("/api/openapi.json");
  assert(openapi.data?.paths, "openapi document missing paths");

  const sendCode = await expectJson("/api/auth/send-code", {
    method: "POST",
    body: { email },
  });
  assert(sendCode.data?.success === true, "send-code did not succeed");

  const code = await waitForVerificationCode();
  log("auth", "verification code created");

  const verifyLogin = await expectJson("/api/auth/verify-login", {
    method: "POST",
    body: { email, code },
  });
  assert(verifyLogin.data?.success === true, "verify-login did not succeed");

  const token = verifyLogin.data?.token;
  const userId = verifyLogin.data?.user?.id;
  assert(token, "verify-login did not return a token");
  assert(userId, "verify-login did not return a user id");

  const me = await expectJson("/api/auth/me", { token });
  assert(me.data?.authenticated === true, "auth/me did not authenticate");

  const syncCookie = await expectJson("/api/auth/sync-cookie", { method: "POST", token });
  assert(syncCookie.data?.success === true, "auth/sync-cookie did not succeed");

  const profile = await expectJson("/api/user/profile", {
    method: "PATCH",
    token,
    body: {
      displayName: `E2E ${stamp}`,
      useTampon: true,
    },
  });
  assert(profile.data?.code === 200, "user/profile patch failed");

  const onboardingStart = await expectJson("/api/onboarding/v2/start", {
    method: "POST",
    token,
    body: {},
  });
  assert(onboardingStart.data?.success === true, "onboarding start failed");

  const onboardingState = await expectJson("/api/onboarding/v2/state", { token });
  assert(onboardingState.data?.success === true, "onboarding state failed");

  const onboardingAnswer = await expectJson("/api/onboarding/v2/answer", {
    method: "POST",
    token,
    body: {
      questionId: "A0_consent_research",
      answer: { type: "single", value: "agree" },
    },
  });
  assert(onboardingAnswer.data?.success === true, "onboarding answer failed");

  const onboardingPosition = await expectJson("/api/onboarding/v2/position", {
    method: "POST",
    token,
    body: {
      currentQuestionId: "B1_birth_date",
    },
  });
  assert(onboardingPosition.data?.success === true, "onboarding position failed");

  const onboardingSubmit = await expectJson("/api/onboarding/v2/submit", {
    method: "POST",
    token,
  });
  assert(onboardingSubmit.data?.success === true, "onboarding submit failed");

  const insertedBrand = await sql`
    insert into product_brands (type, name, sort)
    values ('pad', ${tempBrandName}, 9999)
    returning id
  `;
  tempBrandId = Number(insertedBrand[0].id);

  await sql`
    insert into product_series (brand_id, name, sort)
    values (${tempBrandId}, ${tempSeriesName}, 9999)
  `;

  const brands = await expectJson("/api/products/brands?type=pad", { token });
  assert(Array.isArray(brands.data?.data), "product brands did not return an array");

  const series = await expectJson(`/api/products/brands/${tempBrandId}/series`, { token });
  assert(Array.isArray(series.data?.data), "product series did not return an array");
  assert(series.data?.data?.some((item) => item.name === tempSeriesName), "product series missing inserted test data");

  const putDaily = await expectJson(`/api/menstrual/daily/${dailyDate}`, {
    method: "PUT",
    token,
    body: {
      hasBleeding: true,
      events: [
        {
          eventTime: `${dailyDate}T08:30:00.000Z`,
          eventType: "pad",
          productType: "day_pad",
          brand: "E2E",
          series: "Flow",
          color: "red",
          volumeMl: 12,
        },
        {
          eventTime: `${dailyDate}T10:00:00.000Z`,
          eventType: "symptom",
          symptomName: "小血块",
        },
      ],
    },
  });
  assert(putDaily.data?.code === 200, "daily put failed");

  const getDaily = await expectJson(`/api/menstrual/daily/${dailyDate}`, { token });
  assert(getDaily.data?.data?.hasBleeding === true, "daily get returned wrong data");

  const getRange = await expectJson(`/api/menstrual/daily?start=${dailyDate}&end=${rangeEnd}`, { token });
  assert(Array.isArray(getRange.data?.data), "daily range did not return an array");

  const overview = await expectJson("/api/analysis/overview?limit=6", { token });
  assert(overview.data?.code === 200, "analysis overview failed");

  const cycles = await expectJson("/api/analysis/cycles?page=1&pageSize=10", { token });
  assert(cycles.data?.code === 200, "analysis cycles failed");
  const firstCycleId = cycles.data?.data?.list?.[0]?.cycleId;

  if (firstCycleId) {
    const cycleDetail = await expectJson(`/api/analysis/cycles/${firstCycleId}`, { token });
    assert(cycleDetail.data?.code === 200, "analysis cycle detail failed");
  }

  const healthScore = await expectJson("/api/analysis/health-score-detail?limit=6", { token });
  assert(healthScore.data?.code === 200, "analysis health-score-detail failed");

  const shareOverview = await expectJson("/api/share", {
    method: "POST",
    token,
    body: { type: "overview", limit: 6 },
  });
  const overviewCode = shareOverview.data?.data?.shareCode;
  assert(overviewCode, "share overview did not return shareCode");

  const publicOverview = await expectJson(`/api/share/${overviewCode}`, {});
  assert(publicOverview.data?.code === 200, "public share overview failed");

  if (firstCycleId) {
    const sharePeriod = await expectJson("/api/share", {
      method: "POST",
      token,
      body: { type: "period", cycleId: firstCycleId },
    });
    const periodCode = sharePeriod.data?.data?.shareCode;
    assert(periodCode, "share period did not return shareCode");

    const publicPeriod = await expectJson(`/api/share/${periodCode}`, {});
    assert(publicPeriod.data?.code === 200, "public share period failed");
  }

  const feedback = await expectJson("/api/feedback", {
    method: "POST",
    token,
    body: {
      typeIndex: 1,
      content: `E2E feedback ${stamp}`,
      contact: email,
    },
  });
  assert(feedback.data?.code === 200, "feedback failed");

  const logout = await expectJson("/api/auth/logout", { method: "POST" });
  assert(logout.data?.success === true, "logout failed");

  const deleteAccount = await expectJson("/api/user/account", {
    method: "DELETE",
    token,
  });
  assert(deleteAccount.data?.code === 200, "delete account failed");

  const meAfterDelete = await expectJson("/api/auth/me", { token });
  assert(meAfterDelete.data?.authenticated === false, "auth/me should be false after account deletion");

  await verifyDeleted(userId);
  await cleanupTempBrand();

  const testedList = Array.from(tested).sort();
  log("done", `tested ${testedList.length} API calls`);
  for (const item of testedList) {
    console.log(`  - ${item}`);
  }
}

main()
  .catch(async (error) => {
    console.error(`[e2e] failed: ${error instanceof Error ? error.message : String(error)}`);
    try {
      await cleanupTempUser();
      await cleanupTempBrand();
    } catch (cleanupError) {
      console.error(`[e2e] cleanup failed: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
    }
    process.exit(1);
  });
