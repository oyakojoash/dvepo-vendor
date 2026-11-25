const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");
const PRODUCTS_URL = `${API_BASE_URL}/api/merchant/products`;
const PAGE_SIZE = 50;
const VALID_MODELS = ["retail", "wholesale", "subscription"];
const VALID_STATUSES = ["draft", "active", "inactive", "out of stock"];
const inFlightLists = new Map();

function imageReferenceToImage(reference, index) {
  let src = reference;
  if (reference.startsWith("/api/images/")) {
    src = `${API_BASE_URL}${reference}`;
  } else if (!/^https?:\/\//i.test(reference) && !reference.startsWith("/") && !reference.includes("/")) {
    src = `${API_BASE_URL}/api/images/${encodeURIComponent(reference)}`;
  }
  return {
    id: `${index}-${reference}`,
    name: reference.split("/").pop() || "Product image",
    src,
    reference,
    primary: index === 0,
    source: "api",
  };
}

function isSafeImageReference(value) {
  if (typeof value !== "string" || !value || value.length > 2048 || /[\u0000-\u0020\\]/.test(value)) return false;
  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      return Boolean(parsed.hostname);
    } catch {
      return false;
    }
  }
  return value.startsWith("/") ? !value.startsWith("//") : /^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(value);
}

function mapApiProduct(product, localImages = []) {
  if (!product || typeof product !== "object") throw new Error("The product service returned an invalid product.");
  const references = Array.isArray(product.images) ? product.images : [];
  const images = references.filter(isSafeImageReference).map(imageReferenceToImage);
  const referenceSet = new Set(references);
  // Device and frontend-library images remain visible in this session, but are not uploaded by this API.
  for (const image of localImages) {
    if (image?.src && !referenceSet.has(image.src) && !images.some((current) => current.src === image.src)) {
      images.push({ ...image, primary: images.length === 0 || image.primary });
    }
  }
  return {
    ...product,
    id: String(product.id ?? product._id ?? ""),
    currency: product.currency === "KES" ? "KSh" : product.currency || "KSh",
    images,
    ...(product.retail && { retail: { ...product.retail } }),
    ...(product.wholesale && { wholesale: { ...product.wholesale, bulkPricing: [...(product.wholesale.bulkPricing || [])] } }),
    ...(product.subscription && { subscription: { ...product.subscription } }),
  };
}

function toApiProduct(product, { creating = false } = {}) {
  if (!product || typeof product !== "object") throw new Error("A valid product object is required.");
  if (creating && !VALID_MODELS.includes(product.model)) throw new Error("Choose retail, wholesale, or subscription.");
  if (product.status !== undefined && !VALID_STATUSES.includes(product.status)) throw new Error("Choose a valid product status.");
  if (!creating && product.model && !VALID_MODELS.includes(product.model)) throw new Error("Choose a valid product model.");

  const payload = {};
  for (const field of ["name", "description", "productClass", "category", "sku", "status"]) {
    if (product[field] !== undefined) payload[field] = product[field];
  }
  payload.currency = "KES";
  if (product.images !== undefined) {
    payload.images = (product.images || []).map((image) => typeof image === "string" ? image : image?.reference || image?.src)
      .filter((reference, index, all) => isSafeImageReference(reference) && all.indexOf(reference) === index)
      .slice(0, 10);
  }

  const model = creating ? product.model : product.model;
  if (creating) payload.model = model;
  if (model === "retail" && product.retail) {
    const { price, stock } = product.retail;
    payload.retail = { price: Number(price), stock: Number(stock) };
  } else if (model === "wholesale" && product.wholesale) {
    const { unitPrice, minimumOrderQuantity, stock, unitsPerPackage, bulkPricing = [] } = product.wholesale;
    payload.wholesale = {
      unitPrice: Number(unitPrice),
      minimumOrderQuantity: Number(minimumOrderQuantity),
      stock: Number(stock),
      unitsPerPackage: unitsPerPackage === "" ? null : unitsPerPackage == null ? null : Number(unitsPerPackage),
      bulkPricing: bulkPricing.map((tier) => ({ minimumQuantity: Number(tier.minimumQuantity), unitPrice: Number(tier.unitPrice) })),
    };
  } else if (model === "subscription" && product.subscription) {
    const { price, billingInterval, duration, autoRenew, benefits } = product.subscription;
    payload.subscription = { price: Number(price), billingInterval, duration: Number(duration), autoRenew, benefits: benefits || "" };
  }
  // storeId, merchantId, IDs, timestamps, and retail.variants are intentionally omitted.
  return payload;
}

