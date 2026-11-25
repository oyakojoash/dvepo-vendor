"use client";

import Link from "next/link";
import { useState } from "react";
import LogoutButton from "../Components/auth/LogoutButton";
import { StoreApplicationError, submitStoreApplication } from "../Services/storeApplicationService";

const initialForm = {
  name: "",
  logo: "",
  description: "",
  businessName: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
};

const inputClass = "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 disabled:bg-slate-100";

function Field({ label, name, form, setForm, required = false, type = "text", hint, disabled }) {
  const id = `store-${name}`;
  return (
    <label htmlFor={id} className="block text-sm font-medium text-slate-800">
      {label}{required && <span className="ml-1 text-rose-600" aria-hidden="true">*</span>}
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        maxLength={name === "contactEmail" ? 254 : 2048}
        value={form[name]}
        onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))}
        className={inputClass}
        disabled={disabled}
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      {hint && <span id={`${id}-hint`} className="mt-1 block text-xs font-normal leading-5 text-slate-500">{hint}</span>}
    </label>
  );
}

export default function StoreApplicationPage() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!form.name.trim() || !form.logo.trim() || !form.description.trim()) {
      setError("Complete the store name, logo URL, and description before submitting.");
      return;
    }
    if (form.contactEmail.trim() && !event.currentTarget.elements.contactEmail.validity.valid) {
      setError("Enter a valid contact email address.");
      return;
    }

    setSubmitting(true);
    setNeedsSignIn(false);
    try {
      await submitStoreApplication(form);
      setSubmitted(true);
    } catch (submitError) {
      const status = submitError instanceof StoreApplicationError ? submitError.status : 0;
      setError(submitError.message || "Could not submit your application. Please try again.");
      setNeedsSignIn(status === 401);
      setConflict(status === 409);
    } finally {
      setSubmitting(false);
    }
  }

  const disabled = submitting || conflict;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-xl font-black text-slate-950">D</span>
            <span><span className="block text-lg font-bold">dvepo</span><span className="block text-xs text-slate-400">Merchant portal</span></span>
          </Link>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-7">
          <p className="text-sm font-semibold text-emerald-700">Workspace / Store</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Apply for your store</h1>
            <Link href="/" className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">← Back to dashboard</Link>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Tell us about your business. Dvepo reviews each store application before it becomes visible to customers.</p>
        </div>

        {submitted ? (
          <section className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="pending-title">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-800" aria-hidden="true">✓</div>
            <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-emerald-700">Application received</p>
            <h2 id="pending-title" className="mt-1 text-2xl font-bold">Your store is pending approval</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Your application has been submitted. The store remains suspended while Dvepo reviews it, and won’t be listed for customers until it is approved.</p>
            <div role="status" className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-900">Pending review</span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">Suspended until approved</span>
            </div>
            <Link href="/" className="mt-7 inline-flex rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800">Return to dashboard</Link>
          </section>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
              <h2 className="text-lg font-bold">Store details</h2>
              <p className="mt-1 text-sm text-slate-500"><span className="text-rose-600">*</span> Required fields</p>
            </div>
            <form onSubmit={handleSubmit} className="p-5 sm:p-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Store name" name="name" form={form} setForm={setForm} required disabled={disabled} />
                <Field label="Logo image URL" name="logo" form={form} setForm={setForm} required type="url" hint="Paste a publicly accessible image URL. Image uploads are not part of this form." disabled={disabled} />
                <label htmlFor="store-description" className="block text-sm font-medium text-slate-800 sm:col-span-2">
                  Store description<span className="ml-1 text-rose-600" aria-hidden="true">*</span>
                  <textarea id="store-description" name="description" required rows={5} maxLength={2000} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} disabled={disabled} className={`${inputClass} resize-y`} />
                </label>
                <div className="border-t border-slate-100 pt-5 sm:col-span-2"><h3 className="font-semibold">Business and contact details <span className="font-normal text-slate-500">(optional)</span></h3></div>
                <Field label="Business name" name="businessName" form={form} setForm={setForm} disabled={disabled} />
                <Field label="Contact email" name="contactEmail" form={form} setForm={setForm} type="email" disabled={disabled} />
                <Field label="Contact phone" name="contactPhone" form={form} setForm={setForm} type="tel" disabled={disabled} />
                <Field label="Business address" name="address" form={form} setForm={setForm} disabled={disabled} />
              </div>

              {error && <div role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-900">{error}{needsSignIn && <p className="mt-2"><Link href="/login?next=%2Fstore-application" className="font-semibold underline underline-offset-2">Sign in to continue</Link></p>}</div>}
              {conflict && <p className="mt-3 text-sm text-slate-600">If you believe this is incorrect, contact <a className="font-semibold text-emerald-800 underline" href="mailto:support@dvepo.com">Dvepo support</a>.</p>}

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-xl text-xs leading-5 text-slate-500">After submission, the store stays suspended until Dvepo approves the application.</p>
                <button type="submit" disabled={disabled} className="inline-flex justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-wait disabled:opacity-60">{submitting ? "Submitting application…" : conflict ? "Application already in progress" : "Submit store application"}</button>
              </div>
              {submitting && <p role="status" className="mt-3 text-right text-sm text-slate-600">Sending your application securely…</p>}
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
