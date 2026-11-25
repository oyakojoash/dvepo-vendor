
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMerchantAuth } from "./MerchantAuthContext";
import {
  getConversation,
  getConversationMessages,
  getConversations,
  getUnreadCount,
  markConversationAsRead,
  sendMessage as sendMessageService,
} from "../Services/messageService";

const MessageContext = createContext(null);
const PAGE_SIZE = 30;

function createClientMessageId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID().replace(/-/g, "");
  }

  if (globalThis.crypto?.getRandomValues) {
    return Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)))
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
  }

  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 18)}`;
}

function mergeMessages(existing, incoming) {
  const byId = new Map(existing.map((message) => [message.id, message]));

  for (const message of incoming) {
    byId.set(message.id, message);
  }

  return [...byId.values()].sort(
    (first, second) =>
      new Date(first.createdAt) - new Date(second.createdAt) ||
      first.id.localeCompare(second.id)
  );
}

export function MessageProvider({ children }) {
  const { merchant } = useMerchantAuth();
  const vendor = merchant ? { id: merchant.id, name: merchant.name } : null;

  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMoreConversations, setLoadingMoreConversations] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversationCursor, setConversationCursor] = useState(null);
  const [hasMoreConversations, setHasMoreConversations] = useState(false);
  const [messageCursor, setMessageCursor] = useState(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);

  const pendingSendIds = useRef(new Map());
  const activeSelection = useRef(0);

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (item) => item.id === selectedConversationId
      ) ?? null,
    [conversations, selectedConversationId]
  );

  const updateUnreadCount = useCallback(async () => {
    setUnreadCount(await getUnreadCount());
  }, []);

  // Select and load a conversation.
  const selectConversation = useCallback(async (conversationId) => {
    const selectionVersion = ++activeSelection.current;

    setSelectedConversationId(conversationId);
    setHistoryLoading(true);
    setLoadingOlderMessages(false);
    setHistoryError("");
    setMessageCursor(null);
    setHasMoreMessages(false);

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, messages: [] }
          : conversation
      )
    );

    try {
      await markConversationAsRead(conversationId);

      if (selectionVersion !== activeSelection.current) return null;

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, unreadCount: 0 }
            : conversation
        )
      );

      try {
        await updateUnreadCount();
      } catch {
        // Keep the opened conversation usable if only the total-count request failed.
      }

      if (selectionVersion !== activeSelection.current) return null;

      const page = await getConversationMessages(conversationId, {
        limit: PAGE_SIZE,
      });

      if (selectionVersion !== activeSelection.current) return null;

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, messages: page.messages }
            : conversation
        )
      );

      setMessageCursor(page.nextCursor);
      setHasMoreMessages(page.hasMore);

      return page.messages;
    } catch (err) {
      if (selectionVersion === activeSelection.current) {
        setHistoryError(
          err.message || "Unable to load this conversation."
        );
      }

      return null;
    } finally {
      if (selectionVersion === activeSelection.current) {
        setHistoryLoading(false);
      }
    }
  }, [updateUnreadCount]);

  // Refresh inbox. Declared after selectConversation to avoid
  // referencing it before initialization.
  const refreshInbox = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [page, totalUnread] = await Promise.all([
        getConversations({ limit: PAGE_SIZE }),
        getUnreadCount(),
      ]);

      setConversations((current) =>
        page.conversations.map((conversation) => {
          const existing = current.find(
            (item) => item.id === conversation.id
          );

          return existing
            ? { ...conversation, messages: existing.messages }
            : conversation;
        })
      );

      setConversationCursor(page.nextCursor);
      setHasMoreConversations(page.hasMore);
      setUnreadCount(totalUnread);

      if (selectedConversationId) {
        await selectConversation(selectedConversationId);
      }

      return page.conversations;
    } catch (err) {
      setError(err.message || "Unable to load messages.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedConversationId, selectConversation]);

  // Load additional conversations.
  const loadMoreConversations = useCallback(async () => {
    if (
      !hasMoreConversations ||
      !conversationCursor ||
      loadingMoreConversations
    ) {
      return;
    }

    setLoadingMoreConversations(true);
    setError("");

    try {
      const page = await getConversations({
        limit: PAGE_SIZE,
        before: conversationCursor,
      });

      setConversations((current) => {
        const byId = new Map(
          current.map((conversation) => [conversation.id, conversation])
        );

        for (const conversation of page.conversations) {
          byId.set(conversation.id, {
            ...byId.get(conversation.id),
            ...conversation,
          });
        }

        return [...byId.values()].sort(
          (first, second) =>
            new Date(second.updatedAt) - new Date(first.updatedAt) ||
            second.id.localeCompare(first.id)
        );
      });

      setConversationCursor(page.nextCursor);
      setHasMoreConversations(page.hasMore);
    } catch (err) {
      setError(err.message || "Unable to load more conversations.");
    } finally {
      setLoadingMoreConversations(false);
    }
  }, [
    conversationCursor,
    hasMoreConversations,
    loadingMoreConversations,
  ]);

  // Load older messages in the selected conversation.
  const loadOlderMessages = useCallback(async () => {
    if (
      !selectedConversationId ||
      !hasMoreMessages ||
      !messageCursor ||
      loadingOlderMessages
    ) {
      return;
    }

    const selectionVersion = activeSelection.current;
    const conversationId = selectedConversationId;

    setLoadingOlderMessages(true);
    setHistoryError("");

    try {
      const page = await getConversationMessages(conversationId, {
        limit: PAGE_SIZE,
        before: messageCursor,
      });

      if (selectionVersion !== activeSelection.current) return;

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                messages: mergeMessages(
                  conversation.messages || [],
                  page.messages
                ),
              }
            : conversation
        )
      );

      setMessageCursor(page.nextCursor);
      setHasMoreMessages(page.hasMore);
    } catch (err) {
      if (selectionVersion === activeSelection.current) {
        setHistoryError(
          err.message || "Unable to load older messages."
        );
      }
    } finally {
      if (selectionVersion === activeSelection.current) {
        setLoadingOlderMessages(false);
      }
    }
  }, [
    hasMoreMessages,
    loadingOlderMessages,
    messageCursor,
    selectedConversationId,
  ]);

  // Send a message with retry-safe client message IDs.
  const sendMessage = useCallback(async (text) => {
    if (!selectedConversationId) {
      setError("Select a conversation first.");
      return false;
    }

    const normalizedText = String(text ?? "").trim();

    if (!normalizedText) return false;

    const pendingKey = `${selectedConversationId}\u0000${normalizedText}`;

    let clientMessageId = pendingSendIds.current.get(pendingKey);

    if (!clientMessageId) {
      clientMessageId = createClientMessageId();
      pendingSendIds.current.set(pendingKey, clientMessageId);
    }

    try {
      setSending(true);
      setError("");

      const result = await sendMessageService(
        selectedConversationId,
        normalizedText,
        clientMessageId
      );

      pendingSendIds.current.delete(pendingKey);

      const summary = result.idempotentReplay
        ? await getConversation(selectedConversationId).catch(() => null)
        : null;

      setConversations((current) =>
        current
          .map((conversation) => {
            if (conversation.id !== selectedConversationId) {
              return conversation;
            }

            return {
              ...conversation,
              ...(summary ||
                (!result.idempotentReplay
                  ? {
                      lastMessage: result.message.text,
                      lastMessageAt: result.message.createdAt,
                      updatedAt: result.message.createdAt,
                    }
                  : {})),
              messages: mergeMessages(
                conversation.messages || [],
                [result.message]
              ),
            };
          })
          .sort(
            (first, second) =>
              new Date(second.updatedAt) - new Date(first.updatedAt) ||
              second.id.localeCompare(first.id)
          )
      );

      return true;
    } catch (err) {
      // Keep the ID for an identical retry to prevent duplicate messages.
      setError(err.message || "Unable to send message.");
      return false;
    } finally {
      setSending(false);
    }
  }, [selectedConversationId]);

  // Initialize inbox.
  useEffect(() => {
    let active = true;

    async function initialize() {
      setLoading(true);
      setError("");

      try {
        const [page, totalUnread] = await Promise.all([
          getConversations({ limit: PAGE_SIZE }),
          getUnreadCount(),
        ]);

        if (!active) return;

        setConversations(page.conversations);
        setConversationCursor(page.nextCursor);
        setHasMoreConversations(page.hasMore);
        setUnreadCount(totalUnread);

        const firstId = page.conversations[0]?.id;

        if (firstId) {
          await selectConversation(firstId);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load messages.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, [selectConversation]);

  // Search and filter conversations.
  const visibleConversations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return conversations.filter((conversation) => {
      const matchesFilter =
        filter === "all" || conversation.type === filter;

      const searchableText = [
        conversation.participant.name,
        conversation.subject || "",
        conversation.relatedProduct?.name || "",
        conversation.lastMessage || "",
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesFilter &&
        (!normalizedSearch || searchableText.includes(normalizedSearch))
      );
    });
  }, [conversations, filter, search]);

  // Context value.
  const value = useMemo(
    () => ({
      vendor,
      conversations,
      visibleConversations,
      selectedConversation,
      selectedConversationId,
      loading,
      loadingMoreConversations,
      historyLoading,
      loadingOlderMessages,
      sending,
      error,
      historyError,
      filter,
      setFilter,
      search,
      setSearch,
      unreadCount,
      hasMoreConversations,
      hasMoreMessages,
      selectConversation,
      sendMessage,
      refreshInbox,
      loadMoreConversations,
      loadOlderMessages,
    }),
    [
      vendor,
      conversations,
      visibleConversations,
      selectedConversation,
      selectedConversationId,
      loading,
      loadingMoreConversations,
      historyLoading,
      loadingOlderMessages,
      sending,
      error,
      historyError,
      filter,
      search,
      unreadCount,
      hasMoreConversations,
      hasMoreMessages,
      selectConversation,
      sendMessage,
      refreshInbox,
      loadMoreConversations,
      loadOlderMessages,
    ]
  );

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessageContext);

  if (!context) {
    throw new Error(
      "useMessages must be used inside a MessageProvider."
    );
  }

  return context;
}
