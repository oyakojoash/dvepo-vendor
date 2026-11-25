
export const initialProducts = [
  {
    id: "prod-001",
    name: "Wireless Headphones",
    description: "Wireless headphones with rechargeable battery.",
    model: "retail",
    productClass: "Electronics",
    category: "Audio",
    storeId: "store-001",
    status: "active",
    createdAt: "2026-10-17T09:00:00.000Z",
    images: [
      {
        id: "laptop",
        name: "Laptop",
        src: "/images/products/laptop.jpg",
        primary: true,
        source: "local",
      },
    ],

    retail: {
      price: 2500,
      stock: 25,
    },
  },

  {
    id: "prod-002",
    name: "Cotton T-Shirt",
    description: "Cotton T-shirts sold to bulk buyers.",
    model: "wholesale",
    productClass: "Fashion",
    category: "Clothing",
    storeId: "store-001",
    status: "active",
    createdAt: "2026-10-17T09:10:00.000Z",
    images: [
      {
        id: "shoe",
        name: "Shoe",
        src: "/images/products/shoe.avif",
        primary: true,
        source: "local",
      },
    ],

    wholesale: {
      unitPrice: 350,
      minimumOrderQuantity: 10,
      stock: 500,
    },
  },

  {
    id: "prod-003",
    name: "Premium Digital Access",
    description: "Recurring access to a premium digital service.",
    model: "subscription",
    productClass: "Digital Services",
    category: "Memberships",
    storeId: "store-001",
    status: "active",
    createdAt: "2026-10-17T09:20:00.000Z",

    subscription: {
      price: 500,
      billingInterval: "month",
      duration: 12,
      autoRenew: true,
    },
  },
];
