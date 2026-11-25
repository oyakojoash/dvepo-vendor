"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMerchantAuth } from "../../Context/MerchantAuthContext";
import { merchantAuthService } from "../../Services/merchantAuthService";

const inputClass = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 disabled:bg-slate-100";
const portalPaths = new Set(["/", "/products", "/orders", "/messages", "/settings", "/monetization", "/store-application"]);

function VisibilityIcon({ visible }) {
  return visible ? (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a15.8 15.8 0 0 1-3.2 3.9M6.2 6.3C3.5 8.1 2 12 2 12s3.6 7 10 7c1.1 0 2.1-.2 3-.5" />
    </svg>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
  disabled,
  error = "",
}) {
  const errorId = `${id}-error`;

  return (
    <label htmlFor={id} className="block text-sm font-medium">
      {label}
      <span className="relative mt-1 block">
        <input
          id={id}
          className={`${inputClass} pr-12`}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          minLength={id === "password" && autoComplete === "new-password" ? 8 : undefined}
          maxLength={128}
          required
          disabled={disabled}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-1 flex w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-700 disabled:opacity-50"
        >
          <VisibilityIcon visible={visible} />
        </button>
      </span>
      {error && <span id={errorId} role="alert" className="mt-1 block text-sm font-normal text-rose-700">{error}</span>}
    </label>
  );
}

function safeNextPath(value) {
  const destination = value?.split(/[?#]/, 1)[0];
  return portalPaths.has(destination) ? destination : "/";
}

function validateEmail(value) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validatePhone(value) {
  return /^\+?\d{7,15}$/.test(value.trim().replace(/[\s().-]/g, ""));
}

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const router = useRouter();
  const { status, acceptAuthenticatedMerchant } = useMerchantAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmAttempted, setConfirmAttempted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const confirmPasswordError = isRegister
    ? confirmPassword && confirmPassword !== password
      ? "Passwords do not match."
      : (confirmAttempted || password.length > 0) && !confirmPassword
        ? "Please confirm your password."
        : ""
    : "";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (isRegister) setConfirmAttempted(true);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedIdentifier = identifier.trim();

    if (isRegister) {
      if (trimmedName.length < 2 || trimmedName.length > 100) {
        setError("Business name must be 2 to 100 characters after trimming.");
        return;
      }
      if (!validateEmail(trimmedEmail)) {
        setError("Enter a valid email address of no more than 254 characters.");
        return;
      }
      if (!validatePhone(trimmedPhone)) {
        setError("Enter 7 to 15 digits. You may include a leading +, spaces, parentheses, dots, or hyphens.");
        return;
      }
      if (password.length < 8 || password.length > 128) {
        setError("Password must be 8 to 128 characters.");
        return;
      }
      if (!confirmPassword || password !== confirmPassword) return;
    } else {
      const identifierIsEmail = trimmedIdentifier.includes("@");
      if (identifierIsEmail ? !validateEmail(trimmedIdentifier) : !validatePhone(trimmedIdentifier)) {
        setError("Enter a valid email address or phone number.");
        return;
      }
      if (!password || password.length > 128) {
        setError("Enter your password (up to 128 characters).");
        return;
      }
    }

    setSubmitting(true);
    try {
      const merchant = isRegister
        ? await merchantAuthService.register({
            name: trimmedName,
            email: trimmedEmail,
            phone: trimmedPhone,
            password,
          })
        : await merchantAuthService.login({
            identifier: trimmedIdentifier,
            password,
          });

      acceptAuthenticatedMerchant(merchant);
      const search = new URLSearchParams(window.location.search);
      router.replace(safeNextPath(search.get("next")));
    } catch (submitError) {
      setError(submitError.message || "The request could not be completed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const waitingForSession = status === "loading";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
      <div className="w-full max-w-md">
        <Link href="/login" className="mb-6 flex items-center justify-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-xl font-black text-slate-950">D</span>
          <span><span className="block text-xl font-bold tracking-tight">dvepo</span><span className="block text-xs text-slate-500">Merchant portal</span></span>
        </Link>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">{isRegister ? "Create your merchant account" : "Welcome back"}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{isRegister ? "Register your business to access the Dvepo merchant portal." : "Sign in to manage your Dvepo merchant portal."}</p>

          {status === "error" && <p role="status" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">We couldn’t restore an existing session. You can still try to {isRegister ? "register" : "sign in"}.</p>}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            {isRegister ? (
              <>
                <label className="block text-sm font-medium">Merchant/business name
                  <input className={inputClass} autoComplete="organization" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={100} required disabled={submitting || waitingForSession} />
                </label>
                <label className="block text-sm font-medium">Email
                  <input className={inputClass} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required disabled={submitting || waitingForSession} />
                </label>
                <label className="block text-sm font-medium">Phone number
                  <input className={inputClass} type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+254 700 000 000" required disabled={submitting || waitingForSession} />
                </label>
              </>
            ) : (
              <label className="block text-sm font-medium">Email or phone
                <input className={inputClass} type="text" autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} required disabled={submitting || waitingForSession} />
              </label>
            )}

            <PasswordField
              id="password"
              label="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              visible={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
              autoComplete={isRegister ? "new-password" : "current-password"}
              disabled={submitting || waitingForSession}
            />

            {isRegister && (
              <PasswordField
                id="confirm-password"
                label="Confirm Password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                visible={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((current) => !current)}
                autoComplete="new-password"
                disabled={submitting || waitingForSession}
                error={confirmPasswordError}
              />
            )}

            {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-5 text-rose-800">{error}</p>}

            <button type="submit" disabled={submitting || waitingForSession || (isRegister && password !== confirmPassword)} className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60">
              {waitingForSession ? "Checking session…" : submitting ? (isRegister ? "Creating account…" : "Signing in…") : (isRegister ? "Create account" : "Sign in")}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            {isRegister ? "Already have an account? " : "New to Dvepo? "}
            <Link href={isRegister ? "/login" : "/register"} className="font-semibold text-emerald-800 hover:underline">{isRegister ? "Sign in" : "Create an account"}</Link>
          </p>
        </section>
        <p className="mt-5 text-center text-xs leading-5 text-slate-500">Your session is held in a secure server cookie. This portal does not store authentication tokens in browser storage.</p>
      </div>
    </main>
  );
}
