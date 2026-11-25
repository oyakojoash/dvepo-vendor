"use client";
/* eslint @next/next/no-img-element: off -- product previews use local images and data URLs. */

import { useState } from "react";
import Link from "next/link";
import { useOrders } from "./Context/OrderContext";
import { useProducts } from "./Context/ProductContext";
import { useStories } from "./Context/StoryContext";
import StoryTray from "./Components/story/StoryTray";
import StoryViewer from "./Components/story/StoryViewer";
import StoryComposer from "./Components/story/StoryComposer";
import LogoutButton from "./Components/auth/LogoutButton";
import { useMerchantAuth } from "./Context/MerchantAuthContext";

const navigation = [
  { name: "Dashboard", icon: "⌂", href: "/" },
  { name: "Stores", icon: "▣", href: "/store-application" },
  { name: "Products", icon: "◇", href: "/products" },
  { name: "Orders", icon: "▤", href: "/orders" },
  { name: "Messages", icon: "✉", href: "/messages" },
  { name: "Stories", icon: "▧" },
  { name: "Monetization", icon: "↗", href: "/monetization" },
  { name: "Subscription", icon: "◈", href: "/subscription" },
  { name: "Settings", icon: "⚙", href: "/settings" },
];

const formatMoney = (amount) =>
  `KSh ${Number(amount || 0).toLocaleString("en-KE")}`;

