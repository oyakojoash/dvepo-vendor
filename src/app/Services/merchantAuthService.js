const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export class MerchantAuthError extends Error {
  constructor(message, status = 0, body = {}) {
    super(message);
    this.name = "MerchantAuthError";
    this.status = status;
    this.body = body;
  }
}

async function request(path, { method = "GET", body, signal } = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/merchant-auth${path}`, {
      method,
      credentials: "include",
      cache: "no-store",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: signal || AbortSignal.timeout(10000),
    });
  } catch (error) {
    const message = error?.name === "TimeoutError"
      ? "The authentication service took too long to respond. Please try again."
      : "Could not reach the authentication service. Check that it is running and try again.";
    throw new MerchantAuthError(message);
  }

  let payload = {};
  try {
    const text = await response.text();
    payload = text ? JSON.parse(text) : {};
  } catch {
    // Non-JSON or malformed responses are handled using status-based messages.
  }

  if (!response.ok) {
    let message;
    if (response.status === 401) {
      message = path === "/login" ? "Invalid email/phone or password." : "Your merchant session has expired. Sign in again.";
    } else if (response.status === 409) {
      message = "An account with this email or phone number already exists.";
    } else if (response.status === 400) {
      message = payload.message && payload.message !== "Invalid request"
        ? payload.message
        : "Check the information entered and try again.";
    } else if (response.status >= 500) {
      message = "The authentication service is temporarily unavailable. Please try again.";
    } else if (payload.message && response.status < 500) {
      message = payload.message;
    } else {
      message = `The request could not be completed (HTTP ${response.status}).`;
    }
    throw new MerchantAuthError(message, response.status, payload);
  }

  return payload;
}

function safeMerchant(payload) {
  const merchant = payload?.merchant;
  if (!merchant || typeof merchant !== "object") {
    throw new MerchantAuthError("The server returned an invalid merchant profile.");
  }

  // Allow only the safe profile fields returned by the merchant auth API.
  return {
    id: typeof merchant.id === "string" ? merchant.id : "",
    name: typeof merchant.name === "string" ? merchant.name : "",
    email: typeof merchant.email === "string" ? merchant.email : "",
    phone: typeof merchant.phone === "string" ? merchant.phone : "",
    profileImage: typeof merchant.profileImage === "string" ? merchant.profileImage : "",
    verification: merchant.verification && typeof merchant.verification === "object"
      ? merchant.verification
      : { status: "not_configured", verified: false },
    createdAt: typeof merchant.createdAt === "string" ? merchant.createdAt : null,
    updatedAt: typeof merchant.updatedAt === "string" ? merchant.updatedAt : null,
  };
}

export const merchantAuthService = {
  async register({ name, email, phone, password }) {
    const payload = await request("/register", {
      method: "POST",
      body: { name, email, phone, password },
    });
    return safeMerchant(payload);
  },

  async login({ identifier, password }) {
    const payload = await request("/login", {
      method: "POST",
      body: { identifier, password },
    });
    return safeMerchant(payload);
  },

  async getCurrentMerchant() {
    const payload = await request("/me");
    return safeMerchant(payload);
  },

  async updateProfile(profile) {
    const payload = await request("/profile", { method: "PUT", body: profile });
    return safeMerchant(payload);
  },

  async changePassword({ currentPassword, newPassword }) {
    return request("/change-password", { method: "PUT", body: { currentPassword, newPassword } });
  },

  async uploadProfileImage(file) {
    const form = new FormData();
    form.append("image", file);
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/api/images/upload`, {
        method: "POST", credentials: "include", cache: "no-store", body: form,
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new MerchantAuthError("Could not reach the image service. Please try again.");
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.reference) {
      throw new MerchantAuthError(payload.message || "Profile image upload failed.", response.status, payload);
    }
    return payload.reference;
  },

  async logout() {
    await request("/logout", { method: "POST", body: {} });
  },
};

export function isUnauthenticatedError(error) {
  return error instanceof MerchantAuthError && error.status === 401;
}
