"use client";
/* eslint @next/next/no-img-element: off -- merchant-supplied URL previews are external images. */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { emptySettings, settingsImageUrl, settingsService } from "../../Services/settingsService";
import { merchantAuthService } from "../../Services/merchantAuthService";
import { useMerchantAuth } from "../../Context/MerchantAuthContext";
import LogoutButton from "../auth/LogoutButton";

const sections = [
  ["store", "Store", "▣"], ["account", "Account & profile", "◉"],
  ["delivery", "Delivery & fulfilment", "↗"], ["payments", "Payments", "$"],
  ["notifications", "Notifications", "♧"], ["privacy", "Privacy & security", "◇"],
  ["policies", "Policies & support", "☷"], ["staff", "Staff & permissions", "♙"],
];

const inputClass = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";
const labelClass = "block text-sm font-medium text-slate-700";

function Field({ label, name, value, onChange, type = "text", placeholder, hint, ...props }) {
  return <label className={labelClass}>{label}<input className={inputClass} name={name} type={type} value={value ?? ""} onChange={onChange} placeholder={placeholder} {...props} />{hint && <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>}</label>;
}

function TextArea({ label, name, value, onChange, placeholder, rows = 3 }) {
  return <label className={labelClass}>{label}<textarea className={inputClass} name={name} value={value ?? ""} onChange={onChange} placeholder={placeholder} rows={rows} /></label>;
}

function Toggle({ label, checked, onChange, note }) {
  return <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200 p-4"><span><span className="block text-sm font-medium text-slate-800">{label}</span>{note && <span className="mt-1 block text-xs text-slate-500">{note}</span>}</span><input type="checkbox" checked={!!checked} onChange={onChange} className="mt-0.5 h-4 w-4 accent-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600" /></label>;
}

