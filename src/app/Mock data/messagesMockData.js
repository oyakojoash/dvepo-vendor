
export const MOCK_CURRENT_VENDOR = {
  id: "vendor-001",
  name: "Demo Vendor Store",
  role: "vendor",
};

export const MOCK_CONVERSATIONS = [
  {
    id: "conversation-001",
    type: "customer",
    participant: {
      id: "customer-001",
      name: "Amina Wanjiku",
      role: "customer",
      avatar: null,
    },
    subject: "Product availability",
    relatedProduct: {
      id: "product-001",
      name: "Wireless Headphones",
    },
    unreadCount: 1,
    updatedAt: "2026-10-19T10:42:00.000Z",
    messages: [
      {
        id: "message-001",
        senderId: "customer-001",
        senderRole: "customer",
        text: "Hello, are these wireless headphones still available?",
        createdAt: "2026-10-19T10:40:00.000Z",
        read: true,
      },
      {
        id: "message-002",
        senderId: "vendor-001",
        senderRole: "vendor",
        text: "Hello Amina! Yes, they are available.",
        createdAt: "2026-10-19T10:41:00.000Z",
        read: true,
      },
      {
        id: "message-003",
        senderId: "customer-001",
        senderRole: "customer",
        text: "Great! Do you offer delivery?",
        createdAt: "2026-10-19T10:42:00.000Z",
        read: false,
      },
    ],
  },
  {
    id: "conversation-002",
    type: "admin",
    participant: {
      id: "admin-001",
      name: "Dvepo Administration",
      role: "admin",
      avatar: null,
    },
    subject: "Store account review",
    relatedProduct: null,
    unreadCount: 1,
    updatedAt: "2026-10-19T09:30:00.000Z",
    messages: [
      {
        id: "message-004",
        senderId: "admin-001",
        senderRole: "admin",
        text:
          "Hello Vendor. Please review your store information and ensure your product listings are accurate.",
        createdAt: "2026-10-19T09:25:00.000Z",
        read: true,
      },
      {
        id: "message-005",
        senderId: "admin-001",
        senderRole: "admin",
        text: "Please reply when you have completed the review.",
        createdAt: "2026-10-19T09:30:00.000Z",
        read: false,
      },
    ],
  },
  {
    id: "conversation-003",
    type: "customer",
    participant: {
      id: "customer-002",
      name: "Brian Otieno",
      role: "customer",
      avatar: null,
    },
    subject: "Delivery inquiry",
    relatedProduct: {
      id: "product-002",
      name: "Smart Watch",
    },
    unreadCount: 0,
    updatedAt: "2026-10-18T14:15:00.000Z",
    messages: [
      {
        id: "message-006",
        senderId: "customer-002",
        senderRole: "customer",
        text: "How long does delivery usually take?",
        createdAt: "2026-10-18T14:10:00.000Z",
        read: true,
      },
      {
        id: "message-007",
        senderId: "vendor-001",
        senderRole: "vendor",
        text: "Delivery usually takes one to three business days.",
        createdAt: "2026-10-18T14:15:00.000Z",
        read: true,
      },
    ],
  },
];

export const MOCK_MESSAGE_FILTERS = [
  { label: "All messages", value: "all" },
  { label: "Customers", value: "customer" },
  { label: "Dvepo Admin", value: "admin" },
];
