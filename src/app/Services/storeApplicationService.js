const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export class StoreApplicationError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "StoreApplicationError";
    this.status = status;
  }
}

export async function submitStoreApplication(form) {
  // Build an explicit allowlisted payload. Merchant and Vendor IDs are never
  // accepted from the form or sent by this client.
  const body = {
    name: form.name.trim(),
    logo: form.logo.trim(),
    description: form.description.trim(),
  };
  for (const field of ["businessName", "contactEmail", "contactPhone", "address"]) {
    const value = form[field]?.trim();
    if (value) body[field] = value;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/merchant/store`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    const message = error?.name === "TimeoutError"
      ? "The store application service took too long to respond. Please try again."
      : "Could not reach the store application service. Check your connection and try again.";
    throw new StoreApplicationError(message);
  }

  let payload = {};
  try {
    const text = await response.text();
    payload = text ? JSON.parse(text) : {};
  } catch {
    // Status-specific messages below remain useful if the server body is not JSON.
  }

  if (response.status === 401) {
    throw new StoreApplicationError("Your merchant session has expired. Sign in again to submit your application.", 401);
  }
  if (response.status === 409) {
    throw new StoreApplicationError("A store is already associated with this account or an application is being processed. Please wait or contact Dvepo support; do not submit another application.", 409);
  }
  if (!response.ok) {
    throw new StoreApplicationError(
      payload.message || (response.status >= 500
        ? "The store application service is temporarily unavailable. Please try again later."
        : `The application could not be submitted (HTTP ${response.status}).`),
      response.status,
    );
  }
  if (response.status !== 201) {
    throw new StoreApplicationError("The service returned an unexpected response. Please contact Dvepo support.", response.status);
  }
  return payload;
}
