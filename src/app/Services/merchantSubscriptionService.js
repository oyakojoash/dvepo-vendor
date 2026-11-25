const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const SUBSCRIPTION_URL = `${API_BASE_URL}/api/merchant/subscription`;

export class MerchantSubscriptionApiError extends Error {
  constructor(message, status = 0, body = {}) {
    super(message);
    this.name = "MerchantSubscriptionApiError";
    this.status = status;
    this.body = body;
  }
}

async function request(path = "", { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(`${SUBSCRIPTION_URL}${path}`, {
      method,
      credentials: "include",
      cache: "no-store",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    throw new MerchantSubscriptionApiError(
      cause?.message || "Could not reach the subscription service. Check the connection and try again."
    );
  }

  let payload = {};
  try {
    const text = await response.text();
    payload = text ? JSON.parse(text) : {};
  } catch {
    // Fall back to the HTTP status when the response is not valid JSON.
  }

  if (!response.ok) {
    const fallback = response.status === 401
      ? "Your merchant session has expired. Sign in again."
      : `The subscription request could not be completed (HTTP ${response.status}).`;
    throw new MerchantSubscriptionApiError(
      payload.message || payload.error || fallback,
      response.status,
      payload
    );
  }

  return payload;
}

export const merchantSubscriptionService = {
  getPlans() {
    return request("/plans");
  },
  getSubscription() {
    return request();
  },
  upgrade(planId) {
    return request("/upgrade", { method: "POST", body: { planId } });
  },
  renew() {
    return request("/renew", { method: "POST" });
  },
  scheduleDowngrade(planId) {
    return request("/downgrade", { method: "POST", body: { planId } });
  },
  cancelDowngrade() {
    return request("/downgrade", { method: "DELETE" });
  },
  cancelRenewal() {
    return request("/cancel-renewal", { method: "POST" });
  },
};
