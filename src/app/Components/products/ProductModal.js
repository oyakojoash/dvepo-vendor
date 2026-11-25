
"use client";

import { useState } from "react";
import ProductTypeSelector from "./ProductTypeSelector";
import ProductForm from "./ProductForm";

export default function ProductModal({
  isOpen,
  onClose,
  onSave,
  product = null,
  error = "",
}) {
  const [selectedModel, setSelectedModel] = useState(
    product?.model ?? null
  );
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) {
    return null;
  }

  async function handleSave(productData) {
    setSubmitting(true);

    try {
      // Pass the existing ID when editing; null when creating.
      const saved = await onSave(productData, product?.id ?? null);
      if (saved === false) return;

      setSelectedModel(product?.model ?? null);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    if (!submitting) {
      setSelectedModel(product?.model ?? null);
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id="product-modal-title"
              className="text-xl font-semibold text-gray-900"
            >
              {product ? "Edit product" : "Add a product"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {product
                ? "Update the product information."
                : "Choose a product model and enter its details."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            aria-label="Close product dialog"
            className="rounded-lg px-3 py-1 text-xl text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          {error && <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}
          {!product && !selectedModel && (
            <>
              <ProductTypeSelector
                selectedModel={selectedModel}
                onSelect={setSelectedModel}
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {selectedModel && (
            <>
              {!product && (
                <button
                  type="button"
                  onClick={() => setSelectedModel(null)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  ← Change product type
                </button>
              )}

              <ProductForm
                key={`${product?.id ?? "new"}-${selectedModel}`}
                model={selectedModel}
                initialProduct={product}
                onSubmit={handleSave}
                onCancel={handleClose}
                submitting={submitting}
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
