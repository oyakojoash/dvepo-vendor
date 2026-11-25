
"use client";
/* eslint @next/next/no-img-element: off -- local product preview data URLs are displayed directly. */

function getPrice(product) {
  if (product.model === "retail") {
    return `KSh ${Number(product.retail?.price ?? 0).toLocaleString()}`;
  }

  if (product.model === "wholesale") {
    return `KSh ${Number(
      product.wholesale?.unitPrice ?? 0
    ).toLocaleString()} / unit`;
  }

  if (product.model === "subscription") {
    const subscription = product.subscription;
    const price = Number(subscription?.price ?? 0).toLocaleString();
    const interval = subscription?.billingInterval ?? "month";

    return `KSh ${price} / ${interval}`;
  }

  return "—";
}

function getInventory(product) {
  if (product.model === "retail") {
    return `${product.retail?.stock ?? 0} units`;
  }

  if (product.model === "wholesale") {
    return `${product.wholesale?.stock ?? 0} units`;
  }

  if (product.model === "subscription") {
    return `${product.subscription?.duration ?? "—"} billing periods`;
  }

  return "—";
}

const modelLabels = {
  retail: "Retail",
  wholesale: "Wholesale",
  subscription: "Subscription",
};

export default function ProductTable({
  products = [],
  loading = false,
  onEdit,
  onToggleStatus,
  onDuplicate,
  onDelete,
  onToggleAffiliatePromotion,
  promotionPending = {},
  promotionErrors = {},
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
        Loading products...
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">
        <h3 className="font-semibold text-gray-900">
          No products found
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Add a retail, wholesale, or subscription product to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-[850px] w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-5 py-4 font-semibold">Product</th>
              <th className="px-5 py-4 font-semibold">Model</th>
              <th className="px-5 py-4 font-semibold">Price</th>
              <th className="px-5 py-4 font-semibold">Stock / Details</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3"><div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-emerald-50 to-indigo-100">{(product.images?.find((image) => image.primary) || product.images?.[0])?.src ? <img src={(product.images.find((image) => image.primary) || product.images[0]).src} alt="" className="h-full w-full object-cover" onError={(event) => { if (!event.currentTarget.src.endsWith("/product-image-fallback.svg")) event.currentTarget.src = "/product-image-fallback.svg"; }} /> : <div className="flex h-full items-center justify-center text-lg text-emerald-700">◇</div>}</div><div><div className="font-medium text-gray-900">{product.name}</div><div className="text-xs text-gray-500">{product.sku || "No SKU"}</div></div></div>
                  <div className="mt-1 text-xs text-gray-500">
                    {product.productClass || "Unclassified"}
                    {product.category
                      ? ` · ${product.category}`
                      : ""}
                  </div>
                </td>

                <td className="px-5 py-4">
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                    {modelLabels[product.model] || product.model}
                  </span>
                </td>

                <td className="px-5 py-4 font-medium text-gray-800">
                  {getPrice(product)}
                </td>

                <td className="px-5 py-4 text-gray-600">
                  {product.model === "wholesale" && (
                    <div>
                      Minimum:{" "}
                      {product.wholesale?.minimumOrderQuantity ?? "—"}
                    </div>
                  )}
                  <div>{getInventory(product)}</div>
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      product.status === "active" ? "bg-green-50 text-green-700" : product.status === "draft" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {product.status || "active"}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => onEdit?.(product)}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button type="button" onClick={() => onDuplicate?.(product)} className="font-medium text-gray-600 hover:text-gray-900">Duplicate</button>
                    <button type="button" onClick={() => onDelete?.(product)} className="font-medium text-rose-600 hover:text-rose-800">Delete</button>

                    <button
                      type="button"
                      onClick={() => onToggleStatus?.(product)}
                      className="font-medium text-gray-600 hover:text-gray-900"
                    >
                      {product.status === "active"
                        ? "Deactivate"
                        : "Activate"}
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-3">
                    <span className="text-xs text-gray-500" aria-live="polite">Promotion {product.affiliatePromotionEnabled === true ? "enabled" : "disabled"}</span>
                    <button type="button" disabled={Boolean(promotionPending[product.id])} onClick={() => onToggleAffiliatePromotion?.(product)} aria-label={`${product.affiliatePromotionEnabled === true ? "Disable" : "Enable"} affiliate promotion for ${product.name}`} className="font-medium text-indigo-600 hover:text-indigo-800 disabled:cursor-wait disabled:opacity-50">
                      {promotionPending[product.id] ? "Saving…" : product.affiliatePromotionEnabled === true ? "Disable" : "Enable"}
                    </button>
                  </div>
                  {promotionErrors[product.id] && <p role="alert" className="mt-2 text-right text-xs text-rose-700">{promotionErrors[product.id]}</p>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
