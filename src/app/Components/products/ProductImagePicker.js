"use client";
/* eslint @next/next/no-img-element: off -- static image previews are selected in this form. */

import { useRef, useState } from "react";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const PRODUCT_IMAGES = [
  { id: "laptop", name: "Laptop", src: "/images/products/laptop.jpg" },
  { id: "phone", name: "Phone", src: "/images/products/phone.jpg" },
  { id: "shoe", name: "Shoe", src: "/images/products/shoe.avif" },
];

export default function ProductImagePicker({ images = [], onChange, singleImage = false }) {
  const inputRef = useRef(null);
  const [message, setMessage] = useState("");
  const [reading, setReading] = useState(false);
  const image = images.find((item) => item.primary) || images[0];

  function chooseLibraryImage(productImage) {
    const selected = {
      id: productImage.id,
      name: productImage.name,
      src: productImage.src,
      primary: true,
      source: "local",
    };
    if (singleImage) {
      onChange([selected]);
      return;
    }

    const existing = images.find((item) => item.src === productImage.src);
    if (existing) {
      const next = images.filter((item) => item.src !== productImage.src);
      if (existing.primary && next.length) next[0].primary = true;
      onChange(next);
      return;
    }
    onChange([...images.map((item) => ({ ...item, primary: false })), selected]);
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setMessage("");
    if (!file) return;
    if (!SUPPORTED_TYPES.includes(file.type)) {
      setMessage("Choose a JPG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setMessage("Choose an image smaller than 5 MB.");
      return;
    }

    setReading(true);
    try {
      const src = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("The image could not be read."));
        reader.readAsDataURL(file);
      });
      const selected = {
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        name: file.name,
        src,
        file,
        primary: true,
        source: "local",
      };
      onChange(singleImage ? [selected] : [...images.map((item) => ({ ...item, primary: false })), selected]);
    } catch {
      setMessage("The image could not be read. Choose another file.");
    } finally {
      setReading(false);
    }
  }

  function removeImage() {
    onChange(singleImage ? [] : images.filter((item) => item.id !== image?.id));
    setMessage("");
  }

  return (
    <section aria-label="Product images">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Product images</h3>
          <p className="mt-1 text-xs text-gray-500">Choose an image from the product library. Device images are preview-only and are not saved by the product service.</p>
        </div>
        <label className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-emerald-600">
          {reading ? "Reading…" : "Choose from device"}
          <input ref={inputRef} type="file" accept={SUPPORTED_TYPES.join(",")} className="sr-only" onChange={handleFile} disabled={reading} />
        </label>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {PRODUCT_IMAGES.map((productImage) => {
          const selected = images.some((item) => item.src === productImage.src);
          return (
            <button
              key={productImage.id}
              type="button"
              onClick={() => chooseLibraryImage(productImage)}
              aria-pressed={selected}
              className={`overflow-hidden rounded-xl border text-left transition ${selected ? "border-emerald-600 ring-2 ring-emerald-200" : "border-gray-200 hover:border-emerald-400"}`}
            >
              <img src={productImage.src} alt={productImage.name} className="aspect-square w-full object-cover" />
              <span className="block p-2 text-xs font-medium text-gray-800">{productImage.name}{selected ? " · Selected" : ""}</span>
            </button>
          );
        })}
      </div>

      {image && (
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-gray-200 p-2">
          <img src={image.src} alt={`${image.name || "Product"} preview`} className="h-14 w-14 rounded object-cover" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-800">Primary image</p>
            <p className="truncate text-xs text-gray-500">{image.name}</p>
          </div>
          <button type="button" onClick={removeImage} className="text-xs font-semibold text-rose-700">Remove</button>
        </div>
      )}
      {message && <p role="alert" className="mt-2 text-sm text-rose-700">{message}</p>}
    </section>
  );
}
