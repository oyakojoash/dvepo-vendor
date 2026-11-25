
"use client";

import { useState } from "react";
import { useMessages } from "../../Context/MessageContext";

export default function MessageComposer() {
  const { sendMessage, sending, selectedConversation, error } =
    useMessages();

  const [text, setText] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const message = text.trim();

    if (!message || sending || !selectedConversation) {
      return;
    }

    const sent = await sendMessage(message);

    if (sent) {
      setText("");
    }
  }

  function handleKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-200 bg-white p-3 sm:p-4 dark:border-gray-800 dark:bg-gray-950"
    >
      {error && (
        <p role="alert" className="mb-2 text-xs text-red-600">
          {error}
        </p>
      )}

      <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2 transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:focus-within:ring-blue-950">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            selectedConversation
              ? "Write a message..."
              : "Select a conversation first"
          }
          aria-label="Write a message"
          disabled={!selectedConversation || sending}
          maxLength={2000}
          rows={1}
          className="max-h-36 min-h-10 flex-1 resize-y bg-transparent px-2 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:text-white"
        />

        <button
          type="submit"
          disabled={!text.trim() || sending || !selectedConversation}
          className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="3"
                  opacity="0.25"
                />
                <path
                  d="M21 12a9 9 0 0 0-9-9"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              Sending
            </>
          ) : (
            <>
              <span>Send</span>
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </>
          )}
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 px-1">
        <p className="text-[11px] text-gray-500">
          Enter to send, Shift + Enter for a new line
        </p>

        <span className="shrink-0 text-[11px] text-gray-400">
          {text.length}/2000
        </span>
      </div>
    </form>
  );
}
