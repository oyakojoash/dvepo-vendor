"use client";
/* eslint @next/next/no-img-element: off -- Story media can be user-uploaded data URLs or video posters. */

import { useState } from "react";

export default function StoryViewer({
  stories = [],
  initialStoryId = null,
  onClose,
  onDelete,
  onView,
  initialError = "",
}) {
  const [currentIndex, setCurrentIndex] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!stories.length) return null;

  const requestedIndex = stories.findIndex(
    (item) => item.id === initialStoryId
  );

  const safeIndex =
    currentIndex === null
      ? Math.max(0, requestedIndex)
      : Math.min(Math.max(0, currentIndex), stories.length - 1);

  const story = stories[safeIndex];

  const openAt = async (index) => {
    setError("");
    setCurrentIndex(index);
    const result = await onView?.(stories[index].id);
    if (result && !result.success) setError(result.error || "This Story could not be opened.");
  };

  const goPrevious = () => {
    if (safeIndex > 0) void openAt(safeIndex - 1);
  };

  const goNext = () => {
    if (safeIndex >= stories.length - 1) {
      onClose?.();
      return;
    }

    void openAt(safeIndex + 1);
  };

  const handleDelete = async () => {
    setBusy(true);
    setError("");
    try {
      await onDelete?.(story.id);
      onClose?.();
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete this Story. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const createdAt = story.createdAt ? new Date(story.createdAt) : null;
  const expiresAt = story.expiresAt ? new Date(story.expiresAt) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Story viewer"
      onClick={onClose}
    >
      <div
        className="relative flex h-[85vh] max-h-[850px] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-black shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute left-3 right-3 top-3 z-20 flex gap-1">
          {stories.map((item, index) => (
            <div
              key={item.id}
              className="h-1 flex-1 overflow-hidden rounded-full bg-white/40"
            >
              <div
                className={`h-full rounded-full ${
                  index <= safeIndex ? "bg-white" : "bg-transparent"
                }`}
              />
            </div>
          ))}
        </div>

        <div className="absolute left-4 right-4 top-7 z-20 flex items-center justify-between">
          <span className="text-sm font-medium text-white">
            Your Story
          </span>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close Story viewer"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-2xl text-white hover:bg-black/70"
          >
            ×
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center">
          {story.mediaType === "video" ? (
            <video
              key={story.id}
              src={story.mediaUrl}
              controls
              autoPlay
              playsInline
              className="h-full w-full object-contain"
            />
          ) : (
            <img
              src={story.mediaUrl}
              alt={story.caption || "Merchant Story"}
              className="h-full w-full object-contain"
            />
          )}

          {safeIndex > 0 && (
            <button
              type="button"
              onClick={goPrevious}
              disabled={busy}
              aria-label="Previous Story"
              className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-2xl text-white hover:bg-black/60"
            >
              ‹
            </button>
          )}

          <button
            type="button"
            onClick={goNext}
            disabled={busy}
            aria-label="Next Story"
            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-2xl text-white hover:bg-black/60"
          >
            ›
          </button>
        </div>

        <div className="z-10 flex items-end justify-between gap-3 bg-gradient-to-t from-black via-black/80 to-transparent px-4 pb-5 pt-8">
          <div className="min-w-0 flex-1">
            <p className="break-words text-sm text-white">{story.caption || ""}</p>
            <p className="mt-1 text-xs text-white/75">
              {typeof story.viewsCount === "number" ? `${story.viewsCount} views` : "Views unavailable"}
              {createdAt && Number.isFinite(createdAt.getTime()) ? ` · Published ${createdAt.toLocaleString()}` : ""}
              {expiresAt && Number.isFinite(expiresAt.getTime()) ? ` · Expires ${expiresAt.toLocaleString()}` : ""}
            </p>
          </div>

          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="shrink-0 rounded-lg border border-red-400/60 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20"
            >
              Delete
            </button>
          )}
        </div>
        {(error || initialError) && <p role="alert" className="absolute bottom-20 left-4 right-4 rounded-lg bg-red-950/90 p-3 text-sm text-white">{error || initialError}</p>}
      </div>
    </div>
  );
}
