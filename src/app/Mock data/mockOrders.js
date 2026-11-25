
export const mockOrders = [
  {
    id: "DVP-1001",
    merchantId: "MER-001",
    orderType: "direct",
    attribution: null,

    customer: {
      id: "CUS-001",
      name: "Mary Wanjiku",
      phone: "0712345678",
      email: "mary@example.com",
    },

    items: [
      {
        productId: "PRD-001",
        name: "Wireless Headphones",
        productType: "retail",
        quantity: 1,
        unitPrice: 3500,
      },
      {
        productId: "PRD-002",
        name: "Phone Case",
        productType: "retail",
        quantity: 2,
        unitPrice: 500,
      },
    ],

    subtotal: 4500,
    deliveryFee: 200,
    total: 4700,
    currency: "KES",

    paymentStatus: "pending",
    orderStatus: "pending",
    customerReceiptStatus: "pending",

    shippingAddress: {
      county: "Nairobi",
      town: "Kilimani",
      address: "Near Yaya Centre",
    },

    customerNote: "Please call before delivery.",
    rejectionReason: null,

    createdAt: "2026-10-18T09:30:00.000Z",
    updatedAt: "2026-10-18T09:30:00.000Z",
  },

  {
    id: "DVP-1002",
    merchantId: "MER-001",
    orderType: "affiliate",

    attribution: {
      affiliateId: "AFF-001",
      affiliateName: "John Kamau",
      agentId: null,
      trackingCode: "DV-JOHN-001",
      attributedAt: "2026-10-17T10:30:00.000Z",
    },

    customer: {
      id: "CUS-002",
      name: "Brian Otieno",
      phone: "0723456789",
      email: "brian@example.com",
    },

    items: [
      {
        productId: "PRD-003",
        name: "Office Chair",
        productType: "wholesale",
        quantity: 4,
        unitPrice: 6000,
      },
    ],

    subtotal: 24000,
    deliveryFee: 1000,
    total: 25000,
    currency: "KES",

    paymentStatus: "paid",
    orderStatus: "accepted",
    customerReceiptStatus: "pending",

    shippingAddress: {
      county: "Machakos",
      town: "Mlolongo",
      address: "Near the main shopping centre",
    },

    customerNote: "Deliver during business hours.",
    rejectionReason: null,

    createdAt: "2026-10-17T11:00:00.000Z",
    updatedAt: "2026-10-17T12:00:00.000Z",
  },

  {
    id: "DVP-1003",
    merchantId: "MER-001",
    orderType: "affiliate",

    attribution: {
      affiliateId: "AFF-002",
      affiliateName: "Grace Affiliate",
      agentId: "AGT-001",
      agentName: "David Otieno",
      trackingCode: "DV-GRACE-002",
      attributedAt: "2026-10-16T13:45:00.000Z",
    },

    customer: {
      id: "CUS-003",
      name: "Grace Achieng",
      phone: "0734567890",
      email: "grace@example.com",
    },

    items: [
      {
        productId: "PRD-004",
        name: "Cotton T-Shirt",
        productType: "retail",
        quantity: 5,
        unitPrice: 900,
      },
    ],

    subtotal: 4500,
    deliveryFee: 300,
    total: 4800,
    currency: "KES",

    paymentStatus: "paid",
    orderStatus: "processing",
    customerReceiptStatus: "pending",

    shippingAddress: {
      county: "Nairobi",
      town: "Westlands",
      address: "Near Sarit Centre",
    },

    customerNote: "",
    rejectionReason: null,

    createdAt: "2026-10-16T14:20:00.000Z",
    updatedAt: "2026-10-17T08:00:00.000Z",
  },

  {
    id: "DVP-1004",
    merchantId: "MER-001",
    orderType: "direct",
    attribution: null,

    customer: {
      id: "CUS-004",
      name: "Peter Mwangi",
      phone: "0745678901",
      email: "peter@example.com",
    },

    items: [
      {
        productId: "PRD-005",
        name: "Bluetooth Speaker",
        productType: "retail",
        quantity: 1,
        unitPrice: 2800,
      },
    ],

    subtotal: 2800,
    deliveryFee: 200,
    total: 3000,
    currency: "KES",

    paymentStatus: "paid",
    orderStatus: "dispatched",
    customerReceiptStatus: "pending",

    shippingAddress: {
      county: "Kiambu",
      town: "Ruiru",
      address: "Near Ruiru town centre",
    },

    customerNote: "Call on arrival.",
    rejectionReason: null,

    createdAt: "2026-10-15T08:45:00.000Z",
    updatedAt: "2026-10-18T07:30:00.000Z",
  },

  {
    id: "DVP-1005",
    merchantId: "MER-001",
    orderType: "direct",
    attribution: null,

    customer: {
      id: "CUS-005",
      name: "Anne Njeri",
      phone: "0756789012",
      email: "anne@example.com",
    },

    items: [
      {
        productId: "PRD-006",
        name: "Laptop Stand",
        productType: "retail",
        quantity: 1,
        unitPrice: 1800,
      },
    ],

    subtotal: 1800,
    deliveryFee: 200,
    total: 2000,
    currency: "KES",

    paymentStatus: "unpaid",
    orderStatus: "rejected",
    customerReceiptStatus: "pending",

    shippingAddress: {
      county: "Nairobi",
      town: "Embakasi",
      address: "Near the shopping centre",
    },

    customerNote: "",
    rejectionReason: "Product currently out of stock.",

    createdAt: "2026-10-14T10:15:00.000Z",
    updatedAt: "2026-10-14T11:00:00.000Z",
  },
];
