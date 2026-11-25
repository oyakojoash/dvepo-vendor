"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useProducts } from "../Context/ProductContext";
import { useStories } from "../Context/StoryContext";
import {
  COMMISSION_PLANS,
  MONETIZATION_PRICING,
  TRENDING_GROUPS,
} from "../Services/monetizationConfig";
import { monetizationService } from "../Services/monetizationService";
import LogoutButton from "../Components/auth/LogoutButton";

const money = (amount) => `${MONETIZATION_PRICING.currency} ${Number(amount).toLocaleString("en-KE")}`;
const inputStyle =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";
const cardStyle = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6";

function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateValue, days) {
  if (!dateValue) return "";
  const date = new Date(`${dateValue}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localDateValue(date);
}

function displayDate(value) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function StatusPill({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    amber: "bg-amber-100 text-amber-900",
    emerald: "bg-emerald-100 text-emerald-800",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

function Notice({ children, kind = "info" }) {
  const styles = kind === "warning"
    ? "border-amber-200 bg-amber-50 text-amber-950"
    : "border-sky-200 bg-sky-50 text-sky-950";
  return <div className={`rounded-xl border px-4 py-3 text-sm leading-6 ${styles}`}>{children}</div>;
}

function MonetizationWorkspace() {
  const { products = [], loading: productsLoading, error: productsError } = useProducts();
  const { activeStories = [] } = useStories();
  const [section, setSection] = useState("Overview");
  const [packageId, setPackageId] = useState("story");
  const [selectedStories, setSelectedStories] = useState([]);
  const [targetType, setTargetType] = useState("product");
  const [targetId, setTargetId] = useState("");
  const [groupId, setGroupId] = useState(TRENDING_GROUPS[0].id);
  const [startDate, setStartDate] = useState(localDateValue());
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [records, setRecords] = useState(() => monetizationService.listDemoRecords());
  const [confirming, setConfirming] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const submitLock = useRef(false);
  const advertisingAttemptKey = useRef(null);
  const subscriptionAttemptKey = useRef(null);

  const eligibleProducts = useMemo(
    () => products.filter((product) => product.status === "active"),
    [products]
  );
  const storeIds = useMemo(
    () => [...new Set(eligibleProducts.map((product) => product.storeId).filter(Boolean))],
    [eligibleProducts]
  );
  const selectedProduct = eligibleProducts.find((product) => product.id === targetId);
  const selectedStore = storeIds.includes(targetId) ? targetId : "";
  const selectedGroup = TRENDING_GROUPS.find((group) => group.id === groupId);
  const selectedPlan = COMMISSION_PLANS.find((plan) => plan.id === selectedPlanId);
  const selectedStoryItems = activeStories.filter((story) => selectedStories.includes(story.id));

  const requiresStories = packageId === "story" || packageId === "bundle";
  const requiresTrending = packageId === "trending" || packageId === "bundle";
  const storyDays = packageId === "bundle"
    ? MONETIZATION_PRICING.bundle.storyDurationDays
    : MONETIZATION_PRICING.story.durationDays;
  const trendingDays = packageId === "bundle"
    ? MONETIZATION_PRICING.bundle.trendingDurationDays
    : MONETIZATION_PRICING.trending.durationDays;
  // A bundle uses its independent configured total; never add individual prices.
  const total = packageId === "story"
    ? MONETIZATION_PRICING.story.price
    : packageId === "trending"
      ? MONETIZATION_PRICING.trending.price
      : MONETIZATION_PRICING.bundle.price;
  const proposedEndDate = addDays(startDate, trendingDays - 1);
  const selectedTargetLabel = selectedProduct
    ? selectedProduct.name
    : selectedStore
      ? `Store ${selectedStore}`
      : "";
  const selectionError = productsError
    ? "Products could not be loaded. Refresh the page and try again."
    : productsLoading && requiresTrending
      ? "Product and store options are still loading."
      : requiresStories && selectedStories.length === 0
        ? "Select at least one active Story for this package."
        : requiresTrending && (!targetId || !selectedGroup || !startDate)
          ? "Select a product or store, placement group, and proposed start date."
          : "";

  const setPage = (next) => {
    setSection(next);
    setNotice("");
    setError("");
  };

  const toggleStory = (storyId) => {
    setSelectedStories((current) => current.includes(storyId)
      ? current.filter((id) => id !== storyId)
      : [...current, storyId]);
  };

  const openAdConfirmation = () => {
    setNotice("");
    setError("");
    if (selectionError) {
      setError(selectionError);
      return;
    }
    advertisingAttemptKey.current ||= `ad-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setConfirming("advertising");
  };

  const createAdRequest = () => {
    if (submitLock.current) return;
    submitLock.current = true;
    setSubmitting(true);
    setError("");
    try {
      const lineItems = [];
      if (packageId === "story" || packageId === "bundle") {
        lineItems.push({
          label: `Story promotion (${storyDays} days)`,
          detail: selectedStoryItems.map((story) => story.caption || story.id).join(", "),
          amount: packageId === "bundle" ? null : MONETIZATION_PRICING.story.price,
        });
      }
      if (packageId === "trending" || packageId === "bundle") {
        lineItems.push({
          label: `Trending Page placement (${trendingDays} days)`,
          detail: `${selectedTargetLabel} · ${selectedGroup.label} · ${selectedGroup.positions}`,
          amount: packageId === "bundle" ? null : MONETIZATION_PRICING.trending.price,
        });
      }
      const description = packageId === "bundle"
        ? "Combined Story + Trending package"
        : packageId === "story"
          ? "Story promotion"
          : "Trending Page placement";
      const created = monetizationService.createAdvertisingRequest({
        idempotencyKey: advertisingAttemptKey.current,
        packageId,
        amount: total,
        description,
        lineItems,
        targetLabel: requiresTrending ? selectedTargetLabel : "",
        placementGroup: requiresTrending ? selectedGroup.label : "",
        proposedStartDate: requiresTrending ? startDate : "",
        proposedEndDate: requiresTrending ? proposedEndDate : "",
      });
      setRecords(monetizationService.listDemoRecords());
      setConfirming(null);
      advertisingAttemptKey.current = null;
      setNotice(`Demo request saved as Pending Payment for ${money(created.amount)}. No payment was processed and no campaign was activated.`);
      setSection("Billing History");
    } catch (requestError) {
      setError(requestError.message || "The demo request could not be saved.");
    } finally {
      setSubmitting(false);
      submitLock.current = false;
    }
  };

  const createPlanRequest = () => {
    if (!selectedPlan || submitLock.current) return;
    submitLock.current = true;
    setSubmitting(true);
    setError("");
    try {
      const created = monetizationService.createSubscriptionRequest(selectedPlan, subscriptionAttemptKey.current);
      setRecords(monetizationService.listDemoRecords());
      setConfirming(null);
      subscriptionAttemptKey.current = null;
      setNotice(`Demo request saved for ${money(created.amount)} per month. The plan is not active because no payment was processed.`);
      setSection("Billing History");
    } catch (requestError) {
      setError(requestError.message || "The demo request could not be saved.");
    } finally {
      setSubmitting(false);
      submitLock.current = false;
    }
  };

  const advertisingRecords = records.filter((record) => record.type === "advertising");
  const subscriptionRecords = records.filter((record) => record.type === "subscription");
  const tabs = ["Overview", "Advertising", "Commission Subscription", "Billing History"];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-xl font-black text-slate-950">D</span>
            <span><span className="block text-lg font-bold">dvepo</span><span className="block text-xs text-slate-500">Merchant portal</span></span>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-800">Back to dashboard</Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-8 sm:py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Merchant workspace / Monetization</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Monetization</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Optional advertising and commission plans. Creating and operating your store remains free.</p>
          </div>
          <StatusPill tone="amber">Prototype pricing · Demo only</StatusPill>
        </div>

        <Notice kind="warning">No payment provider, billing API, authenticated merchant service, or placement availability check is connected. Prices below are configured development defaults. Demo requests stay in this browser, remain unpaid, and never activate or reserve campaigns.</Notice>

        {(notice || error) && (
          <div role={error ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm leading-6 ${error ? "border-rose-200 bg-rose-50 text-rose-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>
            {error || notice}
          </div>
        )}

        <nav aria-label="Monetization sections" className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2">
          {tabs.map((tab) => (
            <button key={tab} type="button" onClick={() => setPage(tab)} aria-current={section === tab ? "page" : undefined} className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${section === tab ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}>
              {tab}
            </button>
          ))}
        </nav>

        {section === "Overview" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <article className={cardStyle}><p className="text-sm text-slate-500">Store access</p><p className="mt-2 text-2xl font-bold">Free</p><p className="mt-1 text-xs leading-5 text-slate-500">No listing or storefront access fee.</p></article>
              <article className={cardStyle}><p className="text-sm text-slate-500">Story promotion</p><p className="mt-2 text-2xl font-bold">{money(MONETIZATION_PRICING.story.price)}</p><p className="mt-1 text-xs leading-5 text-slate-500">One package · {MONETIZATION_PRICING.story.durationDays} days.</p></article>
              <article className={cardStyle}><p className="text-sm text-slate-500">Trending placement</p><p className="mt-2 text-2xl font-bold">{money(MONETIZATION_PRICING.trending.price)}</p><p className="mt-1 text-xs leading-5 text-slate-500">One campaign · {MONETIZATION_PRICING.trending.durationDays} days.</p></article>
              <article className={cardStyle}><p className="text-sm text-slate-500">Combined package</p><p className="mt-2 text-2xl font-bold">{money(MONETIZATION_PRICING.bundle.price)}</p><p className="mt-1 text-xs leading-5 text-slate-500">Trending {MONETIZATION_PRICING.bundle.trendingDurationDays} days + Stories {MONETIZATION_PRICING.bundle.storyDurationDays} days.</p></article>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <section className={cardStyle}>
                <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold">Advertising</h2><p className="mt-1 text-sm text-slate-500">Pick a single service or use the combined price.</p></div><span aria-hidden="true" className="text-2xl">↗</span></div>
                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-4 border-b border-slate-100 pb-3"><span>Story promotion · {MONETIZATION_PRICING.story.durationDays} days</span><strong>{money(MONETIZATION_PRICING.story.price)}</strong></div>
                  <div className="flex justify-between gap-4 border-b border-slate-100 pb-3"><span>Trending placement · {MONETIZATION_PRICING.trending.durationDays} days</span><strong>{money(MONETIZATION_PRICING.trending.price)}</strong></div>
                  <div className="flex justify-between gap-4"><span>Combined · Story {MONETIZATION_PRICING.bundle.storyDurationDays} days + Trending {MONETIZATION_PRICING.bundle.trendingDurationDays} days</span><strong>{money(MONETIZATION_PRICING.bundle.price)} total</strong></div>
                </div>
                <button type="button" onClick={() => setPage("Advertising")} className="mt-5 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">Set up advertising</button>
              </section>
              <section className={cardStyle}>
                <h2 className="text-lg font-bold">Commission subscription</h2>
                <p className="mt-1 text-sm text-slate-500">A separate monthly plan sets the commission rate for eligible future orders.</p>
                <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 p-4"><span className="text-sm text-slate-600">Current confirmed plan</span><StatusPill>No active plan data</StatusPill></div>
                <p className="mt-3 text-xs leading-5 text-slate-500">No next renewal date is shown because there is no subscription billing data.</p>
                <button type="button" onClick={() => setPage("Commission Subscription")} className="mt-5 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">View commission plans</button>
              </section>
            </div>
            <section className={cardStyle}><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-lg font-bold">Billing activity</h2><p className="mt-1 text-sm text-slate-500">Only demo requests created in this browser appear here.</p></div><button type="button" onClick={() => setPage("Billing History")} className="w-fit text-sm font-semibold text-emerald-800 hover:underline">Open billing history →</button></div><p className="mt-4 text-sm text-slate-600">{records.length ? `${records.length} local demo ${records.length === 1 ? "record" : "records"}` : "No billing records yet."}</p></section>
          </div>
        )}

        {section === "Advertising" && (
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <section className={cardStyle}>
                <div><h2 className="text-xl font-bold">Choose an advertising package</h2><p className="mt-1 text-sm text-slate-500">Each option is optional. The combined package is one {money(MONETIZATION_PRICING.bundle.price)} total.</p></div>
                <fieldset className="mt-5 grid gap-3 md:grid-cols-3">
                  <legend className="sr-only">Advertising package</legend>
                  {[
                    { id: "story", title: "Story promotion", text: `${MONETIZATION_PRICING.story.durationDays} days`, price: MONETIZATION_PRICING.story.price },
                    { id: "trending", title: "Trending placement", text: `${MONETIZATION_PRICING.trending.durationDays} days`, price: MONETIZATION_PRICING.trending.price },
                    { id: "bundle", title: "Story + Trending", text: `${MONETIZATION_PRICING.bundle.storyDurationDays}-day Stories · ${MONETIZATION_PRICING.bundle.trendingDurationDays}-day Trending`, price: MONETIZATION_PRICING.bundle.price },
                  ].map((option) => (
                    <label key={option.id} className={`cursor-pointer rounded-xl border p-4 transition ${packageId === option.id ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20" : "border-slate-200 hover:border-slate-300"}`}>
                      <input className="sr-only" type="radio" name="ad-package" value={option.id} checked={packageId === option.id} onChange={() => setPackageId(option.id)} />
                      <span className="flex items-start justify-between gap-2"><span className="font-semibold">{option.title}</span>{packageId === option.id && <span aria-label="Selected" className="text-emerald-700">✓</span>}</span>
                      <span className="mt-2 block text-xs text-slate-500">{option.text}</span>
                      <span className="mt-4 block text-xl font-bold">{money(option.price)}</span>
                      {option.id === "bundle" && <span className="mt-1 block text-xs font-medium text-emerald-800">Combined total, no add-on charges</span>}
                    </label>
                  ))}
                </fieldset>
              </section>

              {requiresStories && (
                <section className={cardStyle}>
                  <h2 className="font-bold">Choose active Stories</h2>
                  <p className="mt-1 text-sm text-slate-500">{packageId === "bundle" ? `The combined package includes selected Stories for ${storyDays} days.` : `One KSh ${MONETIZATION_PRICING.story.price} package covers the selected Stories for ${storyDays} days.`}</p>
                  {activeStories.length ? (
                    <fieldset className="mt-4 grid gap-2 sm:grid-cols-2">
                      <legend className="sr-only">Eligible Stories</legend>
                      {activeStories.map((story) => (
                        <label key={story.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
                          <input type="checkbox" checked={selectedStories.includes(story.id)} onChange={() => toggleStory(story.id)} className="mt-1 h-4 w-4 accent-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600" />
                          <span className="min-w-0"><span className="block text-sm font-medium text-slate-800">{story.caption || "Untitled Story"}</span><span className="mt-1 block text-xs text-slate-500">{story.mediaType} · Active until its 24-hour expiry</span></span>
                        </label>
                      ))}
                    </fieldset>
                  ) : <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No eligible active Stories. Publish a Story from the Stories section first.</p>}
                </section>
              )}

              {requiresTrending && (
                <section className={cardStyle}>
                  <h2 className="font-bold">Trending placement details</h2>
                  <p className="mt-1 text-sm text-slate-500">The same configured price applies to every placement group.</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-medium text-slate-700">Promoted item
                      <select className={inputStyle} value={`${targetType}:${targetId}`} onChange={(event) => { const [nextType, nextId] = event.target.value.split(":"); setTargetType(nextType); setTargetId(nextId); }} disabled={productsLoading}>
                        <option value="product:">Choose a product or store</option>
                        {eligibleProducts.map((product) => <option key={product.id} value={`product:${product.id}`}>Product · {product.name}</option>)}
                        {storeIds.map((storeId) => <option key={storeId} value={`store:${storeId}`}>Store · {storeId}</option>)}
                      </select>
                      {productsLoading && <span role="status" className="mt-1 block text-xs font-normal text-slate-500">Loading products and stores…</span>}
                      {productsError && <span role="alert" className="mt-1 block text-xs font-normal text-rose-700">{productsError}</span>}
                      {!productsLoading && !productsError && eligibleProducts.length === 0 && <span className="mt-1 block text-xs font-normal text-slate-500">No active products or stores are available yet.</span>}
                    </label>
                    <label className="text-sm font-medium text-slate-700">Placement group
                      <select className={inputStyle} value={groupId} onChange={(event) => setGroupId(event.target.value)}>
                        {TRENDING_GROUPS.map((group) => <option key={group.id} value={group.id}>{group.label} · {group.positions}</option>)}
                      </select>
                    </label>
                    <label className="text-sm font-medium text-slate-700">Proposed start date
                      <input className={inputStyle} type="date" min={localDateValue()} value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                    </label>
                    <div className="text-sm font-medium text-slate-700">Proposed end date<span className="mt-1 block rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 font-normal text-slate-700">{displayDate(proposedEndDate)}</span></div>
                  </div>
                  <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950">Prototype placement: slot availability cannot be checked. This selection does not reserve a position. If connected later, availability checks must complete on the server before payment and activation.</div>
                </section>
              )}
            </div>

            <aside className={`${cardStyle} xl:sticky xl:top-6`} aria-label="Advertising order summary">
              <p className="text-sm font-semibold text-emerald-700">Order summary</p>
              <h2 className="mt-1 text-xl font-bold">{packageId === "story" ? "Story promotion" : packageId === "trending" ? "Trending placement" : "Combined package"}</h2>
              <div className="mt-5 space-y-3 border-b border-slate-100 pb-4 text-sm">
                {requiresStories && <div className="flex justify-between gap-3"><span className="text-slate-600">Story promotion · {storyDays} days</span><strong>{packageId === "bundle" ? "Included" : money(MONETIZATION_PRICING.story.price)}</strong></div>}
                {requiresTrending && <div className="flex justify-between gap-3"><span className="text-slate-600">Trending placement · {trendingDays} days</span><strong>{packageId === "bundle" ? "Included" : money(MONETIZATION_PRICING.trending.price)}</strong></div>}
              </div>
              {requiresStories && <div className="mt-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected Stories</p><p className="mt-1 text-sm text-slate-700">{selectedStoryItems.length ? selectedStoryItems.map((story) => story.caption || story.id).join(", ") : "None selected"}</p></div>}
              {requiresTrending && <div className="mt-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trending details</p><p className="mt-1 text-sm text-slate-700">{selectedTargetLabel || "No product or store selected"}<br />{selectedGroup?.label || "No group selected"}<br />{displayDate(startDate)} – {displayDate(proposedEndDate)}</p><p className="mt-2 text-xs text-slate-500">Promoted content label required if placement is activated.</p></div>}
              <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"><span className="text-slate-600">Payment status</span><StatusPill tone="amber">Not processed</StatusPill></div>
              <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4"><span className="text-sm font-medium text-slate-600">Total</span><strong className="text-2xl">{money(total)}</strong></div>
              {packageId === "bundle" && <p className="mt-2 text-xs leading-5 text-slate-500">The KSh {MONETIZATION_PRICING.bundle.price} bundle total is configured independently; individual services are not added on top.</p>}
              <button type="button" onClick={openAdConfirmation} disabled={submitting || productsLoading && requiresTrending} className="mt-5 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">Review demo request</button>
              <p className="mt-3 text-xs leading-5 text-slate-500">No charge will be made. Confirmation creates only a browser-local Pending Payment demo request.</p>
            </aside>
          </div>
        )}

        {section === "Commission Subscription" && (
          <div className="space-y-6">
            <section className={cardStyle}>
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><h2 className="text-xl font-bold">Commission plans</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Choose a separate monthly plan. Commission changes require server-confirmed payment and an effective date; historical order calculations will not be changed.</p></div><StatusPill>No active plan data</StatusPill></div>
              <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">Current plan: <strong>None confirmed</strong> · Payment status: <strong>Unavailable</strong>. Renewal date is unavailable because no subscription data is connected.</p>
            </section>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {COMMISSION_PLANS.map((plan) => (
                <label key={plan.id} className={`cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition ${selectedPlanId === plan.id ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200 hover:border-slate-300"}`}>
                  <input className="sr-only" type="radio" name="commission-plan" value={plan.id} checked={selectedPlanId === plan.id} onChange={() => setSelectedPlanId(plan.id)} />
                  <span className="flex items-center justify-between text-sm font-semibold text-slate-600"><span>{plan.rate}% commission</span>{selectedPlanId === plan.id && <span aria-label="Selected" className="text-emerald-700">✓</span>}</span>
                  <span className="mt-4 block text-2xl font-bold">{money(plan.monthlyPrice)}</span>
                  <span className="mt-1 block text-sm text-slate-500">per month</span>
                  <span className="mt-4 block text-xs leading-5 text-slate-500">Not active until server-confirmed payment and effective date.</span>
                </label>
              ))}
            </div>
            <section className={`${cardStyle} flex flex-col justify-between gap-4 sm:flex-row sm:items-center`}>
              <div><p className="font-semibold">{selectedPlan ? `${money(selectedPlan.monthlyPrice)} per month · ${selectedPlan.rate}% commission` : "Select a plan to review it"}</p><p className="mt-1 text-sm text-slate-500">This request is separate from advertising and does not affect past orders.</p></div>
              <button type="button" disabled={!selectedPlan || submitting} onClick={() => { setError(""); setNotice(""); subscriptionAttemptKey.current ||= `subscription-${selectedPlan.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; setConfirming("subscription"); }} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">Review plan request</button>
            </section>
          </div>
        )}

        {section === "Billing History" && (
          <div className="space-y-6">
            <Notice>Demonstration records are stored only in this browser. They are unpaid requests, not invoices, receipts, transaction references, or verified payment history. No mock billing rows are preloaded.</Notice>
            {records.length === 0 ? (
              <section className={`${cardStyle} py-12 text-center`}><span aria-hidden="true" className="text-3xl">▤</span><h2 className="mt-3 font-bold">No billing activity yet</h2><p className="mt-1 text-sm text-slate-500">A demo request you create will appear here with its payment status.</p><button type="button" onClick={() => setPage("Advertising")} className="mt-4 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Explore advertising</button></section>
            ) : (
              <section className={`${cardStyle} overflow-hidden`}>
                <div className="mb-4"><h2 className="text-lg font-bold">Browser-local demo records</h2><p className="mt-1 text-sm text-slate-500">Each combined order is one record and one total.</p></div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left text-sm">
                    <thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><th scope="col" className="pb-3 pr-4 font-semibold">Date</th><th scope="col" className="pb-3 pr-4 font-semibold">Purchase</th><th scope="col" className="pb-3 pr-4 font-semibold">Amount</th><th scope="col" className="pb-3 pr-4 font-semibold">Payment</th><th scope="col" className="pb-3 font-semibold">Reference / receipt</th></tr></thead>
                    <tbody>{records.map((record) => (
                      <tr key={record.id} className="border-b border-slate-100 align-top last:border-0">
                        <td className="py-4 pr-4 text-slate-600">{new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(record.createdAt))}</td>
                        <td className="py-4 pr-4"><p className="font-semibold text-slate-900">{record.description}</p>{record.type === "advertising" && record.lineItems?.map((item, index) => <p key={`${record.id}-item-${index}`} className="mt-1 text-xs leading-5 text-slate-500">{item.label}{item.detail ? ` · ${item.detail}` : ""}{item.amount ? ` · ${money(item.amount)}` : " · Included in bundle"}</p>)}{record.type === "advertising" && record.targetLabel && <p className="mt-1 text-xs text-slate-500">{record.targetLabel} · {record.placementGroup} · proposed {displayDate(record.proposedStartDate)} – {displayDate(record.proposedEndDate)}</p>}<p className="mt-1 text-xs text-slate-500">{record.type === "subscription" ? "Commission subscription request" : record.demo ? "Demo advertising order" : "Advertising order"}</p></td>
                        <td className="py-4 pr-4 font-semibold">{money(record.amount)}</td>
                        <td className="py-4 pr-4"><StatusPill tone="amber">{record.paymentStatus}</StatusPill><p className="mt-1 text-xs text-slate-500">{record.campaignStatus || record.subscriptionStatus}</p></td>
                        <td className="py-4 text-xs text-slate-500">No transaction reference or receipt</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2"><p>Advertising requests: <strong>{advertisingRecords.length}</strong></p><p>Commission plan requests: <strong>{subscriptionRecords.length}</strong></p></div>
              </section>
            )}
          </div>
        )}
      </main>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-3 sm:items-center sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) setConfirming(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Demo only · no payment</p>
            <h2 id="confirm-title" className="mt-2 text-xl font-bold">Confirm {confirming === "advertising" ? "advertising request" : "commission plan request"}</h2>
            {confirming === "advertising" ? (
              <div className="mt-4 space-y-3 text-sm text-slate-600"><p>Package: <strong className="text-slate-900">{packageId === "story" ? "Story promotion" : packageId === "trending" ? "Trending placement" : "Combined Story + Trending"}</strong></p>{requiresStories && <p>Stories: <strong className="text-slate-900">{selectedStoryItems.map((story) => story.caption || story.id).join(", ")}</strong> · {storyDays} days</p>}{requiresTrending && <p>Placement: <strong className="text-slate-900">{selectedTargetLabel} · {selectedGroup.label}</strong> · {displayDate(startDate)} to {displayDate(proposedEndDate)}</p>}<p>Total: <strong className="text-lg text-slate-950">{money(total)}</strong></p><p className="rounded-xl bg-amber-50 p-3 leading-5 text-amber-950">This only saves an unpaid local demo request. It will not charge you, reserve a slot, create a receipt, or activate a campaign.</p></div>
            ) : (
              <div className="mt-4 space-y-3 text-sm text-slate-600"><p>Plan: <strong className="text-slate-900">{selectedPlan?.rate}% commission</strong></p><p>Monthly price: <strong className="text-slate-900">{money(selectedPlan?.monthlyPrice || 0)}</strong></p><p className="rounded-xl bg-amber-50 p-3 leading-5 text-amber-950">No subscription payment will be processed. The plan will remain inactive and will not change commission calculations.</p></div>
            )}
            {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" disabled={submitting} onClick={() => { setConfirming(null); if (confirming === "advertising") advertisingAttemptKey.current = null; else subscriptionAttemptKey.current = null; }} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="button" disabled={submitting} onClick={confirming === "advertising" ? createAdRequest : createPlanRequest} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50">{submitting ? "Saving…" : "Create pending demo request"}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default function MonetizationPage() {
  return <MonetizationWorkspace />;
}

