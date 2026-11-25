
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

async function request(path, body, method = "PATCH") {
  const response = await fetch(
    `${API_BASE_URL}/api/merchant/orders${path}`,
    {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      ...(method === "PATCH"
        ? { body: JSON.stringify(body) }
        : {}),
    }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Order request failed");
  }

  return payload;
}

export async function getMerchantOrders() {
  const response = await fetch(
    `${API_BASE_URL}/api/merchant/orders`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }
  );

  const payload = await response.json().catch(() => []);

  if (!response.ok) {
    throw new Error(payload.message || "Failed to load orders");
  }

  if (!Array.isArray(payload)) {
    throw new Error("Invalid orders response from server");
  }

  return payload.map((order) => {
    const group = order.merchantGroups?.[0] || {};
    const products = Array.isArray(order.products) ? order.products : [];

    const items = products.map((line) => ({
      productId: line.productId,
      name: line.name || "Unnamed product",
      quantity: Number(line.quantity) || 0,
      unitPrice: Number(line.price) || 0,
      image: line.image || "",
    }));

    const subtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    const status = group.status || order.status || "pending";

    return {
      id: order._id,
      orderType: "direct",
      orderStatus: status,

      createdAt: order.createdAt,
      updatedAt: order.updatedAt,

      customer: {
        name: order.userInfo?.name || "Customer",
        email: order.userInfo?.email || "",
        phone: order.userInfo?.phone || "",
      },

      items,

      subtotal,
      total: subtotal,
      deliveryFee: 0,

      shippingAddress: {
        recipient: order.shippingAddress?.recipient || "",
        phone: order.shippingAddress?.phone || "",
        county: order.shippingAddress?.county || "",
        town: order.shippingAddress?.town || "",
        area: order.shippingAddress?.area || "",
        building: order.shippingAddress?.building || "",
        instructions: order.shippingAddress?.instructions || "",
      },

      paymentStatus: group.paymentConfirmedAt
        ? "confirmed"
        : group.paymentSentAt
          ? "sent"
          : "not recorded",

      rejectionReason: group.rejectionReason || null,

      paymentInstruction: group.paymentInstruction || "",
      paymentLink: group.paymentLink || "",
      paymentSentAt: group.paymentSentAt || null,
      paymentReceivedAt: group.paymentReceivedAt || null,
    };
  });
}

export const decideMerchantOrder = (id, decision, reason) =>
  request(`/${encodeURIComponent(id)}/decision`, {
    decision,
    reason,
  });

export const progressMerchantOrder = (id, status) =>
  request(`/${encodeURIComponent(id)}/status`, {
    status,
  });

export const savePaymentInstructions = (id, instruction, link) =>
  request(`/${encodeURIComponent(id)}/payment-instructions`, {
    instruction,
    link,
  });

export const confirmPaymentReceived = (id) =>
  request(`/${encodeURIComponent(id)}/payment-received`, {}, "PATCH");
