
"use client";

import { useState } from "react";
import ProductImagePicker from "./ProductImagePicker";

const emptyForm = {
  name: "",
  description: "",
  productClass: "",
  category: "",
  sku: "",
  status: "active",
  images: [],
  storeId: "store-001",
  retail: {
    price: "",
    stock: "",
  },
  wholesale: {
    unitPrice: "",
    minimumOrderQuantity: "10",
    stock: "",
    unitsPerPackage: "",
    bulkPricing: [],
  },
  subscription: {
    price: "",
    billingInterval: "month",
    duration: "12",
    autoRenew: true,
    benefits: "",
  },
};

function createForm(product) {
  if (!product) {
    return {
      ...emptyForm,
      retail: { ...emptyForm.retail },
      wholesale: { ...emptyForm.wholesale },
      subscription: { ...emptyForm.subscription },
    };
  }

  return {
    ...emptyForm,
    ...product,
    images: (product.images || []).map((image) => ({ ...image })),
    retail: {
      ...emptyForm.retail,
      ...(product.retail || {}),
    },
    wholesale: {
      ...emptyForm.wholesale,
      ...(product.wholesale || {}),
      bulkPricing: product.wholesale?.bulkPricing || [],
    },
    subscription: {
      ...emptyForm.subscription,
      ...(product.subscription || {}),
    },
  };
}

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </span>

      {children}

      {hint && (
        <span className="mt-1 block text-xs text-gray-500">
          {hint}
        </span>
      )}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function ProductForm({
  model,
  initialProduct = null,
  onSubmit,
  onCancel,
  submitting = false,
}) {
  const [form, setForm] = useState(() =>
    createForm(initialProduct)
  );
  const [bulkPricingText, setBulkPricingText] = useState(() =>
    (initialProduct?.wholesale?.bulkPricing || []).map((tier) => `${tier.minimumQuantity}:${tier.unitPrice}`).join(", ")
  );

  const [formError, setFormError] = useState("");

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateModelField(section, field, value) {
    setForm((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Enter a product name.");
      return;
    }

    const product = {
      name: form.name.trim(),
      description: form.description.trim(),
      productClass: form.productClass.trim(),
      category: form.category.trim(),
      sku: form.sku.trim(),
      images: form.images,
      currency: "KSh",
      status: form.status,
      storeId: form.storeId.trim(),
      model,
    };

    const bulkPricing = bulkPricingText.split(",").map((part) => {
      const [minimumQuantity, unitPrice] = part.split(":").map(Number);
      return { minimumQuantity, unitPrice };
    }).filter((tier) => tier.minimumQuantity > 0 && tier.unitPrice > 0);

    if (model === "retail") {
      product.retail = {
        price: Number(form.retail.price),
        stock: Number(form.retail.stock),
      };
    }

    if (model === "wholesale") {
      product.wholesale = {
        unitPrice: Number(form.wholesale.unitPrice),
        minimumOrderQuantity: Number(
          form.wholesale.minimumOrderQuantity
        ),
        stock: Number(form.wholesale.stock),
        unitsPerPackage: form.wholesale.unitsPerPackage ? Number(form.wholesale.unitsPerPackage) : null,
        bulkPricing,
      };
    }

    if (model === "subscription") {
      product.subscription = {
        price: Number(form.subscription.price),
        billingInterval: form.subscription.billingInterval,
        duration: Number(form.subscription.duration),
        autoRenew: form.subscription.autoRenew,
        benefits: form.subscription.benefits.trim(),
      };
    }

    try {
      await onSubmit(product);
    } catch (error) {
      setFormError(
        error.message || "Unable to save this product."
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Product name">
          <input
            className={inputClass}
            value={form.name}
            onChange={(event) =>
              updateField("name", event.target.value)
            }
            placeholder="e.g. Wireless Headphones"
            required
          />
        </Field>

        <Field label="Product class">
          <input
            className={inputClass}
            value={form.productClass}
            onChange={(event) =>
              updateField("productClass", event.target.value)
            }
            placeholder="e.g. Electronics"
          />
        </Field>

        <Field label="Category">
          <input
            className={inputClass}
            value={form.category}
            onChange={(event) =>
              updateField("category", event.target.value)
            }
            placeholder="e.g. Audio"
          />
        </Field>

        <Field
          label="Store ID"
          hint="Legacy display field only. The Merchant API assigns ownership to your signed-in account."
        >
          <input
            className={inputClass}
            value={form.storeId}
            onChange={(event) =>
              updateField("storeId", event.target.value)
            }
            required
          />
        </Field>
      </div>

      <Field label="Product status"><select className={inputClass} value={form.status || "active"} onChange={(event) => updateField("status", event.target.value)}><option value="draft">Draft</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="out of stock">Out of stock</option></select></Field>

      <Field label="Description">
        <textarea
          className={inputClass}
          rows={3}
          value={form.description}
          onChange={(event) =>
            updateField("description", event.target.value)
          }
          placeholder="Describe the product or service"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="SKU">
          <input className={inputClass} value={form.sku} onChange={(event) => updateField("sku", event.target.value)} placeholder="Optional stock keeping code" />
        </Field>
        {model === "retail" && <Field label="Variants (size, colour, etc.)" hint="Separate variants with commas. Variants are not supported by the Merchant API and will not be saved.">
          <input className={inputClass} value={form.retail.variants || ""} onChange={(event) => updateModelField("retail", "variants", event.target.value)} placeholder="Small, Medium, Large" />
        </Field>}
      </div>

      <ProductImagePicker
        images={form.images}
        onChange={(images) => updateField("images", images)}
        singleImage={!initialProduct}
        productName={form.name}
      />

      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="mb-4 font-semibold text-gray-900">
          {model === "retail" && "Retail pricing and inventory"}
          {model === "wholesale" &&
            "Wholesale pricing and inventory"}
          {model === "subscription" &&
            "Subscription settings"}
        </h3>

        {model === "retail" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Selling price (KSh)">
              <input
                className={inputClass}
                type="number"
                min="0.01"
                step="0.01"
                value={form.retail.price}
                onChange={(event) =>
                  updateModelField(
                    "retail",
                    "price",
                    event.target.value
                  )
                }
                required
              />
            </Field>

            <Field label="Available stock">
              <input
                className={inputClass}
                type="number"
                min="0"
                step="1"
                value={form.retail.stock}
                onChange={(event) =>
                  updateModelField(
                    "retail",
                    "stock",
                    event.target.value
                  )
                }
                required
              />
            </Field>
          </div>
        )}

        {model === "wholesale" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Unit price (KSh)">
              <input
                className={inputClass}
                type="number"
                min="0.01"
                step="0.01"
                value={form.wholesale.unitPrice}
                onChange={(event) =>
                  updateModelField(
                    "wholesale",
                    "unitPrice",
                    event.target.value
                  )
                }
                required
              />
            </Field>

            <Field label="Minimum order quantity">
              <input
                className={inputClass}
                type="number"
                min="1"
                step="1"
                value={form.wholesale.minimumOrderQuantity}
                onChange={(event) =>
                  updateModelField(
                    "wholesale",
                    "minimumOrderQuantity",
                    event.target.value
                  )
                }
                required
              />
            </Field>

            <Field label="Available stock">
              <input
                className={inputClass}
                type="number"
                min="0"
                step="1"
                value={form.wholesale.stock}
                onChange={(event) =>
                  updateModelField(
                    "wholesale",
                    "stock",
                    event.target.value
                  )
                }
                required
              />
            </Field>
            <Field label="Units per package">
              <input className={inputClass} type="number" min="1" step="1" value={form.wholesale.unitsPerPackage || ""} onChange={(event) => updateModelField("wholesale", "unitsPerPackage", event.target.value)} placeholder="Optional" />
            </Field>
            <Field label="Bulk price tiers" hint="Enter each tier as minimum quantity:unit price, e.g. 10:300,50:250">
              <input className={inputClass} value={bulkPricingText} onChange={(event) => setBulkPricingText(event.target.value)} placeholder="10:300, 50:250" />
            </Field>
          </div>
        )}

        {model === "subscription" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Recurring price (KSh)">
              <input
                className={inputClass}
                type="number"
                min="0.01"
                step="0.01"
                value={form.subscription.price}
                onChange={(event) =>
                  updateModelField(
                    "subscription",
                    "price",
                    event.target.value
                  )
                }
                required
              />
            </Field>

            <Field label="Billing interval">
              <select
                className={inputClass}
                value={form.subscription.billingInterval}
                onChange={(event) =>
                  updateModelField(
                    "subscription",
                    "billingInterval",
                    event.target.value
                  )
                }
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
            </Field>

            <Field
              label="Duration (billing periods)"
              hint="For example, 12 monthly periods"
            >
              <input
                className={inputClass}
                type="number"
                min="1"
                step="1"
                value={form.subscription.duration}
                onChange={(event) =>
                  updateModelField(
                    "subscription",
                    "duration",
                    event.target.value
                  )
                }
                required
              />
            </Field>

            <label className="flex items-center gap-2 self-center text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.subscription.autoRenew}
                onChange={(event) =>
                  updateModelField(
                    "subscription",
                    "autoRenew",
                    event.target.checked
                  )
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              Automatically renew subscription
            </label>
            <Field label="Benefits"><textarea className={inputClass} rows={2} value={form.subscription.benefits || ""} onChange={(event) => updateModelField("subscription", "benefits", event.target.value)} placeholder="What subscribers receive" /></Field>
          </div>
        )}
      </div>

      {formError && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {formError}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? "Saving..."
            : initialProduct
              ? "Save changes"
              : "Create product"}
        </button>
      </div>
    </form>
  );
}
