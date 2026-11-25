"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useMerchantAuth } from "./MerchantAuthContext";
import { getActiveStories, storyService } from "../Services/storyService";

const StoryContext = createContext(null);

export function StoryProvider({ children }) {
  const { merchant, status: authStatus } = useMerchantAuth();
  const [stories, setStories] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState(0);

  const refreshStories = useCallback(async () => {
    if (authStatus === "loading") return;
    if (authStatus !== "authenticated" || !merchant?.id) {
      setStories([]);
      setNextCursor(null);
      setError(authStatus === "unauthenticated" ? "Sign in to view your Stories." : "");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await storyService.getMerchantStories();
      setStories(result.stories);
      setNextCursor(result.nextCursor);
      setCurrentTime(Date.now());
    } catch (loadError) {
      setError(loadError.message || "Unable to load your Stories.");
    } finally {
      setLoading(false);
    }
  }, [authStatus, merchant?.id]);

  useEffect(() => {
    const timeoutId = setTimeout(() => void refreshStories(), 0);
    return () => clearTimeout(timeoutId);
  }, [refreshStories]);

  useEffect(() => {
    const initialTick = setTimeout(() => setCurrentTime(Date.now()), 0);
    const intervalId = setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => {
      clearTimeout(initialTick);
      clearInterval(intervalId);
    };
  }, []);

  const loadMoreStories = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError("");
    try {
      const result = await storyService.getMerchantStories({ cursor: nextCursor });
      setStories((current) => {
        const existingIds = new Set(current.map((story) => story.id));
        return [...current, ...result.stories.filter((story) => !existingIds.has(story.id))];
      });
      setNextCursor(result.nextCursor);
    } catch (loadError) {
      setError(loadError.message || "Unable to load more Stories.");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextCursor]);

  const publishStory = useCallback(async ({ file, caption = "" }) => {
    if (authStatus !== "authenticated" || !merchant?.id) {
      throw new Error("Your merchant session has expired. Sign in again to publish a Story.");
    }
    const story = await storyService.publishStory(file, caption);
    setStories((current) => [story, ...current.filter((item) => item.id !== story.id)]);
    setCurrentTime(Date.now());
    setError("");
    return story;
  }, [authStatus, merchant?.id]);

  const removeStory = useCallback(async (storyId) => {
    await storyService.deleteStory(storyId);
    setStories((current) => current.filter((story) => story.id !== storyId));
  }, []);

  const recordStoryView = useCallback(async (storyId) => {
    try {
      const viewsCount = await storyService.recordStoryView(storyId);
      setStories((current) => current.map((story) =>
        story.id === storyId ? { ...story, viewsCount } : story
      ));
      return { success: true, viewsCount };
    } catch (viewError) {
      return { success: false, error: viewError.message || "Unable to record this Story view." };
    }
  }, []);

  const activeStories = useMemo(
    () => getActiveStories(stories, currentTime),
    [stories, currentTime]
  );

  const value = useMemo(() => ({
    stories,
    activeStories,
    loading,
    loadingMore,
    error,
    hasMore: Boolean(nextCursor),
    refreshStories,
    loadMoreStories,
    publishStory,
    removeStory,
    recordStoryView,
  }), [stories, activeStories, loading, loadingMore, error, nextCursor,
    refreshStories, loadMoreStories, publishStory, removeStory, recordStoryView]);

  return <StoryContext.Provider value={value}>{children}</StoryContext.Provider>;
}

export function useStories() {
  const context = useContext(StoryContext);
  if (!context) throw new Error("useStories must be used inside a StoryProvider.");
  return context;
}
