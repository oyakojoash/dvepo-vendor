"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  isUnauthenticatedError,
  merchantAuthService,
} from "../Services/merchantAuthService";

const MerchantAuthContext = createContext(null);
const publicPaths = new Set(["/login", "/register"]);

function AuthLoading({ message = "Checking your merchant session…" }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-700">
      <div role="status" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm shadow-sm">
        <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        {message}
      </div>
    </main>
  );
}

function MerchantRouteBoundary({ children }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { status, restoreSession } = useMerchantAuth();
  const isPublic = publicPaths.has(pathname);

  useEffect(() => {
    if (status === "unauthenticated" && !isPublic) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (status === "authenticated" && isPublic) {
      router.replace("/");
    }
  }, [isPublic, pathname, router, status]);

  if (status === "loading") return <AuthLoading />;

  if (status === "authenticated" && isPublic) return <AuthLoading message="Opening your merchant portal…" />;
  if (status === "unauthenticated" && !isPublic) return <AuthLoading message="Taking you to sign in…" />;

  if (status === "error" && !isPublic) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">We couldn’t verify your session</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">The authentication service could not be reached. Try again, or sign in once the service is available.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={restoreSession} className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">Try again</button>
            <a href="/login" className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Sign in</a>
          </div>
        </section>
      </main>
    );
  }

  return children;
}

export function MerchantAuthProvider({ children }) {
  const [merchant, setMerchant] = useState(null);
  const [status, setStatus] = useState("loading");
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const restoreSession = useCallback(async () => {
    setStatus("loading");
    try {
      const currentMerchant = await merchantAuthService.getCurrentMerchant();
      setMerchant(currentMerchant);
      setStatus("authenticated");
      return currentMerchant;
    } catch (error) {
      setMerchant(null);
      if (isUnauthenticatedError(error)) {
        setStatus("unauthenticated");
      } else {
        setStatus("error");
      }
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;

    merchantAuthService.getCurrentMerchant().then((currentMerchant) => {
      if (!active) return;
      setMerchant(currentMerchant);
      setStatus("authenticated");
    }).catch((error) => {
      if (!active) return;
      setMerchant(null);
      if (isUnauthenticatedError(error)) {
        setStatus("unauthenticated");
      } else {
        setStatus("error");
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const acceptAuthenticatedMerchant = useCallback((profile) => {
    setMerchant(profile);
    setLogoutError("");
    setStatus("authenticated");
  }, []);

  const updateAuthenticatedMerchant = useCallback((profile) => {
    setMerchant(profile);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    setLoggingOut(true);
    setLogoutError("");
    try {
      await merchantAuthService.logout();
      setMerchant(null);
      setStatus("unauthenticated");
      return { success: true };
    } catch (error) {
      const message = error.message || "Could not sign out. Please try again.";
      setLogoutError(message);
      return { success: false, error: message };
    } finally {
      setLoggingOut(false);
    }
  }, []);

  const value = useMemo(() => ({
    merchant,
    status,
    logoutError,
    loggingOut,
    restoreSession,
    acceptAuthenticatedMerchant,
    updateAuthenticatedMerchant,
    logout,
  }), [merchant, status, logoutError, loggingOut, restoreSession, acceptAuthenticatedMerchant, updateAuthenticatedMerchant, logout]);

  return (
    <MerchantAuthContext.Provider value={value}>
      <MerchantRouteBoundary>{children}</MerchantRouteBoundary>
    </MerchantAuthContext.Provider>
  );
}

export function useMerchantAuth() {
  const context = useContext(MerchantAuthContext);
  if (!context) throw new Error("useMerchantAuth must be used inside MerchantAuthProvider.");
  return context;
}
