"use client";

import { useState } from "react";
import Link from "next/link";
import { useMessages } from "../../Context/MessageContext";
import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";
import LogoutButton from "../auth/LogoutButton";

export default function MessageInbox() {
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const { unreadCount = 0, loading, error, refreshInbox } = useMessages();

  return (
    <section className="w-full space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              Messages
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              REST messaging
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Communicate with your customers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">Dashboard</Link>
          <LogoutButton />
          <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            <span className="text-gray-500">Unread</span>
            <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
              {unreadCount}
            </span>
          </div>
          <button
            type="button"
            onClick={refreshInbox}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {loading ? "Refreshing..." : "Refresh inbox"}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <span>{error}</span>
          <button type="button" onClick={refreshInbox} className="font-semibold underline">
            Retry
          </button>
        </div>
      )}

      <div className="grid min-h-[680px] grid-cols-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950 md:h-[calc(100vh-220px)] md:min-h-[620px] md:grid-cols-[300px_minmax(0,1fr)] lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className={`${mobileChatOpen ? "hidden" : "flex"} min-h-[360px] min-w-0 flex-col border-b border-gray-200 dark:border-gray-800 md:min-h-0 md:border-b-0 md:border-r`}>
          <ConversationList onSelectConversation={() => setMobileChatOpen(true)} />
        </aside>
        <main className={`${mobileChatOpen ? "flex" : "hidden"} min-h-[480px] min-w-0 flex-col md:flex md:min-h-0`}>
          <button type="button" onClick={() => setMobileChatOpen(false)} className="border-b border-gray-200 bg-white px-4 py-2 text-left text-sm font-semibold text-blue-700 md:hidden">
            â† Back to conversations
          </button>
          <ChatWindow />
        </main>
      </div>
    </section>
  );
}
