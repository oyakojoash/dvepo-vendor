
"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useProducts } from "../Context/ProductContext";
import ProductModal from "../Components/products/ProductModal";
import ProductTable from "../Components/products/ProductTable";
import ProductCard from "../Components/products/ProductCard";
import LogoutButton from "../Components/auth/LogoutButton";
import { confirmAffiliatePromotionChange } from "../Services/affiliatePromotionControl";

const getPrice = (product) => Number(product.retail?.price ?? product.wholesale?.unitPrice ?? product.subscription?.price ?? 0);
const getStock = (product) => Number(product.retail?.stock ?? product.wholesale?.stock ?? Number.MAX_SAFE_INTEGER);

export default function ProductsPage() {
  const {
    products = [],
    loading,
    error,
    addProduct,
    updateProduct,
    updateProductStatus,
    updateAffiliatePromotion,
    deleteProduct,
    duplicateProduct,
  } = useProducts();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [search, setSearch] = useState("");
  const [modelFilter, setModelFilter] = useState("all");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [promotionPending, setPromotionPending] = useState({});
  const [promotionErrors, setPromotionErrors] = useState({});
  const pendingPromotionProducts = useRef(new Set());
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [view, setView] = useState("cards");

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = products.filter((product) => {
      const matchesSearch =
        !query ||
        (product.name || "").toLowerCase().includes(query) ||
        (product.sku || "").toLowerCase().includes(query) ||
        (product.category || "").toLowerCase().includes(query) ||
        (product.productClass || "").toLowerCase().includes(query);

      const matchesModel =
        modelFilter === "all" || product.model === modelFilter;
      const matchesStatus = statusFilter === "all" || product.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || (product.category || "Uncategorized") === categoryFilter;

      return matchesSearch && matchesModel && matchesStatus && matchesCategory;
    });
    return result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "price") return getPrice(a) - getPrice(b);
      if (sortBy === "stock") return getStock(a) - getStock(b);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [products, search, modelFilter, statusFilter, categoryFilter, sortBy]);

  const retailCount = products.filter(
    (product) => product.model === "retail"
  ).length;

  const wholesaleCount = products.filter(
    (product) => product.model === "wholesale"
  ).length;

  const subscriptionCount = products.filter(
    (product) => product.model === "subscription"
  ).length;

  function openAddModal() {
    setActionError("");
    setProductToEdit(null);
    setIsModalOpen(true);
  }

  function openEditModal(product) {
    setActionError("");
    setProductToEdit(product);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setIsModalOpen(false);
    setProductToEdit(null);
  }

  async function handleSave(productData, productId) {
    setSaving(true);
    setActionError("");

    try {
      if (productId) {
        await updateProduct(productId, productData);
      } else {
        await addProduct(productData);
      }

      setIsModalOpen(false);
      setProductToEdit(null);
      return true;
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to save the product. Please try again."
      );
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(product) {
    const nextStatus = product.status === "active" ? "inactive" : "active";

    setActionError("");

    try {
      await updateProductStatus(product.id, nextStatus);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to update product status. Please try again."
      );
    }
  }

  async function handleToggleAffiliatePromotion(product) {
    if (pendingPromotionProducts.current.has(product.id)) return;
    const enabled = product.affiliatePromotionEnabled !== true;
    if (!confirmAffiliatePromotionChange(enabled)) return;

    pendingPromotionProducts.current.add(product.id);
    setPromotionPending((current) => ({ ...current, [product.id]: true }));
    setPromotionErrors((current) => ({ ...current, [product.id]: "" }));
    try {
      await updateAffiliatePromotion(product.id, enabled);
    } catch (err) {
      setPromotionErrors((current) => ({
        ...current,
        [product.id]: err instanceof Error ? err.message : "Unable to update affiliate promotion. Please try again.",
      }));
    } finally {
      pendingPromotionProducts.current.delete(product.id);
      setPromotionPending((current) => ({ ...current, [product.id]: false }));
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Archive “${product.name}”? It will be hidden from your product list.`)) return;
    try { await deleteProduct(product.id); } catch (err) { setActionError(err.message || "Unable to delete the product."); }
  }

  async function handleDuplicate(product) {
    try { await duplicateProduct(product.id); } catch (err) { setActionError(err.message || "Unable to duplicate the product."); }
  }

  return (
    <main className="min-h-screen bg-[#F7F7F4] px-4 py-6 text-[#222438] sm:px-7 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-[1440px] space-y-8">
        {/* Page heading */}
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
                Merchant workspace
              </p>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-[#222438] sm:text-4xl">
              Your products
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">
              Manage your catalogue, serve more customers, and grow your
              business.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <Link href="/" className="rounded-xl border border-[#E7E7E2] bg-white px-4 py-3 text-sm font-medium text-[#292B43] hover:bg-gray-50">Dashboard</Link>
            <LogoutButton />
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#292B43] px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <span className="text-xl leading-none">+</span>
              Add product
            </button>
          </div>
        </header>

        {/* Product model overview */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Retail"
            count={retailCount}
            description="Products for individual buyers"
            symbol="R"
            accent="indigo"
          />

          <StatCard
            title="Wholesale"
            count={wholesaleCount}
            description="Products for bulk orders"
            symbol="W"
            accent="coral"
          />

          <StatCard
            title="Subscriptions"
            count={subscriptionCount}
            description="Recurring products and services"
            symbol="S"
            accent="green"
          />
        </section>

        {/* Product catalogue */}
        <section className="overflow-hidden rounded-2xl border border-[#E9E8E2] bg-white shadow-[0_3px_16px_rgba(30,32,50,0.025)]">
          <div className="flex flex-col gap-2 border-b border-[#EEEDE8] px-5 py-5 sm:px-7 sm:py-6">
            <h2 className="text-lg font-semibold tracking-tight text-[#222438]">
              Product catalogue
            </h2>
            <p className="text-sm text-gray-500">
              Browse, update, and organize your products.
            </p>
          </div>

          <div className="p-5 sm:p-7">
            {actionError && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {actionError}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {typeof error === "string"
                  ? error
                  : "Unable to load products. Please try again."}
              </div>
            )}

            {/* Search and filter */}
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <div className="relative min-w-0 flex-1">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m16 16 4 4" />
                </svg>

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search products, classes, or categories..."
                  aria-label="Search products"
                  className="h-12 w-full rounded-xl border border-[#E7E7E2] bg-[#FBFBF9] pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                />
              </div>

              <select
                value={modelFilter}
                onChange={(event) => setModelFilter(event.target.value)}
                aria-label="Filter by product model"
                className="h-12 rounded-xl border border-[#E7E7E2] bg-white px-4 text-sm text-gray-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 sm:min-w-48"
              >
                <option value="all">All product models</option>
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
                <option value="subscription">Subscription</option>
              </select>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filter by category" className="h-12 rounded-xl border border-[#E7E7E2] bg-white px-4 text-sm">
                <option value="all">All categories</option>{[...new Set(products.map((product) => product.category || "Uncategorized"))].map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status" className="h-12 rounded-xl border border-[#E7E7E2] bg-white px-4 text-sm">
                <option value="all">All statuses</option><option value="draft">Draft</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="out of stock">Out of stock</option>
              </select>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort products" className="h-12 rounded-xl border border-[#E7E7E2] bg-white px-4 text-sm">
                <option value="newest">Newest first</option><option value="name">Name</option><option value="price">Price</option><option value="stock">Stock</option>
              </select>
            </div>

            <div className="mb-4 flex justify-end gap-2"><button type="button" onClick={() => setView("cards")} aria-pressed={view === "cards"} className={`rounded-lg px-3 py-2 text-sm ${view === "cards" ? "bg-slate-900 text-white" : "border border-slate-200"}`}>Cards</button><button type="button" onClick={() => setView("table")} aria-pressed={view === "table"} className={`rounded-lg px-3 py-2 text-sm ${view === "table" ? "bg-slate-900 text-white" : "border border-slate-200"}`}>Table</button></div>
            {view === "table" ? <ProductTable
              products={filteredProducts}
              loading={loading}
              onEdit={openEditModal}
              onToggleStatus={handleToggleStatus}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onToggleAffiliatePromotion={handleToggleAffiliatePromotion}
              promotionPending={promotionPending}
              promotionErrors={promotionErrors}
            /> : loading ? <div className="rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">Loading products…</div> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} onEdit={openEditModal} onToggleStatus={handleToggleStatus} onDuplicate={handleDuplicate} onDelete={handleDelete} onToggleAffiliatePromotion={handleToggleAffiliatePromotion} promotionPending={Boolean(promotionPending[product.id])} promotionError={promotionErrors[product.id]} />)}</div>}

              {!loading && filteredProducts.length === 0 && (
              <div className="px-4 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0EEFC] text-xl text-indigo-600">
                  +
                </div>

                <h3 className="mt-4 text-sm font-semibold text-[#222438]">
                  {search || modelFilter !== "all" || statusFilter !== "all" || categoryFilter !== "all"
                    ? "No matching products"
                    : "Your catalogue starts here"}
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                  {search || modelFilter !== "all" || statusFilter !== "all" || categoryFilter !== "all"
                    ? "Try a different search term or change the selected product model."
                    : "Add your first product to start building your Dvepo catalogue."}
                </p>

                {!search && modelFilter === "all" && statusFilter === "all" && categoryFilter === "all" && (
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="mt-5 rounded-xl bg-[#292B43] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                  >
                    Add your first product
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between gap-2 border-t border-[#EEEDE8] bg-[#FBFBF9] px-5 py-3.5 text-xs text-gray-500 sm:flex-row sm:items-center sm:px-7">
            <span>
              Showing {filteredProducts.length} of {products.length} products
            </span>
            <span>Retail · Wholesale · Subscription</span>
          </div>
        </section>
      </div>

      <ProductModal
        key={productToEdit?.id ?? "new-product"}
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        product={productToEdit}
        error={actionError}
      />
    </main>
  );
}

function StatCard({ title, count, description, symbol, accent }) {
  const accentStyles = {
    indigo: {
      icon: "bg-[#EFEDFF] text-[#6558C9]",
      dot: "bg-[#7669D8]",
    },
    coral: {
      icon: "bg-[#FFF0E9] text-[#C66B4F]",
      dot: "bg-[#E38B6B]",
    },
    green: {
      icon: "bg-[#E7F5ED] text-[#328263]",
      dot: "bg-[#50A581]",
    },
  };

  const style = accentStyles[accent] ?? accentStyles.indigo;

  return (
    <div className="rounded-2xl border border-[#E9E8E2] bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(30,32,50,0.05)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[#222438]">
            {count}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-semibold ${style.icon}`}
          aria-hidden="true"
        >
          {symbol}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 border-t border-[#F0EFEA] pt-4">
        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
        <p className="text-xs leading-5 text-gray-500">{description}</p>
      </div>
    </div>
  );
}
