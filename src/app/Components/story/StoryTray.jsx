"use client";
/* eslint @next/next/no-img-element: off -- Stories can include remote media URLs. */

import { useStories } from "../../Context/StoryContext";

export default function StoryTray({
  onOpenStory,
  onCreateStory,
}) {
  const { activeStories } = useStories();

  return (
    <section className="w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Your Stories
          </h2>
          <p className="text-sm text-gray-500">
            Share updates with your customers
          </p>
        </div>

        <span className="text-sm text-gray-500">
          {activeStories.length} active
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {/* Create Story */}
        <button
          type="button"
          onClick={onCreateStory}
          className="flex w-20 shrink-0 flex-col items-center gap-2 text-center"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-blue-500 bg-blue-50 text-3xl font-light text-blue-600">
            +
          </span>
          <span className="text-xs font-medium text-gray-700">
            Add Story
          </span>
        </button>

        {/* Existing Stories */}
        {activeStories.map((story) => (
          <button
            key={story.id}
            type="button"
            onClick={() => onOpenStory?.(story)}
            className="flex w-20 shrink-0 flex-col items-center gap-2 text-center"
            title={story.caption || "View Story"}
          >
            <span className="relative block h-16 w-16 rounded-full bg-gradient-to-tr from-orange-400 via-pink-500 to-purple-600 p-[3px]">
              <span className="block h-full w-full overflow-hidden rounded-full border-2 border-white bg-gray-100">
                {story.mediaType === "video" ? (
                  <span className="flex h-full w-full items-center justify-center text-xl text-gray-700">
                    ▶
                  </span>
                ) : (
                  <img
                    src={story.mediaUrl}
                    alt={story.caption || "Merchant Story"}
                    className="h-full w-full object-cover"
                  />
                )}
              </span>

              {story.mediaType === "video" && (
                <span className="absolute bottom-0 right-0 rounded-full bg-black px-1 text-[10px] text-white">
                  ▶
                </span>
              )}
            </span>

            <span className="w-full truncate text-xs text-gray-700">
              {story.caption || "Story"}
            </span>
            <span className="w-full truncate text-[10px] text-gray-500">
              {typeof story.viewsCount === "number" ? `${story.viewsCount} views` : "Views unavailable"}
            </span>
          </button>
        ))}

        {activeStories.length === 0 && (
          <p className="self-center text-sm text-gray-500">
            No active Stories yet. Add one to get started.
          </p>
        )}
      </div>
    </section>
  );
}