function StoreImageField({ label, name, value, change, onUpload, inputRef, uploading, saving, previewClass }) {
  const inputId = `store-${name}-url`;
  return <div className={name === "banner" ? "sm:col-span-2" : ""}>
    <label htmlFor={inputId} className={labelClass}>{label}</label>
    <div className="mt-1 flex items-center gap-2">
      <input id={inputId} className={inputClass.replace("mt-1 ", "")} name={name} type="url" value={value ?? ""} onChange={change} placeholder="https://example.com/image.jpg" />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading || saving} aria-label={`Upload ${label.toLowerCase()}`} title={`Upload ${label.toLowerCase()}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-wait disabled:opacity-60">
        {uploading ? <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" /> : <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5"><path strokeLinecap="round" d="M12 5v14M5 12h14" /></svg>}
      </button>
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="sr-only" aria-label={`Choose ${label.toLowerCase()} image`} onChange={(event) => onUpload(name, event)} disabled={uploading || saving} />
    </div>
    <span className="mt-1 block text-xs font-normal text-slate-500">Paste an HTTPS image URL or use + to upload a JPG, PNG, or WebP image (up to 5 MB).</span>
    {uploading && <span role="status" className="mt-2 block text-xs text-emerald-700">Uploading {label.toLowerCase()}…</span>}
    {value && <img src={value} alt={`${label} preview`} className={`mt-3 rounded-xl border border-slate-200 bg-slate-50 object-cover ${previewClass}`} />}
  </div>;
}

function SettingsForm({ section, value, change, onUploadImage, imageUploading, storeImageUploading, storeImageRefs, saving }) {
  switch (section) {
    case "store": return <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Store name" name="name" value={value.name} onChange={change} required />
      <Field label="Business category" name="category" value={value.category} onChange={change} placeholder="e.g. Home & living" />
      <Field label="Product type" name="productType" value={value.productType} onChange={change} />
      <Field label="Business location" name="location" value={value.location} onChange={change} />
      <Field label="Street address" name="address" value={value.address} onChange={change} />
      <Field label="Contact email" name="email" value={value.email} onChange={change} type="email" />
      <Field label="Contact phone" name="phone" value={value.phone} onChange={change} type="tel" />
      <StoreImageField label="Store logo URL" name="logo" value={value.logo} change={change} onUpload={onUploadImage} inputRef={storeImageRefs.logo} uploading={storeImageUploading === "logo"} saving={saving} previewClass="h-24 w-24" />
      <StoreImageField label="Store banner URL" name="banner" value={value.banner} change={change} onUpload={onUploadImage} inputRef={storeImageRefs.banner} uploading={storeImageUploading === "banner"} saving={saving} previewClass="h-36 w-full" />
      <div className="sm:col-span-2"><TextArea label="Store description" name="description" value={value.description} onChange={change} /></div>
      <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2"><Toggle label="Storefront visibility" note={value.visible ? "Customers can find your store." : "Your storefront is hidden from customers."} checked={value.visible} onChange={(e) => change({ target: { name: "visible", type: "checkbox", checked: e.target.checked } })} /><Toggle label="Store operating status" note={value.open ? "Marked open in your store settings." : "Marked closed in your store settings."} checked={value.open} onChange={(e) => change({ target: { name: "open", type: "checkbox", checked: e.target.checked } })} /></div>
    </div>;
    case "account": return <div className="space-y-5"><div className="grid gap-5 sm:grid-cols-2"><Field label="Full name" name="name" value={value.name} onChange={change} minLength={2} maxLength={100} required /><Field label="Email address" name="email" value={value.email} onChange={change} type="email" maxLength={254} required hint="Changing your email does not verify the new address." /><Field label="Phone number" name="phone" value={value.phone} onChange={change} type="tel" required hint="Use 7 to 15 digits, optionally prefixed with +." /><label className={labelClass}>Profile picture<input className={inputClass} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onUploadImage} disabled={imageUploading} />{imageUploading && <span role="status" className="mt-1 block text-xs text-slate-500">Uploading image…</span>}<span className="mt-1 block text-xs font-normal text-slate-500">JPEG, PNG, WebP or GIF, up to 5 MB.</span></label></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-sm font-semibold">Account verification</p><p className="mt-1 text-sm text-slate-600">{value.verification?.verified ? "Verified" : "Not configured"}</p><p className="mt-1 text-xs text-slate-500">Email and phone verification are not implemented.</p></div>{value.profileImage && <img src={value.profileImage} alt="Profile preview" className="h-16 w-16 rounded-full border border-slate-200 object-cover" />}</div>;
    case "delivery": return <div className="grid gap-5 sm:grid-cols-2"><div className="sm:col-span-2"><Toggle label="Offer delivery" checked={value.enabled} onChange={(e) => change({ target: { name: "enabled", type: "checkbox", checked: e.target.checked } })} /></div><Field label="Delivery areas" name="areas" value={value.areas} onChange={change} placeholder="Nairobi, Kiambu" hint="Separate locations with commas." /><Field label="Delivery charge (KSh)" name="charge" value={value.charge} onChange={change} type="number" min="0" step="1" /><Field label="Estimated delivery time" name="estimate" value={value.estimate} onChange={change} placeholder="1–3 days" /><Field label="Order processing time" name="processing" value={value.processing} onChange={change} placeholder="1 day" /><div className="sm:col-span-2"><Toggle label="Customer pickup" checked={value.pickup} onChange={(e) => change({ target: { name: "pickup", type: "checkbox", checked: e.target.checked } })} /></div><div className="sm:col-span-2"><TextArea label="Delivery instructions for customers" name="instructions" value={value.instructions} onChange={change} /></div></div>;
    case "payments": return <div className="space-y-5"><div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">Customer payment preferences only. No payment provider integration or supported receiving capabilities are present in this project, so avoid entering secret credentials here. Receiving details are stored in the authenticated merchant settings endpoint and are not returned by public store APIs.</div><TextArea label="Customer payment methods" name="methods" value={value.methods} onChange={change} placeholder="Describe methods you accept (for display to customers)" /><TextArea label="Payment instructions" name="instructions" value={value.instructions} onChange={change} /><TextArea label="Receiving details" name="receivingDetails" value={value.receivingDetails} onChange={change} placeholder="Never add PINs or secret keys" /><div className="rounded-xl border border-slate-200 p-4"><p className="font-semibold">Dvepo billing</p><p className="mt-1 text-sm text-slate-600">Subscription and promotion charges, invoices, and amounts owed to Dvepo belong in Monetization.</p><Link href="/monetization" className="mt-3 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-900">Open Monetization <span aria-hidden="true">→</span></Link><p className="mt-1 text-xs text-slate-500">Monetization is available; payment processing uses a separate integration.</p></div></div>;
    case "notifications": return <div className="space-y-3"><p className="mb-4 text-sm text-slate-600">These preferences are saved to your merchant account. Email, SMS, and in-app notification delivery is not connected yet.</p>{[["orders","New orders"],["orderUpdates","Order status updates"],["messages","Customer messages"],["paymentReminders","Payment reminders"],["lowStock","Low stock alerts"],["announcements","Platform announcements"]].map(([key,label])=><Toggle key={key} label={label} checked={value[key]} onChange={(e)=>change({target:{name:key,type:"checkbox",checked:e.target.checked}})} note="Saved preference; notification delivery is not connected." />)}</div>;
    case "privacy": return <div className="space-y-3"><p className="mb-4 text-sm text-slate-600">Your storefront visibility preference is saved with your merchant settings. Analytics collection is not implemented.</p><Toggle label="Public storefront profile" checked={value.profileVisible} onChange={(e)=>change({target:{name:"profileVisible",type:"checkbox",checked:e.target.checked}})} note="Controls whether your store can appear in the public marketplace."/><Toggle label="Share anonymous usage analytics" checked={value.analytics} onChange={(e)=>change({target:{name:"analytics",type:"checkbox",checked:e.target.checked}})} note="Preference is saved; analytics collection is not connected."/><div className="mt-5 rounded-xl border border-slate-200 p-4"><p className="text-sm font-semibold">Security controls</p><p className="mt-1 text-sm leading-6 text-slate-600">Password changes and sign-out are available. Account verification, session listing, account deletion, and deactivation are not implemented.</p></div></div>;
    case "policies": return <div className="space-y-5"><p className="text-sm text-slate-600">The policies below are merchant-defined. Platform terms and Dvepo policies are controlled by Dvepo.</p><TextArea label="Return policy" name="returns" value={value.returns} onChange={change} /><TextArea label="Cancellation policy" name="cancellations" value={value.cancellations} onChange={change} /><TextArea label="Delivery policy" name="delivery" value={value.delivery} onChange={change} /><TextArea label="Store terms and conditions" name="terms" value={value.terms} onChange={change} /><Field label="Customer support email" name="supportEmail" value={value.supportEmail} onChange={change} type="email" placeholder="help@example.com" /><div className="flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-sm"><a href="mailto:support@dvepo.com" className="font-medium text-emerald-700 hover:underline">Contact Dvepo support</a><span className="text-slate-500">Help centre is not configured yet.</span></div></div>;
    default: return null;
  }
}

export default function SettingsLayout() {
  const router = useRouter();
  const { updateAuthenticatedMerchant } = useMerchantAuth();
  const [section, setSection] = useState("store");
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accountLoaded, setAccountLoaded] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [settingsLoadError, setSettingsLoadError] = useState("");
  const [storeAvailable, setStoreAvailable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [storeImageUploading, setStoreImageUploading] = useState(null);
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const storeImageRefs = { logo: logoInputRef, banner: bannerInputRef };
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const current = sections.find(([id]) => id === section);
  const supported = useMemo(() => ["store", "account", "delivery", "payments", "notifications", "privacy", "policies"].includes(section), [section]);

  useEffect(() => {
    let active = true;
    const settingsRequest = settingsService.getSettings();
    const accountRequest = merchantAuthService.getCurrentMerchant();
    Promise.allSettled([settingsRequest, accountRequest]).then(([settingsResult, accountResult]) => {
      if (!active) return;
      if (settingsResult.status === "fulfilled") {
        const { settings, storeAvailable: hasStore } = settingsResult.value;
        setSaved((previous) => ({ ...(previous || emptySettings()), ...settings }));
        setDraft((previous) => ({ ...(previous || emptySettings()), ...settings }));
        setStoreAvailable(hasStore);
      } else {
        setSettingsLoadError(settingsResult.reason.message || "Could not load merchant settings. Please try again.");
        if (settingsResult.reason.status === 401) router.replace("/login?next=%2Fsettings");
      }
      setSettingsLoaded(true);
      if (accountResult.status === "fulfilled") {
        const merchant = accountResult.value;
        const profileImage = merchant.profileImage?.startsWith("/api/images/")
          ? `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "")}${merchant.profileImage}`
          : merchant.profileImage;
        const account = { name: merchant.name, email: merchant.email, phone: merchant.phone, profileImage, verification: merchant.verification };
        setSaved((previous) => ({ ...(previous || emptySettings()), account }));
        setDraft((previous) => ({ ...(previous || emptySettings()), account }));
        setAccountLoaded(true);
        updateAuthenticatedMerchant(merchant);
      } else {
        const loadError = accountResult.reason;
        setError(loadError.status === 401 ? "Your merchant session has expired. Sign in again." : "Could not load your merchant account. Please try again.");
        if (loadError.status === 401) router.replace("/login?next=%2Fsettings");
      }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [router, updateAuthenticatedMerchant]);

  const change = (event) => {
    const { name, type, value, checked } = event.target;
    setDraft((previous) => ({ ...previous, [section]: { ...previous[section], [name]: type === "checkbox" ? checked : value } }));
    setMessage(""); setError("");
  };

  const cancel = () => { setDraft((previous) => ({ ...previous, [section]: structuredClone(saved[section]) })); setMessage(""); setError(""); };
  const save = async (event) => {
    event.preventDefault(); setError(""); setMessage("");
    if (storeImageUploading) { setError("Wait for the image upload to finish before saving settings."); return; }
    if (section === "store" && !draft.store.name.trim()) { setError("Store name is required."); return; }
    if (section === "delivery" && draft.delivery.charge !== "" && (!Number.isFinite(Number(draft.delivery.charge)) || Number(draft.delivery.charge) < 0)) { setError("Enter a valid non-negative delivery charge."); return; }
    setSaving(true);
    try {
      if (section === "account") {
        const merchant = await merchantAuthService.updateProfile({ name: draft.account.name, email: draft.account.email, phone: draft.account.phone });
        const profileImage = merchant.profileImage?.startsWith("/api/images/")
          ? `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "")}${merchant.profileImage}`
          : merchant.profileImage;
        const account = { name: merchant.name, email: merchant.email, phone: merchant.phone, profileImage, verification: merchant.verification };
        setSaved((previous) => ({ ...previous, account })); setDraft((previous) => ({ ...previous, account })); updateAuthenticatedMerchant(merchant);
        setMessage("Account profile saved.");
      } else {
        const result = await settingsService.saveSettings(section, draft[section]); setSaved((previous) => ({ ...previous, [section]: result })); setDraft((previous) => ({ ...previous, [section]: result })); setMessage("Settings saved.");
      }
    }
    catch (saveError) { setError(saveError.message || "Could not save these settings."); if (saveError.status === 401) router.replace("/login?next=%2Fsettings"); }
    finally { setSaving(false); }
  };

  const uploadProfileImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setError("Choose a JPEG, PNG, WebP or GIF image up to 5 MB."); return;
    }
    setError(""); setMessage(""); setImageUploading(true);
    try {
      const reference = await merchantAuthService.uploadProfileImage(file);
      const merchant = await merchantAuthService.updateProfile({ profileImage: reference });
      const profileImage = `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "")}${reference}`;
      const account = { name: merchant.name, email: merchant.email, phone: merchant.phone, profileImage, verification: merchant.verification };
      setSaved((previous) => ({ ...previous, account })); setDraft((previous) => ({ ...previous, account })); updateAuthenticatedMerchant(merchant);
      setMessage("Profile picture saved.");
    } catch (uploadError) {
      setError(uploadError.message || "Could not save your profile picture.");
      if (uploadError.status === 401) router.replace("/login?next=%2Fsettings");
    } finally { setImageUploading(false); }
  };

  const uploadStoreImage = async (field, event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const supportedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!supportedTypes.includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (!file.size || file.size > 5 * 1024 * 1024) {
      setError("Choose an image larger than 0 bytes and no larger than 5 MB.");
      return;
    }

    setError("");
    setMessage("");
    setStoreImageUploading(field);
    try {
      const reference = await merchantAuthService.uploadProfileImage(file);
      if (!/^\/api\/images\/[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(reference)) {
        throw new Error("The image service returned an invalid image reference. Please try again.");
      }
      const imageUrl = settingsImageUrl(reference);
      setDraft((previous) => ({ ...previous, store: { ...previous.store, [field]: imageUrl } }));
      setMessage(`${field === "logo" ? "Store logo" : "Store banner"} uploaded. Save changes to apply it to your store.`);
    } catch (uploadError) {
      setError(uploadError.message || `Could not upload the store ${field}. Please try again.`);
      if (uploadError.status === 401) router.replace("/login?next=%2Fsettings");
    } finally {
      setStoreImageUploading(null);
    }
  };

  const changePassword = async () => {
    setError(""); setMessage("");
    if (!currentPassword || newPassword.length < 8 || newPassword.length > 128) { setError("Enter your current password and a new password of 8 to 128 characters."); return; }
    if (newPassword !== confirmPassword) { setError("New password and confirmation do not match."); return; }
    setSaving(true);
    try {
      const result = await merchantAuthService.changePassword({ currentPassword, newPassword });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setMessage(result.message || "Password changed successfully.");
    } catch (passwordError) {
      setError(passwordError.message || "Could not change your password.");
      if (passwordError.status === 401) router.replace("/login?next=%2Fsettings");
    } finally { setSaving(false); }
  };

  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-slate-950 text-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8"><Link href="/" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-xl font-black text-slate-950">D</span><span><span className="block text-lg font-bold">dvepo</span><span className="block text-xs text-slate-400">Merchant portal</span></span></Link><LogoutButton /></div></header>
    <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-7"><p className="text-sm font-semibold text-emerald-700">Workspace / Settings</p><div className="mt-2 flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-bold tracking-tight">Settings</h1><Link href="/" className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">← Back to Dashboard</Link></div><p className="mt-2 text-sm text-slate-600">Manage your store, account, delivery, payments, and preferences.</p></div>
      <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="h-fit rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"><div className="mb-2 px-3 pt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Settings menu</div><div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible">{sections.map(([id,label,icon])=><button key={id} type="button" onClick={()=>{setSection(id);setMessage("");setError("");}} aria-current={section===id?"page":undefined} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 lg:w-full ${section===id?"bg-emerald-50 text-emerald-900":"text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}><span className="w-5 text-center">{icon}</span>{label}</button>)}</div></nav>
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-7"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold">{current[1]}</h2><p className="mt-1 text-sm text-slate-500">Update your {current[1].toLowerCase()} preferences.</p></div></div></div>
          {loading ? <div role="status" className="p-8 text-sm text-slate-500">Loading settings…</div> : !supported ? <div className="p-6 sm:p-7"><div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6"><p className="font-semibold">Staff accounts are unavailable</p><p className="mt-2 text-sm leading-6 text-slate-600">Secure staff invitations, sign-in, roles, and permission enforcement are not implemented yet.</p></div></div> : section === "account" && !accountLoaded ? <div role="alert" className="m-5 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:m-7">{error || "Could not load your merchant account. Please try again."}</div> : !settingsLoaded && section !== "account" ? <div role="alert" className="m-5 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:m-7">{settingsLoadError || "Could not load merchant settings. Please try again."}</div> : <form onSubmit={save} className="p-5 sm:p-7">{!storeAvailable && ["store", "delivery", "payments", "policies"].includes(section) && <p className="mb-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">Submit a store application before managing these settings. No store is currently associated with this merchant account.</p>}<SettingsForm section={section} value={section === "account" ? draft?.account || {} : draft?.[section] || emptySettings()[section]} change={change} onUploadImage={section === "store" ? uploadStoreImage : uploadProfileImage} imageUploading={imageUploading} storeImageUploading={storeImageUploading} storeImageRefs={storeImageRefs} saving={saving} />
            {section === "account" && <div className="mt-7 space-y-4 border-t border-slate-100 pt-5"><div><h3 className="text-sm font-semibold text-slate-800">Change password</h3><p className="mt-1 text-sm text-slate-600">Use your current password to set a new password. Other active sessions will be signed out.</p></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Current password" name="currentPassword" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} type="password" autoComplete="current-password" /><Field label="New password" name="newPassword" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" autoComplete="new-password" minLength={8} maxLength={128} /><Field label="Confirm new password" name="confirmPassword" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" autoComplete="new-password" /></div><button type="button" onClick={changePassword} disabled={saving || imageUploading} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{saving ? "Saving…" : "Change password"}</button></div>}
            {error && <p role="alert" className="mt-5 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}{message && <p role="status" className="mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}
            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={cancel} disabled={saving || imageUploading || Boolean(storeImageUploading)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50">Cancel</button><button type="submit" disabled={saving || imageUploading || Boolean(storeImageUploading) || (!storeAvailable && ["store", "delivery", "payments", "policies"].includes(section))} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50">{saving ? "Saving…" : "Save changes"}</button></div>
          </form>}
        </section>
      </div>
      {section !== "account" && <p className="mt-6 text-xs leading-5 text-slate-500">Merchant-defined content is editable above. Dvepo platform policies are controlled by Dvepo. Preference values are saved to your merchant account; notification delivery and payment processing depend on separate integrations.</p>}
    </main>
  </div>;
}
