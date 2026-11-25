const STORAGE_KEY = "dvepo-monetization-demo-records-v1";

function readRecords() {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRecord(record) {
  const records = readRecords();
  const existing = records.find((item) => item.idempotencyKey === record.idempotencyKey);
  if (existing) return existing;

  const next = [record, ...records];
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    throw new Error("This browser could not save the demo record. No payment was made.");
  }
  return record;
}

// Demo-only boundary: this records a pending request locally and never charges,
// verifies payment, reserves a placement, or activates a campaign. Replace it
// with an authenticated server order API plus provider-side verification.
export const monetizationService = {
  listDemoRecords() {
    return readRecords();
  },

  createAdvertisingRequest(details) {
    if (!details?.idempotencyKey || !details.packageId || !details.amount) {
      throw new Error("Complete the advertising selections before continuing.");
    }

    return writeRecord({
      id: `demo-order-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      idempotencyKey: details.idempotencyKey,
      type: "advertising",
      createdAt: new Date().toISOString(),
      amount: details.amount,
      packageId: details.packageId,
      description: details.description,
      lineItems: details.lineItems,
      paymentStatus: "Not processed",
      campaignStatus: "Pending Payment",
      targetLabel: details.targetLabel || "",
      placementGroup: details.placementGroup || "",
      proposedStartDate: details.proposedStartDate || "",
      proposedEndDate: details.proposedEndDate || "",
      demo: true,
    });
  },

  createSubscriptionRequest(plan, idempotencyKey) {
    if (!plan?.id || !plan?.monthlyPrice) {
      throw new Error("Choose a commission plan before continuing.");
    }

    if (!idempotencyKey) {
      throw new Error("Review the plan request before continuing.");
    }
    return writeRecord({
      id: `demo-subscription-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      idempotencyKey,
      type: "subscription",
      createdAt: new Date().toISOString(),
      amount: plan.monthlyPrice,
      planId: plan.id,
      description: `${plan.rate}% commission plan request`,
      paymentStatus: "Not processed",
      subscriptionStatus: "Pending Payment",
      demo: true,
    });
  },
};

