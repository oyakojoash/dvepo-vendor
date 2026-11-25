
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useOrders } from "../Context/OrderContext";
import LogoutButton from "../Components/auth/LogoutButton";

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const statusStyles = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  dispatched: "bg-cyan-100 text-cyan-800",
  delivered: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-700",
};

export default function VendorOrdersPage() {
  const {
    orders,
    stats,
    loadError,
    refreshOrders,
    advanceOrder,
    updatePaymentInstructions,
    markPaymentReceived,
    acceptOrder,
    rejectOrder,
  } = useOrders();

  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [paymentInstruction, setPaymentInstruction] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const selectOrder = (order) => { setSelectedOrder(order); setPaymentInstruction(order.paymentInstruction || ''); setPaymentLink(order.paymentLink || ''); };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesType =
        typeFilter === "all" || order.orderType === typeFilter;

      const matchesStatus =
        statusFilter === "all" || order.orderStatus === statusFilter;

      const query = search.toLowerCase().trim();

      const matchesSearch =
        !query ||
        order.id.toLowerCase().includes(query) ||
        order.customer.name.toLowerCase().includes(query) ||
        order.items.some((item) =>
          item.name.toLowerCase().includes(query)
        ) ||
        (order.attribution?.affiliateName || "")
          .toLowerCase()
          .includes(query);

      return matchesType && matchesStatus && matchesSearch;
    });
  }, [orders, typeFilter, statusFilter, search]);

  const handleAccept = async (orderId) => {
    const success = await acceptOrder(orderId);

    setActionMessage(
      success
        ? `${orderId} accepted successfully.`
        : "This order cannot be accepted in its current status."
    );

    setSelectedOrder(null);
  };

  const handleReject = async (orderId) => {
    const reason = window.prompt(
      "Enter the reason for rejecting this order:"
    );

    if (reason === null) return;

    if (!reason.trim()) {
      setActionMessage("Please provide a rejection reason.");
      return;
    }

    const success = await rejectOrder(orderId, reason.trim());

    setActionMessage(
      success
        ? `${orderId} rejected.`
        : "This order cannot be rejected in its current status."
    );

    setSelectedOrder(null);
  };

  const summaryCards = [
    { label: "Total orders", value: stats.total },
    { label: "Direct orders", value: stats.direct },
    { label: "Affiliate orders", value: stats.affiliate },
    { label: "Pending orders", value: stats.pending },
  ];

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {loadError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{loadError}</p>}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              Dvepo Merchant Portal
            </p>

            <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
              Orders
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Manage direct purchases and affiliate-generated orders.
            </p>
          </div>
          <button type="button" onClick={refreshOrders} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700">Refresh orders</button>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/" className="w-fit rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Dashboard</Link>
            <LogoutButton />
          </div>
        </header>

        {actionMessage && (
          <div
            role="status"
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700"
          >
            <span>{actionMessage}</span>

            <button
              type="button"
              onClick={() => setActionMessage("")}
              className="ml-4 font-semibold text-gray-500 hover:text-gray-900"
            >
              Dismiss
            </button>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-gray-500">{card.label}</p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {card.value}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Order management
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {filteredOrders.length} order(s) found
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search orders..."
                aria-label="Search orders"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />

              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                aria-label="Filter by order type"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              >
                <option value="all">All order types</option>
                <option value="direct">Direct orders</option>
                <option value="affiliate">Affiliate orders</option>
              </select>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by order status"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="processing">Processing</option>
                <option value="dispatched">Dispatched</option>
                <option value="delivered">Delivered</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-y border-gray-200 bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Order type</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 font-semibold text-gray-900">
                      {order.id}
                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {order.customer.name}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          order.orderType === "affiliate"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {order.orderType === "affiliate"
                          ? "Affiliate"
                          : "Direct"}
                      </span>

                      {order.orderType === "affiliate" &&
                        order.attribution && (
                          <p className="mt-1 text-xs text-gray-500">
                            {order.attribution.affiliateName}
                          </p>
                        )}
                    </td>

                    <td className="px-4 py-4 text-gray-600">
                      {order.items.reduce(
                        (total, item) => total + item.quantity,
                        0
                      )}{" "}
                      item(s)
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 font-medium text-gray-900">
                      {formatMoney(order.total)}
                    </td>

                    <td className="px-4 py-4 capitalize text-gray-600">
                      {order.paymentStatus}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          statusStyles[order.orderStatus] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                      {formatDate(order.createdAt)}
                    </td>

                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => selectOrder(order)}
                        className="font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredOrders.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-gray-500"
                    >
                      No orders match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {selectedOrder && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="order-details-title"
              className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="order-details-title"
                    className="text-xl font-bold text-gray-900"
                  >
                    Order {selectedOrder.id}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {selectedOrder.customer.name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  aria-label="Close order details"
                  className="rounded-lg px-3 py-1 text-xl text-gray-500 hover:bg-gray-100"
                >
                  ×
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Order type</p>

                  <p className="mt-1 font-semibold capitalize text-gray-900">
                    {selectedOrder.orderType}
                  </p>

                  {selectedOrder.attribution && (
                    <p className="mt-2 text-sm text-gray-600">
                      Affiliate:{" "}
                      {selectedOrder.attribution.affiliateName}
                      {selectedOrder.attribution.agentName &&
                        ` · Agent: ${selectedOrder.attribution.agentName}`}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900">
                    Products
                  </h3>

                  <div className="mt-2 divide-y divide-gray-100">
                    {selectedOrder.items.map((item) => (
                      <div
                        key={item.productId}
                        className="flex justify-between gap-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-medium text-gray-800">
                            {item.name}
                          </p>
                          <p className="text-gray-500">
                            {item.quantity} × {formatMoney(item.unitPrice)}
                          </p>
                        </div>

                        <p className="font-medium text-gray-900">
                          {formatMoney(item.quantity * item.unitPrice)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 border-t border-gray-200 pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span>{formatMoney(selectedOrder.subtotal)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">Delivery</span>
                    <span>{formatMoney(selectedOrder.deliveryFee)}</span>
                  </div>

                  <div className="flex justify-between text-base font-bold">
                    <span>Total</span>
                    <span>{formatMoney(selectedOrder.total)}</span>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <p>
                    Payment:{" "}
                    <span className="font-medium capitalize">
                    {selectedOrder.paymentStatus || 'Not recorded'}
                    </span>
                  </p>

                  {(selectedOrder.shippingAddress.recipient || selectedOrder.shippingAddress.phone) && (
                    <p className="mt-1">
                      {selectedOrder.shippingAddress.recipient && <span>Recipient: {selectedOrder.shippingAddress.recipient}</span>}
                      {selectedOrder.shippingAddress.recipient && selectedOrder.shippingAddress.phone && " · "}
                      {selectedOrder.shippingAddress.phone && <span>Phone: {selectedOrder.shippingAddress.phone}</span>}
                    </p>
                  )}
                  {[
                    selectedOrder.shippingAddress.building,
                    selectedOrder.shippingAddress.area,
                    selectedOrder.shippingAddress.town,
                    selectedOrder.shippingAddress.county,
                  ].filter(Boolean).length > 0 && (
                    <p className="mt-1">Delivery address: {[selectedOrder.shippingAddress.building, selectedOrder.shippingAddress.area, selectedOrder.shippingAddress.town, selectedOrder.shippingAddress.county].filter(Boolean).join(", ")}</p>
                  )}
                  {selectedOrder.shippingAddress.instructions && <p className="mt-1">Instructions: {selectedOrder.shippingAddress.instructions}</p>}

                  {selectedOrder.customerNote && (
                    <p className="mt-2">
                      Customer note: {selectedOrder.customerNote}
                    </p>
                  )}

                  {selectedOrder.rejectionReason && (
                    <p className="mt-2 text-red-700">
                      Rejection reason: {selectedOrder.rejectionReason}
                    </p>
                  )}
                </div>
              </div>

              {selectedOrder.orderStatus === "pending" && (
                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => handleReject(selectedOrder.id)}
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    Reject order
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAccept(selectedOrder.id)}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Accept order
                  </button>
                </div>
              )}
              {{ accepted: 'processing', processing: 'dispatched', dispatched: 'delivered' }[selectedOrder.orderStatus] && (
                <div className="mt-6 flex justify-end">
                  <button type="button" onClick={async () => { const next = { accepted: 'processing', processing: 'dispatched', dispatched: 'delivered' }[selectedOrder.orderStatus]; if (await advanceOrder(selectedOrder.id, next)) { setActionMessage(`Order updated to ${next}.`); setSelectedOrder(null); } else setActionMessage('This order could not be advanced.'); }} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Mark {{ accepted: 'processing', processing: 'dispatched', dispatched: 'delivered' }[selectedOrder.orderStatus]}</button>
                </div>
              )}
              <div className="mt-6 space-y-3 border-t border-gray-200 pt-4">
                <h3 className="font-semibold">Payment instructions</h3>
                <textarea value={paymentInstruction} onChange={(event) => setPaymentInstruction(event.target.value)} maxLength={2000} className="w-full rounded border border-gray-300 p-2" placeholder="Instructions for paying the Merchant" />
                <input value={paymentLink} onChange={(event) => setPaymentLink(event.target.value)} maxLength={2048} className="w-full rounded border border-gray-300 p-2" placeholder="https:// payment link (optional)" />
                <button type="button" onClick={async () => { const ok = await updatePaymentInstructions(selectedOrder.id, paymentInstruction, paymentLink); setActionMessage(ok ? 'Payment instructions saved.' : 'Could not save payment instructions.'); }} className="rounded border border-indigo-300 px-4 py-2 text-sm font-semibold text-indigo-800">Save payment instructions</button>
                {selectedOrder.paymentSentAt && !selectedOrder.paymentReceivedAt && <button type="button" onClick={async () => { const ok = await markPaymentReceived(selectedOrder.id); setActionMessage(ok ? 'Payment Received recorded.' : 'Payment Sent is not recorded yet.'); }} className="ml-2 rounded bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Payment Received</button>}
                {selectedOrder.paymentReceivedAt && <p className="text-sm text-emerald-800">Payment confirmed</p>}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
