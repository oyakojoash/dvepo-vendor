
"use client";

import { useEffect, useRef } from "react";
import { useMessages } from "../../Context/MessageContext";
import MessageComposer from "./MessageComposer";

function formatMessageTime(dateString) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMessageDate(dateString) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isSameDay(first, second) {
  return (
    new Date(first).toDateString() ===
    new Date(second).toDateString()
  );
}

export default function ChatWindow() {
  const {
    selectedConversation,
    selectedConversationId,
    vendor,
    historyLoading,
    historyError,
    hasMoreMessages,
    loadingOlderMessages,
    selectConversation,
    loadOlderMessages,
  } = useMessages();

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [selectedConversation?.messages]);

  if (historyLoading) {
    return (
      <section className="flex h-full min-h-[400px] flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-sm text-gray-500">
          Loading conversation...
        </p>
      </section>
    );
  }

  if (!selectedConversation) {
    return (
      <section className="flex h-full min-h-[400px] flex-1 flex-col items-center justify-center bg-gray-50 px-6 text-center dark:bg-gray-900">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm dark:bg-gray-800">
          <svg
            className="h-8 w-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M21 11.5a8.5 8.5 0 0 1-12.9 7.3L3 20l1.2-4.2A8.5 8.5 0 1 1 21 11.5Z" />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Your messages
        </h3>

        <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          Select a conversation from the inbox to read messages and reply.
        </p>
      </section>
    );
  }

  const isAdmin = selectedConversation.type === "admin";

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col bg-gray-50 dark:bg-gray-900">
      {/* Conversation header */}
      <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950 sm:px-6">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
            isAdmin
              ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
              : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
          }`}
        >
          {isAdmin
            ? "D"
            : selectedConversation.participant.name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            {selectedConversation.participant.name}
          </h2>

          <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
            {isAdmin
              ? "Dvepo Administration"
              : "Customer"}
            {selectedConversation.relatedProduct
              ? ` · ${selectedConversation.relatedProduct.name}`
              : ""}
          </p>
        </div>

        <span
          className={`hidden rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex ${
            isAdmin
              ? "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
              : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
          }`}
        >
          {isAdmin ? "Admin conversation" : "Customer conversation"}
        </span>
      </header>

      {/* Message history */}
      <div
        className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-6"
        aria-label="Message history"
        aria-live="polite"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          {selectedConversation.subject && (
            <div className="mx-auto mb-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {selectedConversation.subject}
            </div>
          )}

          {historyError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              <p>{historyError}</p>
              <button type="button" onClick={() => selectConversation(selectedConversationId)} className="mt-2 font-semibold underline">
                Retry loading messages
              </button>
            </div>
          )}

          {hasMoreMessages && (
            <div className="text-center">
              <button
                type="button"
                onClick={loadOlderMessages}
                disabled={loadingOlderMessages}
                className="rounded-lg px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50 dark:text-blue-300 dark:hover:bg-blue-950/40"
              >
                {loadingOlderMessages ? "Loading older messages..." : "Load older messages"}
              </button>
            </div>
          )}

          {!historyError && (selectedConversation.messages || []).length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500">No messages in this conversation yet.</p>
          )}

          {(selectedConversation.messages || []).map((message, index, list) => {
            const isVendor = message.senderRole === "vendor";
            const previousMessage = list[index - 1];

            const showDate =
              !previousMessage ||
              !isSameDay(
                previousMessage.createdAt,
                message.createdAt
              );

            const senderName = isVendor
              ? vendor?.name || "Your Store"
              : message.senderRole === "admin"
                ? "Dvepo Administration"
                : selectedConversation.participant.name;

            return (
              <div key={message.id}>
                {showDate && (
                  <div className="my-3 flex justify-center">
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] text-gray-500 shadow-sm dark:bg-gray-800 dark:text-gray-400">
                      {formatMessageDate(message.createdAt)}
                    </span>
                  </div>
                )}

                <div
                  className={`flex ${
                    isVendor ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex max-w-[88%] flex-col sm:max-w-[75%] ${
                      isVendor ? "items-end" : "items-start"
                    }`}
                  >
                    {!isVendor && (
                      <span className="mb-1 px-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                        {senderName}
                      </span>
                    )}

                    <div
                      className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                        isVendor
                          ? "rounded-br-md bg-blue-600 text-white"
                          : "rounded-bl-md border border-gray-200 bg-white text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm leading-6">
                        {message.text}
                      </p>
                    </div>

                    <div className="mt-1 flex items-center gap-1.5 px-1">
                      <span className="text-[10px] text-gray-400">
                        {formatMessageTime(message.createdAt)}
                      </span>

                      {isVendor && (
                        <span
                          className="text-[10px] text-gray-400"
                          title={message.read ? "Read by the customer" : "Not marked read yet"}
                        >
                          {message.read ? "Read" : "Sent"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message composer */}
      <MessageComposer />
    </section>
  );
}
