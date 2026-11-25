"use client";
/* eslint @next/next/no-img-element: off -- uploaded Story previews use object URLs. */

import { useEffect, useMemo, useState } from "react";
import { useStories } from "../../Context/StoryContext";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);
const MB = 1024 * 1024;

export default function StoryComposer({ onClose }) {
  const { publishStory } = useStories();
  const [mediaFile, setMediaFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [videoDuration, setVideoDuration] = useState(null);

  const previewUrl = useMemo(() => mediaFile ? URL.createObjectURL(mediaFile) : "", [mediaFile]);
  useEffect(() => {
    if (!previewUrl) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setError("");
    setVideoDuration(null);
    if (!file) {
      setMediaFile(null);
      return;
    }

    if (IMAGE_TYPES.has(file.type)) {
      if (file.size > 5 * MB) {
        setMediaFile(null);
        setError("Choose an image no larger than 5 MB.");
        return;
      }
    } else if (VIDEO_TYPES.has(file.type)) {
      if (file.size > 50 * MB) {
        setMediaFile(null);
        setError("Choose a video no larger than 50 MB.");
        return;
      }
    } else {
      setMediaFile(null);
      setError("Choose a JPEG, PNG, WebP, or GIF image, or an MP4 or WebM video.");
      return;
    }
    setMediaFile(file);
  }

  function handleVideoMetadata(event) {
    const duration = event.currentTarget.duration;
    if (!Number.isFinite(duration)) {
      setMediaFile(null);
      setError("The video duration could not be read. Choose another video.");
    } else if (duration > 60) {
      setMediaFile(null);
      setError("Choose a video that is 60 seconds or shorter.");
    } else {
      setVideoDuration(duration);
    }
  }

  async function handlePublish(event) {
    event.preventDefault();
    setError("");
    if (!mediaFile) {
      setError("Choose an image or video before publishing.");
      return;
    }
    if (VIDEO_TYPES.has(mediaFile.type) && videoDuration === null) {
      setError("Wait for the video preview to finish checking its duration.");
      return;
    }
    setIsPublishing(true);
    try {
      await publishStory({ file: mediaFile, caption });
      setMediaFile(null);
      setCaption("");
      onClose?.();
    } catch (publishError) {
      setError(publishError.message || "Unable to publish the Story. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  }

  const isVideo = mediaFile && VIDEO_TYPES.has(mediaFile.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="story-composer-title" onClick={() => { if (!isPublishing) onClose?.(); }}>
      <form onSubmit={handlePublish} onClick={(event) => event.stopPropagation()} className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-lg space-y-5 overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div><h2 id="story-composer-title" className="text-xl font-semibold text-gray-900">Create a Story</h2><p className="mt-1 text-sm text-gray-500">Share a photo or video with your customers.</p></div>
          <button type="button" onClick={onClose} disabled={isPublishing} aria-label="Close Story composer" className="rounded-lg px-3 py-1 text-2xl text-gray-500 hover:bg-gray-100">×</button>
        </div>

        <div>
          <label htmlFor="story-media" className="mb-2 block text-sm font-medium text-gray-700">Select photo or video</label>
          <input id="story-media" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" onChange={handleFileChange} disabled={isPublishing} className="block w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-medium file:text-blue-700" />
          <p className="mt-1 text-xs text-gray-500">Images up to 5 MB. MP4 or WebM videos up to 50 MB and 60 seconds.</p>
        </div>

        {previewUrl && <div className="overflow-hidden rounded-xl bg-gray-950">{isVideo ? <video src={previewUrl} controls playsInline onLoadedMetadata={handleVideoMetadata} onError={() => { setMediaFile(null); setError("The selected video could not be previewed."); }} className="max-h-80 w-full object-contain" /> : <img src={previewUrl} alt="Story preview" className="max-h-80 w-full object-contain" />}</div>}

        <div>
          <label htmlFor="story-caption" className="mb-2 block text-sm font-medium text-gray-700">Caption (optional)</label>
          <textarea id="story-caption" value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={250} rows={3} placeholder="Write something about your Story..." className="w-full resize-y rounded-lg border border-gray-300 p-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          <p className="mt-1 text-right text-xs text-gray-500">{caption.length}/250</p>
        </div>

        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={isPublishing} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={!mediaFile || isPublishing || (isVideo && videoDuration === null)} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{isPublishing ? "Uploading..." : "Publish Story"}</button>
        </div>
      </form>
    </div>
  );
}
