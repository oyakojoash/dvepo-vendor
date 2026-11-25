const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");

export function settingsImageUrl(value) {
  if (typeof value !== "string" || !value.startsWith("/api/images/")) return value || "";
  return `${API_BASE_URL}${value}`;
}

function storedImageReference(value) {
  if (typeof value !== "string") return value;
  const prefix = `${API_BASE_URL}/api/images/`;
  if (value.startsWith(prefix)) return value.slice(API_BASE_URL.length);
  return value;
}

export const emptySettings = () => ({
  store: { name: "", description: "", category: "", productType: "", location: "", address: "", email: "", phone: "", visible: true, open: true, logo: "", banner: "" },
  delivery: { enabled: true, areas: "", charge: 0, estimate: "", pickup: false, processing: "", instructions: "" },
  payments: { methods: "", instructions: "", receivingDetails: "" },
  notifications: { orders: true, orderUpdates: true, messages: true, paymentReminders: true, lowStock: false, announcements: true },
  privacy: { profileVisible: true, analytics: false },
  policies: { returns: "", cancellations: "", delivery: "", terms: "", supportEmail: "" },
});

async function request(method, body) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/merchant/settings`, {
      method, credentials: "include", cache: "no-store",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10000),
    });
  } catch (cause) {
    const error = new Error(cause?.name === "TimeoutError" ? "The settings service took too long to respond. Try again." : "Could not reach the settings service. Check that it is running and try again.");
    error.cause = cause;
    throw error;
  }
  let payload = {};
  try { payload = await response.json(); } catch { /* Report a useful status message below. */ }
  if (!response.ok) {
    const error = new Error(payload.message || (response.status === 401 ? "Your merchant session has expired. Sign in again." : "Could not save these settings."));
    error.status = response.status;
    throw error;
  }
  return payload;
}

export const settingsService = {
  async getSettings() {
    const payload = await request("GET");
    const result = { ...emptySettings(), ...payload.settings };
    if (Array.isArray(result.delivery.areas)) result.delivery.areas = result.delivery.areas.join(", ");
    result.store.logo = settingsImageUrl(result.store.logo);
    result.store.banner = settingsImageUrl(result.store.banner);
    return { settings: result, storeAvailable: payload.storeAvailable, staff: payload.staff };
  },
  async saveSettings(section, value) {
    const settings = { ...value };
    if (section === "delivery") settings.areas = String(settings.areas || "").split(",").map((area) => area.trim()).filter(Boolean);
    if (section === "store") {
      settings.logo = storedImageReference(settings.logo);
      settings.banner = storedImageReference(settings.banner);
    }
    const payload = await request("PUT", { section, settings });
    const result = payload.settings;
    if (section === "delivery" && Array.isArray(result.areas)) result.areas = result.areas.join(", ");
    if (section === "store") {
      result.logo = settingsImageUrl(result.logo);
      result.banner = settingsImageUrl(result.banner);
    }
    return result;
  },
};
