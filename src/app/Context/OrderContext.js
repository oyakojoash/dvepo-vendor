
"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  confirmPaymentReceived,
  decideMerchantOrder,
  getMerchantOrders,
  progressMerchantOrder,
  savePaymentInstructions,
} from "../Services/orderService";

const OrderContext = createContext(null);

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [loadError, setLoadError] = useState("");

  const refreshOrders = useCallback(async () => {
    try {
      const rows = await getMerchantOrders();
      setOrders(rows);
      setLoadError("");
      return true;
    } catch (error) {
      setLoadError(error.message || "Failed to load orders.");
      return false;
    }
  }, []);

  useEffect(() => {
    let active = true;

    getMerchantOrders()
      .then((rows) => {
        if (active) {
          setOrders(rows);
          setLoadError("");
        }
      })
      .catch((error) => {
        if (active) {
          setLoadError(error.message || "Failed to load orders.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const getOrders = useCallback(
    ({ orderType = "all", orderStatus = "all" } = {}) => {
      return orders.filter((order) => {
        const matchesType =
          orderType === "all" || order.orderType === orderType;

        const matchesStatus =
          orderStatus === "all" || order.orderStatus === orderStatus;

        return matchesType && matchesStatus;
      });
    },
    [orders]
  );

  const updateOrder = useCallback((orderId, updates) => {
    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : order
      )
    );
  }, []);

  const acceptOrder = useCallback(
    async (orderId) => {
      const order = orders.find((item) => item.id === orderId);

      if (!order || order.orderStatus !== "pending") {
        return false;
      }

      try {
        await decideMerchantOrder(orderId, "accept");
        await refreshOrders();
        return true;
      } catch {
        return false;
      }
    },
    [orders, refreshOrders]
  );

  const rejectOrder = useCallback(
    async (orderId, reason = "Order rejected by merchant.") => {
      const order = orders.find((item) => item.id === orderId);

      if (!order || order.orderStatus !== "pending") {
        return false;
      }

      try {
        await decideMerchantOrder(orderId, "reject", reason);
        await refreshOrders();
        return true;
      } catch {
        return false;
      }
    },
    [orders, refreshOrders]
  );

  const advanceOrder = useCallback(
    async (orderId, nextStatus) => {
      const allowedTransitions = {
        accepted: ["processing"],
        processing: ["dispatched"],
        dispatched: ["delivered"],
      };

      const order = orders.find((item) => item.id === orderId);

      if (
        !order ||
        !allowedTransitions[order.orderStatus]?.includes(nextStatus)
      ) {
        return false;
      }

      try {
        await progressMerchantOrder(orderId, nextStatus);
        await refreshOrders();
        return true;
      } catch {
        return false;
      }
    },
    [orders, refreshOrders]
  );

  const updatePaymentInstructions = useCallback(
    async (orderId, instruction, link) => {
      try {
        await savePaymentInstructions(orderId, instruction, link);
        await refreshOrders();
        return true;
      } catch {
        return false;
      }
    },
    [refreshOrders]
  );

  const markPaymentReceived = useCallback(
    async (orderId) => {
      try {
        await confirmPaymentReceived(orderId);
        await refreshOrders();
        return true;
      } catch {
        return false;
      }
    },
    [refreshOrders]
  );

  const stats = useMemo(
    () => ({
      total: orders.length,

      direct: orders.filter(
        (order) => order.orderType === "direct"
      ).length,

      affiliate: orders.filter(
        (order) => order.orderType === "affiliate"
      ).length,

      pending: orders.filter(
        (order) => order.orderStatus === "pending"
      ).length,

      processing: orders.filter((order) =>
        ["accepted", "processing"].includes(order.orderStatus)
      ).length,

      dispatched: orders.filter(
        (order) => order.orderStatus === "dispatched"
      ).length,

      delivered: orders.filter(
        (order) => order.orderStatus === "delivered"
      ).length,

      rejected: orders.filter(
        (order) => order.orderStatus === "rejected"
      ).length,

      cancelled: orders.filter(
        (order) => order.orderStatus === "cancelled"
      ).length,
    }),
    [orders]
  );

  const value = useMemo(
    () => ({
      orders,
      loadError,
      refreshOrders,
      stats,
      getOrders,
      updateOrder,
      acceptOrder,
      rejectOrder,
      advanceOrder,
      updatePaymentInstructions,
      markPaymentReceived,
    }),
    [
      orders,
      loadError,
      refreshOrders,
      stats,
      getOrders,
      updateOrder,
      acceptOrder,
      rejectOrder,
      advanceOrder,
      updatePaymentInstructions,
      markPaymentReceived,
    ]
  );

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);

  if (!context) {
    throw new Error("useOrders must be used inside an OrderProvider");
  }

  return context;
}
