const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export class StoryApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "StoryApiError";
    this.status = status;
  }
}

async function request(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/stories${path}`, {
      method,
      credentials: "include",
      cache: "no-store",
      ...(body ? { body } : {}),
    });
  } catch {
    throw new StoryApiError("Could not reach the Stories service. Check that the backend is running and try again.");
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const fallback = response.status === 401
      ? "Your merchant session has expired. Sign in again."
      : response.status === 404
        ? "This Story could not be found. It may have expired or been deleted."
        : response.status >= 500
          ? "The Stories service is temporarily unavailable. Please try again."
          : `The Story request could not be completed (HTTP ${response.status}).`;
    throw new StoryApiError(payload.message || payload.error || fallback, response.status);
  }
  return payload;
}

export function isStoryActive(story, now = Date.now()) {
  const expiresAt = new Date(story?.expiresAt || "").getTime();
  return Number.isFinite(expiresAt) && expiresAt > now;
}

export function getActiveStories(stories = [], now = Date.now()) {
  return stories.filter((story) => isStoryActive(story, now));
}

export const storyService = {
  async getMerchantStories({ limit = 20, cursor } = {}) {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set("cursor", cursor);
    const payload = await request(`/my?${params}`);
    if (!Array.isArray(payload.stories)) {
      throw new StoryApiError("The Stories service returned an invalid story list.");
    }
    return { stories: payload.stories, nextCursor: payload.nextCursor || null };
  },

  async publishStory(file, caption = "") {
    const body = new FormData();
    body.append("media", file);
    body.append("caption", caption);
    const payload = await request("", { method: "POST", body });
    if (!payload.story) throw new StoryApiError("The Stories service did not return the published Story.");
    return payload.story;
  },

  async deleteStory(storyId) {
    await request(`/${encodeURIComponent(storyId)}`, { method: "DELETE" });
  },

  async recordStoryView(storyId) {
    const payload = await request(`/${encodeURIComponent(storyId)}/views`, { method: "POST" });
    if (typeof payload.viewsCount !== "number") {
      throw new StoryApiError("The Stories service did not return the updated view count.");
    }
    return payload.viewsCount;
  },
};
