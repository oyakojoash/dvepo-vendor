"use client";
/* eslint @next/next/no-img-element: off -- user-selected local data URLs are previewed directly. */

export default function ProductCard({ product, onEdit, onToggleStatus, onDuplicate, onDelete, onToggleAffiliatePromotion, promotionPending = false, promotionError = "" }) {
  const price = product.model === "retail" ? product.retail?.price : product.model === "wholesale" ? product.wholesale?.unitPrice : product.subscription?.price;
  const primary = product.images?.find((image) => image.primary) || product.images?.[0];
  const stock = product.model === "retail" ? product.retail?.stock : product.model === "wholesale" ? product.wholesale?.stock : null;
  return <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="relative h-52 bg-gradient-to-br from-emerald-50 via-slate-100 to-indigo-100">
      {primary?.src ? <img src={primary.src} alt={product.name} className="h-full w-full object-cover" onError={(event) => { if (!event.currentTarget.src.endsWith("/product-image-fallback.svg")) event.currentTarget.src = "/product-image-fallback.svg"; }} /> : <div className="flex h-full items-center justify-center"><div className="rounded-2xl bg-white/80 p-5 text-center text-emerald-800 shadow-sm"><span className="block text-3xl">◇</span><span className="mt-1 block text-xs font-semibold">Dvepo product</span></div></div>}
      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold capitalize text-slate-700">{product.model}</span>
      <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold capitalize text-slate-700">{product.status}</span>
    </div>
    <div className="space-y-4 p-4">
      <div><div className="flex min-w-0 items-start justify-between gap-2"><h3 className="min-w-0 flex-1 break-words font-semibold text-slate-900">{product.name}</h3><span className="shrink-0 whitespace-nowrap text-sm font-bold text-slate-900">KSh {Number(price || 0).toLocaleString("en-KE")}{product.model === "wholesale" ? " / unit" : product.model === "subscription" ? ` / ${product.subscription?.billingInterval || "month"}` : ""}</span></div><p className="mt-1 line-clamp-2 min-h-10 break-words text-sm text-slate-500">{product.description || product.category || "No description yet."}</p></div>
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500"><span>{product.category || "Uncategorized"}</span><span>{stock === null ? "Recurring service" : stock === 0 ? "Out of stock" : `${stock} in stock`}</span></div>
      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        <button type="button" onClick={() => onEdit(product)} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">Edit</button>
        <button type="button" onClick={() => onToggleStatus(product)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">{product.status === "active" ? "Deactivate" : "Activate"}</button>
        <button type="button" onClick={() => onDuplicate(product)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Duplicate</button>
        <button type="button" onClick={() => onDelete(product)} className="ml-auto rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700">Delete</button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-600" aria-live="polite">Affiliate promotion: {product.affiliatePromotionEnabled === true ? "Enabled" : "Disabled"}</span>
        <button type="button" onClick={() => onToggleAffiliatePromotion?.(product)} disabled={promotionPending} aria-label={`${product.affiliatePromotionEnabled === true ? "Disable" : "Enable"} affiliate promotion for ${product.name}`} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-wait disabled:opacity-50">
          {promotionPending ? "Saving…" : product.affiliatePromotionEnabled === true ? "Disable promotion" : "Enable promotion"}
        </button>
      </div>
      {promotionError && <p role="alert" className="text-xs text-rose-700">{promotionError}</p>}
    </div>
  </article>;
}
