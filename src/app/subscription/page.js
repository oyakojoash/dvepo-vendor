"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LogoutButton from "../Components/auth/LogoutButton";
import { useMerchantAuth } from "../Context/MerchantAuthContext";
import { merchantSubscriptionService } from "../Services/merchantSubscriptionService";

const cardClass = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6";
const primaryButton = "inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-wait disabled:opacity-50";
const secondaryButton = "inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-wait disabled:opacity-50";

function formatMoney(amount) {
  return `KSh ${Number(amount || 0).toLocaleString("en-KE")}`;
}

function formatDate(value) {
  if (!value) return "No expiry date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function planName(plan, plans) {
  if (!plan?.id) return "Unknown plan";
  return plans.find((item) => item.id === plan.id)?.name || plan.id;
}

function SubscriptionPageContent() {
  const router = useRouter();
  const { merchant } = useMerchantAuth();
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingPayment, setPendingPayment] = useState(null);
  const [busy, setBusy] = useState(false);

  const loadData = useCallback(async () => {
    setLoadError("");
    const [plansResult, subscriptionResult] = await Promise.allSettled([
      merchantSubscriptionService.getPlans(),
      merchantSubscriptionService.getSubscription(),
    ]);
    if (plansResult.status === "fulfilled") {
      setPlans(Array.isArray(plansResult.value.plans) ? plansResult.value.plans : []);
    } else {
      setLoadError(plansResult.reason?.message || "Could not load subscription plans.");
      if (plansResult.reason?.status === 401) router.replace("/login?next=%2Fsubscription");
    }
    if (subscriptionResult.status === "fulfilled") {
      setSubscription(subscriptionResult.value.subscription || null);
    } else {
      setLoadError((previous) => previous || subscriptionResult.reason?.message || "Could not load your subscription.");
      if (subscriptionResult.reason?.status === 401) router.replace("/login?next=%2Fsubscription");
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) return loadData();
      return undefined;
    });
    return () => { active = false; };
  }, [loadData]);

  const currentPlan = subscription?.plan;
  const currentDefinition = plans.find((plan) => plan.id === currentPlan?.id);
  const canManage = Boolean(subscription && plans.length);
  const paid = currentPlan?.id !== "free";
  const availableUpgrades = useMemo(() => plans.filter((plan) =>
    Number(plan.priceKsh) > Number(currentPlan?.priceKsh ?? 0)
  ), [plans, currentPlan?.priceKsh]);
  const availableDowngrades = useMemo(() => plans.filter((plan) =>
    Number(plan.priceKsh) < Number(currentPlan?.priceKsh ?? 0)
  ), [plans, currentPlan?.priceKsh]);

  const performAction = async (action, successMessage, { isPayment = false } = {}) => {
    if (busy) return;
    setBusy(true);
    setActionError("");
    setNotice("");
    if (isPayment) setPendingPayment(null);
    try {
      const result = await action();
      if (isPayment && result.status === "pending_payment") {
        setPendingPayment(result);
        setNotice("");
      } else {
        setNotice(successMessage);
      }
      await loadData();
    } catch (error) {
      setActionError(error.message || "The subscription request could not be completed.");
      if (error.status === 401) router.replace("/login?next=%2Fsubscription");
    } finally {
      setBusy(false);
    }
  };

  const confirmCancelRenewal = () => {
    if (!window.confirm("Cancel renewal? Your current paid access will continue until its expiry date.")) return;
    performAction(
      () => merchantSubscriptionService.cancelRenewal(),
      "Renewal cancellation is scheduled. Your current paid access continues until expiry."
    );
  };

  const renewalTarget = subscription?.pendingDowngrade || currentPlan;
  const renewalTargetName = planName(renewalTarget, plans);
  const confirmRenewal = () => {
    if (!window.confirm(`Renew as ${renewalTargetName} for ${formatMoney(renewalTarget?.priceKsh)}? A pending payment will be created; your current plan remains active until payment is verified.`)) return;
    performAction(
      () => merchantSubscriptionService.renew(),
      `Renewal payment for ${renewalTargetName} is pending; your current plan remains active until payment is verified.`,
      { isPayment: true }
    );
  };

  const confirmDowngrade = (plan) => {
    if (!window.confirm(`Schedule a change to ${plan.name} for your next renewal? Your current plan stays active until then.`)) return;
    performAction(
      () => merchantSubscriptionService.scheduleDowngrade(plan.id),
      `A change to ${plan.name} is scheduled for your next renewal.`
    );
  };

  const confirmCancelDowngrade = () => {
    if (!window.confirm("Cancel the scheduled downgrade? Your current plan will remain selected for renewal.")) return;
    performAction(
      () => merchantSubscriptionService.cancelDowngrade(),
      "Scheduled downgrade cancelled."
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-xl font-black text-slate-950">D</span>
            <span><span className="block text-lg font-bold">dvepo</span><span className="block text-xs text-slate-400">Merchant portal</span></span>
          </Link>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-7">
          <p className="text-sm font-semibold text-emerald-700">Workspace / Subscription</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
              {merchant?.name && <p className="mt-1 text-sm text-slate-600">Manage the plan for {merchant.name}.</p>}
            </div>
            <Link href="/" className={secondaryButton}>← Back to Dashboard</Link>
          </div>
          <p className="mt-2 text-sm text-slate-600">Review your plan, commission rate, and renewal options.</p>
        </div>

        {loading ? (
          <div role="status" className={`${cardClass} flex items-center gap-3 text-sm text-slate-600`}>
            <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            Loading your subscription…
          </div>
        ) : loadError ? (
          <section className={cardClass}>
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{loadError}</div>
            <button type="button" onClick={() => { setLoading(true); loadData(); }} className={`${primaryButton} mt-5`}>Try again</button>
          </section>
        ) : !subscription || !plans.length ? (
          <section className={cardClass}>
            <p className="font-semibold">Subscription data is unavailable</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">The service did not return a subscription and plan list. Try again later.</p>
            <button type="button" onClick={() => { setLoading(true); loadData(); }} className={`${primaryButton} mt-5`}>Try again</button>
          </section>
        ) : (
          <div className="space-y-6">
            {actionError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{actionError}</p>}
            {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</p>}

            {pendingPayment && <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950 sm:px-6">
              <p className="font-semibold">Payment pending for {planName(pendingPayment.plan, plans)}</p>
              <p className="mt-1">Your current plan and commission rate remain active. Payment processing will be connected in a later integration stage; no payment has been confirmed.</p>
              <p className="mt-1">Request reference: {String(pendingPayment.paymentId || "Unavailable")}</p>
            </div>}

            <section className={cardClass} aria-labelledby="current-subscription-heading">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-emerald-700">Current subscription</p>
                  <h2 id="current-subscription-heading" className="mt-1 text-2xl font-bold">{currentDefinition?.name || planName(currentPlan, plans)}</h2>
                  <p className="mt-1 text-sm text-slate-600">{formatMoney(currentPlan?.priceKsh)} per month · {Math.round(Number(currentPlan?.commissionRate || 0) * 100)}% affiliate commission</p>
                </div>
                <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold capitalize text-emerald-800">{subscription.status || "unknown"}</span>
              </div>
              <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Plan</dt><dd className="mt-1 text-sm font-semibold">{currentDefinition?.name || planName(currentPlan, plans)}</dd></div>
                <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Monthly fee</dt><dd className="mt-1 text-sm font-semibold">{formatMoney(currentPlan?.priceKsh)}</dd></div>
                <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Started</dt><dd className="mt-1 text-sm font-semibold">{formatDate(subscription.startedAt)}</dd></div>
                <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Expires</dt><dd className="mt-1 text-sm font-semibold">{formatDate(subscription.expiresAt)}</dd></div>
              </dl>

              {subscription.pendingDowngrade && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <p><strong>Pending downgrade:</strong> {planName(subscription.pendingDowngrade, plans)} ({formatMoney(subscription.pendingDowngrade.priceKsh)}/month) is scheduled for the next renewal.</p>
                <button type="button" disabled={busy} onClick={confirmCancelDowngrade} className={`${secondaryButton} mt-3`}>Cancel pending downgrade</button>
              </div>}

              {subscription.cancelAtExpiry && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Renewal cancellation is scheduled. Your current paid plan remains active until {formatDate(subscription.expiresAt)}.</p>}

              <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                {paid && <button type="button" disabled={busy} onClick={confirmRenewal} className={primaryButton}>
                  {busy ? "Please wait…" : subscription.pendingDowngrade ? `Renew as ${renewalTargetName}` : `Renew ${renewalTargetName} plan`}
                </button>}
                {paid && !subscription.cancelAtExpiry && <button type="button" disabled={busy} onClick={confirmCancelRenewal} className={secondaryButton}>Cancel renewal</button>}
              </div>
            </section>

            <section aria-labelledby="available-plans-heading">
              <div className="mb-4">
                <h2 id="available-plans-heading" className="text-xl font-bold">Available plans</h2>
                <p className="mt-1 text-sm text-slate-600">Plan pricing and commission rates are provided by the subscription service.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {plans.map((plan) => {
                  const isCurrent = plan.id === currentPlan?.id;
                  const canUpgrade = Number(plan.priceKsh) > Number(currentPlan?.priceKsh ?? 0);
                  const canDowngrade = paid && Number(plan.priceKsh) < Number(currentPlan?.priceKsh ?? 0)
                    && Boolean(subscription.expiresAt) && !subscription.pendingDowngrade && !subscription.cancelAtExpiry;
                  return <article key={plan.id} className={`${cardClass} flex flex-col ${isCurrent ? "border-emerald-300 ring-1 ring-emerald-200" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-bold">{plan.name}</h3>
                      {isCurrent && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">Current plan</span>}
                    </div>
                    <p className="mt-4 text-2xl font-bold">{formatMoney(plan.priceKsh)}<span className="text-sm font-normal text-slate-500"> / month</span></p>
                    <p className="mt-2 text-sm text-slate-600">{Math.round(Number(plan.commissionRate || 0) * 100)}% affiliate commission</p>
                    <div className="mt-auto pt-5">
                      {isCurrent ? <button type="button" disabled className={`${secondaryButton} w-full`}>Current plan</button>
                        : canUpgrade ? <button type="button" disabled={busy} onClick={() => performAction(
                          () => merchantSubscriptionService.upgrade(plan.id),
                          "Payment is pending. Your current plan remains active until payment is verified.",
                          { isPayment: true }
                        )} className={`${primaryButton} w-full`}>{busy ? "Please wait…" : `Upgrade to ${plan.name}`}</button>
                          : canDowngrade ? <button type="button" disabled={busy} onClick={() => confirmDowngrade(plan)} className={`${secondaryButton} w-full`}>Schedule downgrade</button>
                            : <button type="button" disabled className={`${secondaryButton} w-full opacity-60`}>Not available from this plan</button>}
                    </div>
                  </article>;
                })}
              </div>
              {availableUpgrades.length === 0 && !paid && <p className="mt-3 text-xs text-slate-500">Paid plan access starts only after verified payment. Payment processing is not connected yet.</p>}
              {paid && availableDowngrades.length > 0 && subscription.cancelAtExpiry && <p className="mt-3 text-xs text-slate-500">Downgrade scheduling is unavailable while renewal cancellation is scheduled.</p>}
            </section>
            <p className="text-xs leading-5 text-slate-500">Subscription payment history and payment status are not available through the current API.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SubscriptionPage() {
  return <SubscriptionPageContent />;
}