async function request(path, { method = "GET", body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${PRODUCTS_URL}${path}`, {
      method,
      credentials: "include",
      cache: "no-store",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: signal || AbortSignal.timeout(15000),
    });
  } catch (error) {
    const message = error?.name === "TimeoutError"
      ? "The product service took too long to respond. Please try again."
      : "Could not reach the product service. Check that the backend is running and try again.";
    throw new Error(message);
  }

  let payload = {};
  try {
    const text = await response.text();
    payload = text ? JSON.parse(text) : {};
  } catch {
    // Keep the HTTP status message when the server response is not JSON.
  }
  if (!response.ok) {
    const fallback = response.status === 401
      ? "Your merchant session has expired. Sign in again."
      : response.status >= 500
        ? "The product service is temporarily unavailable. Please try again."
        : `The product request could not be completed (HTTP ${response.status}).`;
    throw new Error(payload.message || payload.error || fallback);
  }
  return payload;
}

function queryString(filters, page) {
  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  for (const field of ["q", "model", "status", "category", "sort", "includeArchived"]) {
    const value = filters[field];
    if (value !== undefined && value !== "" && value !== "all") params.set(field, String(value));
  }
  return `?${params}`;
}

async function fetchAllProducts(filters, signal) {
  const first = await request(queryString(filters, 1), { signal });
  if (!Array.isArray(first.items)) throw new Error("The product service returned an invalid product list.");
  const items = [...first.items];
  const pages = Number(first.pagination?.pages) || 1;
  for (let page = 2; page <= pages; page += 1) {
    const result = await request(queryString(filters, page), { signal });
    if (!Array.isArray(result.items)) throw new Error("The product service returned an invalid product list.");
    items.push(...result.items);
  }
  const unique = new Map();
  for (const item of items) {
    const id = String(item?.id ?? item?._id ?? "");
    if (!unique.has(id)) unique.set(id, item);
  }
  return [...unique.values()].map((item) => mapApiProduct(item));
}

function localImagesFrom(product) {
  return (product?.images || []).filter((image) => image && typeof image === "object" && image.src && !isSafeImageReference(image.src));
}

async function persistLocalImages(product) {
  const images = product.images || [];
  const persisted = [];
  for (const image of images) {
    if (image?.source === 'local' && !image?.file) {
      const localResponse = await fetch(new URL(image.src, window.location.origin));
      if (!localResponse.ok) throw new Error('A selected library image could not be loaded.');
      const blob = await localResponse.blob();
      const form = new FormData();
      form.append('image', blob, image.name || 'product-image');
      const response = await fetch(`${API_BASE_URL}/api/images/upload`, { method: 'POST', body: form, credentials: 'include' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.reference) throw new Error(result.message || 'Image upload failed.');
      persisted.push(result.reference);
      continue;
    }
    if (!image?.file) {
      if (image?.reference || (typeof image?.src === 'string' && isSafeImageReference(image.src))) persisted.push(image.reference || image.src);
      continue;
    }
    const form = new FormData();
    form.append('image', image.file);
    const response = await fetch(`${API_BASE_URL}/api/images/upload`, { method: 'POST', body: form, credentials: 'include' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.reference) throw new Error(result.message || 'Image upload failed.');
    persisted.push(result.reference);
  }
  return persisted;
}

export const productService = {
  async getProducts(filters = {}) {
    const normalized = { ...filters };
    delete normalized.storeId;
    delete normalized.page;
    delete normalized.limit;
    delete normalized.signal;
    const key = JSON.stringify(Object.keys(normalized).sort().map((field) => [field, normalized[field]]));
    if (inFlightLists.has(key)) return inFlightLists.get(key);
    const pending = fetchAllProducts(normalized, filters.signal).finally(() => inFlightLists.delete(key));
    inFlightLists.set(key, pending);
    return pending;
  },

  async getProductById(id) {
    const payload = await request(`/${encodeURIComponent(id)}`);
    return mapApiProduct(payload.product);
  },

  async addProduct(productData) {
    const body = toApiProduct(productData, { creating: true });
    body.images = await persistLocalImages(productData);
    const payload = await request("", { method: "POST", body });
    return mapApiProduct(payload.product);
  },

  async updateProduct(id, changes) {
    const current = await this.getProductById(id);
    if (changes.model && changes.model !== current.model) {
      throw new Error("Changing a product's model is not supported. Create a new product under the desired model.");
    }
    const productData = { ...current, ...changes, model: current.model };
    const body = toApiProduct(productData);
    if (changes.images !== undefined) body.images = await persistLocalImages(productData);
    const payload = await request(`/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body,
    });
    return mapApiProduct(payload.product);
  },

  async updateProductStatus(id, status) {
    if (!VALID_STATUSES.includes(status)) throw new Error("Choose a valid product status.");
    const payload = await request(`/${encodeURIComponent(id)}`, { method: "PATCH", body: { status } });
    return mapApiProduct(payload.product);
  },

  async updateAffiliatePromotion(id, affiliatePromotionEnabled) {
    if (typeof affiliatePromotionEnabled !== "boolean") {
      throw new Error("Affiliate promotion must be enabled or disabled.");
    }
    if (typeof id !== "string" || !id) throw new Error("A valid product is required.");
    const payload = await request(`/${encodeURIComponent(id)}/affiliate-promotion`, {
      method: "PATCH",
      body: { affiliatePromotionEnabled },
    });
    if (!payload.product || typeof payload.product.affiliatePromotionEnabled !== "boolean") {
      throw new Error("The product service returned an invalid affiliate promotion response.");
    }
    return mapApiProduct(payload.product);
  },

  async duplicateProduct(id) {
    const original = await this.getProductById(id);
    const payload = toApiProduct({ ...original, name: `${original.name} (copy)`, status: "draft" }, { creating: true });
    const result = await request("", { method: "POST", body: payload });
    return mapApiProduct(result.product, localImagesFrom(original));
  },

  async deleteProduct(id) {
    const result = await request(`/${encodeURIComponent(id)}`, { method: "DELETE" });
    return result.product ? mapApiProduct(result.product) : null;
  },
};
