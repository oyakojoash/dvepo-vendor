
"use client";

import { useMessages } from "../../Context/MessageContext";

function formatTime(dateString) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "";

  const today = new Date();

  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });
}

export default function ConversationList({ onSelectConversation }) {
  const {
    visibleConversations,
    selectedConversationId,
    selectConversation,
    filter,
    setFilter,
    search,
    setSearch,
    loading,
    error,
    hasMoreConversations,
    loadingMoreConversations,
    loadMoreConversations,
    refreshInbox,
  } = useMessages();

  const filters = [
    { label: "All", value: "all" },
    { label: "Customers", value: "customer" },
    { label: "Dvepo Admin", value: "admin" },
  ];

  return (
    <section className="flex h-full min-h-0 flex-col bg-white dark:bg-gray-950">
      <div className="border-b border-gray-200 p-4 dark:border-gray-800">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Messages
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Customer conversations
            </p>
          </div>

          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            REST inbox
          </span>
        </div>

        <label htmlFor="message-search" className="sr-only">
          Search conversations
        </label>

        <div className="relative">
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m16 16 4 4" />
          </svg>

          <input
            id="message-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search conversations..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-blue-950"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => {
            const active = filter === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                aria-pressed={active}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-sm text-gray-500">
            Loading conversations...
          </div>
        ) : error && visibleConversations.length === 0 ? (
          <div className="p-6 text-center text-sm text-red-600">
            {error}
            <button type="button" onClick={refreshInbox} className="mt-3 block w-full font-semibold underline">
              Retry loading inbox
            </button>
          </div>
        ) : visibleConversations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800">
              <svg
                aria-hidden="true"
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <path d="M21 11.5a8.5 8.5 0 0 1-12.9 7.3L3 20l1.2-4.2A8.5 8.5 0 1 1 21 11.5Z" />
              </svg>
            </div>

            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              No conversations found
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Try another search or filter.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {visibleConversations.map((conversation) => {
              const active =
                selectedConversationId === conversation.id;

              const latestMessage = conversation.lastMessage;
              const isAdmin = conversation.type === "admin";

              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => {
                      selectConversation(conversation.id);
                      onSelectConversation?.();
                    }}
                    aria-current={active ? "true" : undefined}
                    className={`flex w-full items-start gap-3 p-4 text-left transition ${
                      active
                        ? "bg-blue-50 dark:bg-blue-950/40"
                        : "hover:bg-gray-50 dark:hover:bg-gray-900"
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                        isAdmin
                          ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      }`}
                    >
                      {isAdmin
                        ? "D"
                        : conversation.participant.name
                            .split(" ")
                            .map((part) => part[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {conversation.participant.name}
                        </p>

                        <span className="shrink-0 text-[11px] text-gray-500 dark:text-gray-400">
                          {formatTime(conversation.updatedAt)}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            isAdmin
                              ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {isAdmin ? "ADMIN" : "CUSTOMER"}
                        </span>

                        {conversation.relatedProduct && (
                          <span className="truncate text-[11px] text-gray-500">
                            {conversation.relatedProduct.name}
                          </span>
                        )}
                      </div>

                      <p
                        className={`mt-1.5 truncate text-xs ${
                          conversation.unreadCount > 0
                            ? "font-semibold text-gray-800 dark:text-gray-200"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {latestMessage || "No messages yet"}
                      </p>
                    </div>

                    {conversation.unreadCount > 0 && (
                      <span
                        aria-label={`${conversation.unreadCount} unread messages`}
                        className="mt-6 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-semibold text-white"
                      >
                        {conversation.unreadCount}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {hasMoreConversations && (
          <div className="border-t border-gray-100 p-3 text-center dark:border-gray-800">
            <button
              type="button"
              onClick={loadMoreConversations}
              disabled={loadingMoreConversations}
              className="rounded-lg px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50 dark:text-blue-300 dark:hover:bg-blue-950/40"
            >
              {loadingMoreConversations ? "Loading..." : "Load more conversations"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
