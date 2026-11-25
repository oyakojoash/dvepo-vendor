import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const serviceSource = await readFile(
  new URL("../src/app/Services/merchantSubscriptionService.js", import.meta.url),
  "utf8"
);
const serviceUrl = `data:text/javascript;base64,${Buffer.from(serviceSource).toString("base64")}`;
const { merchantSubscriptionService } = await import(serviceUrl);

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("subscription service calls only the implemented endpoints with cookie credentials", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  const pending = {
    status: "pending_payment",
    paymentId: "payment-1",
    plan: { id: "growth", priceKsh: 300, commissionRate: 0.2 },
    message: "Payment is pending.",
  };
  const responses = [
    { plans: [{ id: "free", name: "Free", priceKsh: 0, commissionRate: 0.3 }] },
    { subscription: { plan: { id: "free" }, status: "active" } },
    pending,
    pending,
    { subscription: { pendingDowngrade: { id: "free" } } },
    { subscription: { pendingDowngrade: null } },
    { subscription: { cancelAtExpiry: true } },
  ];

  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return jsonResponse(responses[calls.length - 1], calls.length === 3 || calls.length === 4 ? 202 : 200);
  };

  try {
    assert.deepEqual(await merchantSubscriptionService.getPlans(), responses[0]);
    assert.deepEqual(await merchantSubscriptionService.getSubscription(), responses[1]);
    assert.deepEqual(await merchantSubscriptionService.upgrade("growth"), pending);
    assert.deepEqual(await merchantSubscriptionService.renew(), pending);
    await merchantSubscriptionService.scheduleDowngrade("free");
    await merchantSubscriptionService.cancelDowngrade();
    await merchantSubscriptionService.cancelRenewal();

    assert.deepEqual(calls.map(({ url, options }) => [
      url.replace(/^.*\/api\/merchant\/subscription/, "/api/merchant/subscription"),
      options.method,
      options.body,
      options.credentials,
    ]), [
      ["/api/merchant/subscription/plans", "GET", undefined, "include"],
      ["/api/merchant/subscription", "GET", undefined, "include"],
      ["/api/merchant/subscription/upgrade", "POST", '{"planId":"growth"}', "include"],
      ["/api/merchant/subscription/renew", "POST", undefined, "include"],
      ["/api/merchant/subscription/downgrade", "POST", '{"planId":"free"}', "include"],
      ["/api/merchant/subscription/downgrade", "DELETE", undefined, "include"],
      ["/api/merchant/subscription/cancel-renewal", "POST", undefined, "include"],
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("subscription service reads both backend error response formats", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => jsonResponse({ error: "A service conflict" }, 409);
    await assert.rejects(
      merchantSubscriptionService.getSubscription(),
      (error) => error.status === 409 && error.message === "A service conflict"
    );

    globalThis.fetch = async () => jsonResponse({ message: "Sign in again" }, 401);
    await assert.rejects(
      merchantSubscriptionService.getPlans(),
      (error) => error.status === 401 && error.message === "Sign in again"
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
