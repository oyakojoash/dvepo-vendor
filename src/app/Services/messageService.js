const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export class MessagingApiError extends Error {
  constructor(message, status = 0, body = {}) {
    super(message);
    this.name = "MessagingApiError";
    this.status = status;
    this.body = body;
  }
}

async function request(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/messages${path}`, {
      method,
      credentials: "include",
      cache: "no-store",
      headers: {
        "X-Messaging-Account-Type": "merchant",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    throw new MessagingApiError(
      error?.message || "Could not reach the messaging service. Check the connection and try again."
    );
  }

  let payload = {};
  try {
    const text = await response.text();
    payload = text ? JSON.parse(text) : {};
  } catch {
    // Use the HTTP status when the response is empty or not JSON.
  }

  if (!response.ok) {
    const message = response.status === 401
      ? "Your Merchant session has expired. Sign in again to continue."
      : payload.message || `Messaging request failed (HTTP ${response.status}).`;
    throw new MessagingApiError(message, response.status, payload);
  }

  return payload;
}

function mapConversation(conversation) {
  return {
    id: conversation.id,
    customerId: conversation.customerId,
    merchantId: conversation.merchantId,
    participant: {
      id: conversation.customerId,
      role: "customer",
      name: "Customer",
    },
    type: "customer",
    subject: null,
    relatedProduct: null,
    lastMessage: conversation.lastMessage || "",
    lastMessageAt: conversation.lastMessageAt || null,
    unreadCount: conversation.merchantUnreadCount || 0,
    updatedAt: conversation.updatedAt,
    createdAt: conversation.createdAt,
  };
}

function mapMessage(message) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    senderRole: message.senderType === "merchant" ? "vendor" : "customer",
    text: message.text,
    clientMessageId: message.clientMessageId,
    createdAt: message.createdAt,
    readAt: message.readAt,
    read: Boolean(message.readAt),
  };
}

function pageQuery({ limit, before } = {}) {
  const query = new URLSearchParams();
  if (limit !== undefined) query.set("limit", String(limit));
  if (before) query.set("before", before);
  const encoded = query.toString();
  return encoded ? `?${encoded}` : "";
}

export async function getConversations(options = {}) {
  const payload = await request(`/conversations${pageQuery(options)}`);
  return {
    ...payload,
    conversations: (payload.conversations || []).map(mapConversation),
  };
}

export async function getConversation(conversationId) {
  const payload = await request(`/conversations/${encodeURIComponent(conversationId)}`);
  return mapConversation(payload.conversation);
}

export async function getConversationMessages(conversationId, options = {}) {
  const payload = await request(
    `/conversations/${encodeURIComponent(conversationId)}/messages${pageQuery(options)}`
  );
  return { ...payload, messages: (payload.messages || []).map(mapMessage) };
}

export async function sendMessage(conversationId, text, clientMessageId) {
  const payload = await request(
    `/conversations/${encodeURIComponent(conversationId)}/messages`,
    { method: "POST", body: { text, clientMessageId } }
  );
  return {
    message: mapMessage(payload.message),
    idempotentReplay: Boolean(payload.idempotentReplay),
  };
}

export async function markConversationAsRead(conversationId) {
  const payload = await request(
    `/conversations/${encodeURIComponent(conversationId)}/read`,
    { method: "PATCH" }
  );
  return payload.markedRead;
}

export async function getUnreadCount() {
  const payload = await request("/unread-count");
  return payload.unreadCount;
}