function HomeDashboard() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openStoryId, setOpenStoryId] = useState(null);
  const [isStoryComposerOpen, setIsStoryComposerOpen] = useState(false);

  const { orders = [], stats } = useOrders();
  const { products = [], loading: productsLoading } = useProducts();
  const {
    stories = [], activeStories = [], loading: storiesLoading, error: storiesError,
    hasMore: storiesHaveMore, loadingMore: storiesLoadingMore,
    refreshStories, loadMoreStories, removeStory, recordStoryView,
  } = useStories();
  const { merchant } = useMerchantAuth();
  const [storyActionError, setStoryActionError] = useState("");

  const pendingOrders = orders.filter(
    (order) => order.orderStatus === "pending"
  ).length;

  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    )
    .slice(0, 4);

  const recentProducts = [...products]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    )
    .slice(0, 4);

  const metrics = [
    {
      label: "Total products",
      value: productsLoading ? "…" : products.length,
      icon: "◇",
    },
    {
      label: "Active products",
      value: productsLoading
        ? "…"
        : products.filter((product) => product.status === "active").length,
      icon: "✓",
    },
    {
      label: "Pending orders",
      value: stats?.pending ?? pendingOrders,
      icon: "◷",
    },
    {
      label: "Total orders",
      value: stats?.total ?? orders.length,
      icon: "▤",
    },
  ];

  const selectSection = (name) => {
    setActivePage(name);
    setMobileMenuOpen(false);

    if (name === "Stories") {
      setOpenStoryId(null);
    }
  };

  const openStory = async (story) => {
    setStoryActionError("");
    setOpenStoryId(story.id);
    const result = await recordStoryView(story.id);
    if (!result.success) setStoryActionError(result.error);
  };

  const pageDescription = {
    Dashboard: "Your business activity at a glance.",
    Stores: "Manage your merchant store profile and visibility.",
    Products: "Manage your product catalogue.",
    Orders: "Review and manage customer orders.",
    Messages: "Communicate with customers and Dvepo Administration.",
    Stories: "Create and manage your product stories.",
    Monetization: "Manage advertising and commission plans.",
    Settings: "Manage your merchant account preferences.",
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-950 text-white transition-transform duration-200 md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link
          href="/"
          onClick={() => selectSection("Dashboard")}
          className="flex h-20 shrink-0 items-center gap-3 border-b border-white/10 px-6"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-xl font-black text-slate-950">
            D
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight">dvepo</h1>
            <p className="text-xs text-slate-400">Merchant portal</p>
          </div>
        </Link>

        <div className="flex-1 overflow-y-auto px-4 pt-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = activePage === item.name;

              const linkClass = `flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition ${
                isActive
                  ? "bg-emerald-400 text-slate-950"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`;

              const content = (
                <>
                  <span className="w-5 shrink-0 text-center text-lg">
                    {item.icon}
                  </span>

                  <span className="flex-1">{item.name}</span>

                  {item.name === "Orders" && pendingOrders > 0 && (
                    <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white">
                      {pendingOrders}
                    </span>
                  )}

                  {item.name === "Stories" && activeStories.length > 0 && (
                    <span className="rounded-full bg-fuchsia-500 px-2 py-0.5 text-xs text-white">
                      {activeStories.length}
                    </span>
                  )}
                </>
              );

              if (item.href) {
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => selectSection(item.name)}
                    className={linkClass}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => selectSection(item.name)}
                  className={linkClass}
                  aria-current={isActive ? "page" : undefined}
                >
                  {content}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="shrink-0 p-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">Basic plan</span>
              <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-slate-300">
                Current
              </span>
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              One store with subscriber-only stories.
            </p>

            <Link
              href="/monetization"
              className="mt-3 block w-full rounded-lg bg-white px-3 py-2 text-center text-sm font-semibold text-slate-950 hover:bg-emerald-300"
            >
              Monetization
            </Link>
          </div>

          <p className="px-2 pt-4 text-xs text-slate-500">
            Dvepo Merchant v1.0
          </p>
        </div>
      </aside>

      {/* Main application */}
      <div className="min-h-screen md:pl-64">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setMobileMenuOpen(true)}
              className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-lg md:hidden"
            >
              ☰
            </button>

            <div className="min-w-0">
              <p className="text-xs text-slate-500">Merchant workspace</p>
              <h2 className="truncate text-lg font-bold sm:text-xl">
                {activePage}
              </h2>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 sm:inline-flex">
              {merchant?.name || "Merchant account"}
            </span>
            <div aria-label="Merchant profile" className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">
              {(merchant?.name || "M").trim().slice(0, 1).toUpperCase()}
            </div>
            <LogoutButton />
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-8 p-4 sm:p-8">
          {/* Page introduction */}
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-emerald-700">
                Merchant workspace
              </p>

              <h3 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                {activePage === "Dashboard"
                  ? `Welcome back, ${merchant?.name || "Merchant"}`
                  : activePage}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {pageDescription[activePage] || "Manage your business on Dvepo."}
              </p>
            </div>

            {activePage === "Dashboard" && (
              <Link
                href="/products"
                onClick={() => selectSection("Products")}
                className="rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                + Add a product
              </Link>
            )}

            {activePage === "Stories" && (
              <button
                type="button"
                onClick={() => setIsStoryComposerOpen(true)}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                + Create a story
              </button>
            )}

            {activePage === "Messages" && (
              <Link
                href="/messages"
                className="rounded-xl bg-emerald-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                Open message inbox →
              </Link>
            )}
          </section>

          {/* Dedicated Stories workspace */}
          {activePage === "Stories" && (
            <section className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5">
                  <h4 className="font-bold">Your Stories</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Share product photos and videos with your audience.
                  </p>
                </div>

                <StoryTray
                  onOpenStory={openStory}
                  onCreateStory={() => setIsStoryComposerOpen(true)}
                />

                {!storiesLoading && activeStories.length === 0 && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-6 text-center">
                    <p className="font-medium text-slate-700">
                      No active stories yet
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Create your first story to share an image or video with
                      your audience.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsStoryComposerOpen(true)}
                      className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Create your first story
                    </button>
                  </div>
                )}
                {storiesLoading && stories.length === 0 && <p className="mt-4 text-sm text-slate-500">Loading Story history...</p>}
                {storiesError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{storiesError}</p>}
                {storyActionError && <p role="alert" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{storyActionError}</p>}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><h4 className="font-bold">Story history</h4><p className="mt-1 text-sm text-slate-500">Active and expired Stories from your merchant account.</p></div>
                  <button type="button" onClick={() => void refreshStories()} disabled={storiesLoading} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">{storiesLoading ? "Refreshing..." : "Refresh"}</button>
                </div>
                {stories.length === 0 && !storiesLoading ? <p className="mt-4 text-sm text-slate-500">No Stories in your history yet.</p> : (
                  <ul className="mt-4 divide-y divide-slate-100">
                    {stories.map((story) => {
                      const active = activeStories.some((item) => item.id === story.id);
                      return <li key={story.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <button type="button" onClick={() => void openStory(story)} className="min-w-0 flex-1 text-left">
                          <span className="block truncate text-sm font-semibold text-slate-900">{story.caption || (story.mediaType === "video" ? "Video Story" : "Image Story")}</span>
                          <span className="mt-1 block text-xs text-slate-500">{active ? "Active" : "Expired"} · {story.createdAt ? new Date(story.createdAt).toLocaleString() : "Date unavailable"}</span>
                        </button>
                        <span className="text-xs text-slate-500">{typeof story.viewsCount === "number" ? `${story.viewsCount} views` : "Views unavailable"}</span>
                      </li>;
                    })}
                  </ul>
                )}
                {storiesHaveMore && <button type="button" onClick={() => void loadMoreStories()} disabled={storiesLoadingMore} className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">{storiesLoadingMore ? "Loading..." : "Load more history"}</button>}
              </div>
            </section>
          )}

          {/* Dedicated Messages workspace */}
          {activePage === "Messages" && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-2xl text-emerald-700">
                  ✉
                </div>

                <div className="flex-1">
                  <h4 className="font-bold">Customer and administration messages</h4>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Open the mock inbox to view conversations, send test
                    messages, and simulate incoming replies.
                  </p>
                </div>

                <Link
                  href="/messages"
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Go to inbox →
                </Link>
              </div>

              <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                Mock mode: messages are for frontend testing and are not sent
                to real customers or Dvepo Administration.
              </p>
            </section>
          )}

          {/* Dashboard content */}
          {activePage === "Dashboard" && (
            <>
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5">
                  <h4 className="font-bold">Your Stories</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Share product photos and videos with your audience.
                  </p>
                </div>

                <StoryTray
                  onOpenStory={openStory}
                  onCreateStory={() => setIsStoryComposerOpen(true)}
                />

                {activeStories.length === 0 && (
                  <p className="mt-4 text-sm text-slate-500">
                    No active stories yet. Add an image or video to get started.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => selectSection("Stories")}
                  className="mt-5 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  Manage all stories →
                </button>
              </section>

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => (
                  <article
                    key={metric.label}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-500">
                        {metric.label}
                      </p>
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-lg text-emerald-700">
                        {metric.icon}
                      </span>
                    </div>

                    <p className="mt-4 text-2xl font-bold tracking-tight">
                      {metric.value}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      Current workspace data
                    </p>
                  </article>
                ))}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold">Recent products</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Your latest catalogue updates
                    </p>
                  </div>

                  <Link
                    href="/products"
                    onClick={() => selectSection("Products")}
                    className="text-sm font-semibold text-emerald-700"
                  >
                    Manage products →
                  </Link>
                </div>

                {recentProducts.length ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {recentProducts.map((product, index) => {
                      const image =
                        product.images?.find((item) => item.primary) ||
                        product.images?.[0];

                      const price =
                        product.retail?.price ??
                        product.wholesale?.unitPrice ??
                        product.subscription?.price;

                      return (
                        <Link
                          href="/products"
                          onClick={() => selectSection("Products")}
                          key={product.id ?? product._id ?? `${product.name}-${index}`}
                          className="overflow-hidden rounded-xl border border-slate-200 hover:border-emerald-300"
                        >
                          <div className="h-32 bg-gradient-to-br from-emerald-50 to-indigo-100">
                            {image?.src ? (
                              <img
                                src={image.src}
                                alt={product.name || "Product"}
                                className="h-full w-full object-cover"
                                onError={(event) => {
                                  event.currentTarget.onerror = null;
                                  event.currentTarget.src =
                                    "/product-image-fallback.svg";
                                }}
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-2xl text-emerald-700">
                                ◇
                              </div>
                            )}
                          </div>

                          <div className="p-3">
                            <p className="truncate text-sm font-semibold">
                              {product.name}
                            </p>
                            <p className="mt-1 text-xs capitalize text-slate-500">
                              {product.model || "Product"} · {product.status || "draft"}
                            </p>
                            <p className="mt-2 text-sm font-semibold">
                              {formatMoney(price)}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                    {productsLoading
                      ? "Loading products…"
                      : "No products yet. Add your first product to get started."}
                  </p>
                )}
              </section>

              <section className="grid gap-5 lg:grid-cols-3">
                <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-1">
                  <div className="flex h-32 items-end bg-gradient-to-br from-slate-900 via-emerald-950 to-emerald-700 p-5 text-white">
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                      Storefront preview
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 font-bold text-emerald-800">
                        U
                      </div>
                      <div>
                        <h4 className="font-bold">Urban Finds</h4>
                        <p className="text-xs text-slate-500">Retail · Nairobi</p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      Everyday finds, selected for modern living. A sample
                      storefront identity for your Dvepo shop.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">
                        New arrivals
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">
                        Best sellers
                      </span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                        Preview only
                      </span>
                    </div>
                  </div>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold">Social selling previews</h4>
                      <p className="mt-1 text-sm text-slate-500">
                        Product-linked story and promotion concepts
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                      No external publishing
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {recentProducts.slice(0, 2).map((product, index) => {
                      const image =
                        product.images?.find((item) => item.primary) ||
                        product.images?.[0];

                      return (
                        <div
                          key={product.id ?? product._id ?? product.name}
                          className="relative flex min-h-44 flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-slate-800 to-indigo-900 p-4 text-white"
                        >
                          {image?.src && (
                            <img
                              src={image.src}
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover opacity-40"
                              onError={(event) => {
                                event.currentTarget.onerror = null;
                                event.currentTarget.src =
                                  "/product-image-fallback.svg";
                              }}
                            />
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                          <div className="relative">
                            <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold">
                              {index === 0 ? "Featured" : "Draft preview"}
                            </span>
                            <h5 className="mt-3 font-semibold">
                              {product.name}
                            </h5>
                            <p className="mt-1 line-clamp-1 text-xs text-white/80">
                              {product.description ||
                                `Discover ${product.name} at Urban Finds.`}
                            </p>
                            <Link
                              href="/products"
                              onClick={() => selectSection("Products")}
                              className="mt-3 inline-flex rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-900"
                            >
                              View product
                            </Link>
                          </div>
                        </div>
                      );
                    })}

                    {!recentProducts.length && (
                      <p className="rounded-xl bg-slate-50 p-6 text-sm text-slate-500 sm:col-span-2">
                        Add products to create story and campaign previews.
                      </p>
                    )}
                  </div>
                </article>
              </section>

              <section className="grid gap-6 xl:grid-cols-3">
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h4 className="font-bold">Sales overview</h4>
                      <p className="mt-1 text-sm text-slate-500">
                        Illustrative sales activity for the past week
                      </p>
                    </div>

                    <span className="w-fit rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
                      Last 7 days
                    </span>
                  </div>

                  <div className="mt-8 flex h-48 items-end justify-between gap-3 border-b border-slate-100 pb-2">
                    {[42, 68, 48, 85, 58, 74, 95].map((height, index) => (
                      <div
                        key={index}
                        className="flex h-full flex-1 flex-col justify-end"
                      >
                        <div
                          title={`Illustrative sales: ${height}%`}
                          style={{ height: `${height}%` }}
                          className="w-full rounded-t-md bg-emerald-400 transition hover:bg-emerald-600"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex justify-between text-xs text-slate-400">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                      (day) => (
                        <span key={day}>{day}</span>
                      )
                    )}
                  </div>

                  <p className="mt-4 text-xs text-slate-400">
                    Demo visualization only — not connected to actual sales.
                  </p>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <h4 className="font-bold">Store profile</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Your merchant store
                  </p>

                  <div className="mt-6 rounded-xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold">Store information and visibility</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Manage your store name, profile, operating status, and storefront visibility in Settings.
                    </p>
                  </div>

                  <Link
                    href="/settings"
                    className="mt-5 inline-flex w-full justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50"
                  >
                    Manage store profile →
                  </Link>
                </article>
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
                  <div>
                    <h4 className="font-bold">Recent orders</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      A quick look at your latest customer orders.
                    </p>
                  </div>

                  <Link
                    href="/orders"
                    onClick={() => selectSection("Orders")}
                    className="w-fit text-sm font-semibold text-emerald-700 hover:text-emerald-900"
                  >
                    View all orders →
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[750px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Order</th>
                        <th className="px-6 py-4 font-semibold">Customer</th>
                        <th className="px-6 py-4 font-semibold">Product</th>
                        <th className="px-6 py-4 font-semibold">Amount</th>
                        <th className="px-6 py-4 font-semibold">Type</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {recentOrders.map((order, index) => (
                        <tr
                          key={order.id ?? order._id ?? `order-${index}`}
                          className="hover:bg-slate-50/70"
                        >
                          <td className="whitespace-nowrap px-6 py-4 font-semibold">
                            {order.id ?? order._id ?? "—"}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                            {order.customer?.name || "Customer"}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {(order.items || [])
                              .map((item) => item.name)
                              .filter(Boolean)
                              .join(", ") || "—"}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 font-medium">
                            {formatMoney(order.total)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                                order.orderType === "affiliate"
                                  ? "bg-purple-50 text-purple-700"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {order.orderType === "affiliate"
                                ? "Affiliate"
                                : "Direct"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                                order.orderStatus === "delivered"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : order.orderStatus === "rejected"
                                    ? "bg-rose-50 text-rose-700"
                                    : order.orderStatus === "pending"
                                      ? "bg-amber-50 text-amber-700"
                                      : "bg-sky-50 text-sky-700"
                              }`}
                            >
                              {order.orderStatus || "unknown"}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {recentOrders.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-10 text-center text-slate-500"
                          >
                            No orders yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-slate-100 px-6 py-4 text-xs text-slate-400">
                  Mock data for frontend development.
                </div>
              </section>
            </>
          )}

          {/* Other sections remain clearly identified as placeholders */}
          {!["Dashboard", "Stories", "Messages", "Products", "Orders"].includes(
            activePage
          ) && (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
              <p className="font-semibold text-emerald-950">
                {activePage} workspace
              </p>

              {activePage === "Stores" ? (
                <>
                  <p className="mt-1 text-sm leading-6 text-emerald-900">
                    Your store profile, business details, visibility, and operating status are managed in Settings.
                  </p>
                  <Link href="/settings" className="mt-3 inline-flex rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
                    Open store profile
                  </Link>
                </>
              ) : (
                <>
                  <p className="mt-1 text-sm leading-6 text-emerald-900">
                    This section is a placeholder in version 1.0. Its dedicated
                    functionality can be built separately without affecting your
                    dashboard, Stories, or Messages.
                  </p>
                  <button
                    type="button"
                    onClick={() => selectSection("Dashboard")}
                    className="mt-3 text-sm font-semibold text-emerald-900 underline"
                  >
                    Back to dashboard
                  </button>
                </>
              )}
            </section>
          )}

          {/* Products and Orders have dedicated routes */}
          {["Products", "Orders"].includes(activePage) && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h4 className="font-bold">{activePage} management</h4>
              <p className="mt-2 text-sm text-slate-500">
                Open the dedicated {activePage.toLowerCase()} page to manage
                your records.
              </p>

              <Link
                href={activePage === "Products" ? "/products" : "/orders"}
                className="mt-4 inline-flex rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Open {activePage.toLowerCase()} →
              </Link>
            </section>
          )}
        </main>
      </div>

      {/* Story viewer */}
      {openStoryId && (
        <StoryViewer
          stories={stories}
          initialStoryId={openStoryId}
          onClose={() => setOpenStoryId(null)}
          onDelete={removeStory}
          onView={recordStoryView}
          initialError={storyActionError}
        />
      )}

      {/* Story composer */}
      {isStoryComposerOpen && (
        <StoryComposer onClose={() => setIsStoryComposerOpen(false)} />
      )}
    </div>
  );
}

export default function Home() {
  return <HomeDashboard />;
}
