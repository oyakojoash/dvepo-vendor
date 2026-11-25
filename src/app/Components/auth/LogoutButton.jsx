"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMerchantAuth } from "../../Context/MerchantAuthContext";

export default function LogoutButton({ className = "" }) {
  const router = useRouter();
  const { logout, loggingOut, logoutError } = useMerchantAuth();
  const [error, setError] = useState("");

  async function handleLogout() {
    setError("");
    const result = await logout();
    if (result.success) router.replace("/login");
    else setError(result.error || logoutError || "Could not sign out. Please try again.");
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" onClick={handleLogout} disabled={loggingOut} className={`rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60 ${className}`}>
        {loggingOut ? "Signing out…" : "Sign out"}
      </button>
      {error && <span role="alert" className="max-w-52 text-right text-xs text-rose-700">{error}</span>}
    </div>
  );
}
