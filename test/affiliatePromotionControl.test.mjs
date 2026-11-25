import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { confirmAffiliatePromotionChange } from "../src/app/Services/affiliatePromotionControl.js";
import { productService } from "../src/app/Services/productService.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("enabling affiliate promotion PATCHes the merchant product endpoint and maps the response", async () => {
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url: new URL(url), options };
    return new Response(JSON.stringify({ product: { id: "product-1", name: "Item", affiliatePromotionEnabled: true } }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  };

  const product = await productService.updateAffiliatePromotion("product-1", true);
  assert.equal(request.url.pathname, "/api/merchant/products/product-1/affiliate-promotion");
  assert.equal(request.options.method, "PATCH");
  assert.equal(request.options.credentials, "include");
  assert.deepEqual(JSON.parse(request.options.body), { affiliatePromotionEnabled: true });
  assert.equal(product.affiliatePromotionEnabled, true);
});

test("disabling affiliate promotion sends false and reflects the successful response", async () => {
  globalThis.fetch = async (_url, options) => {
    assert.deepEqual(JSON.parse(options.body), { affiliatePromotionEnabled: false });
    return new Response(JSON.stringify({ product: { id: "product-1", affiliatePromotionEnabled: false } }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  };
  const product = await productService.updateAffiliatePromotion("product-1", false);
  assert.equal(product.affiliatePromotionEnabled, false);
});

test("a failed update rejects without returning a replacement product", async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ message: "Product not found" }), {
    status: 404, headers: { "Content-Type": "application/json" },
  });
  await assert.rejects(productService.updateAffiliatePromotion("product-1", true), /Product not found/);
});

test("disabling requires confirmation and cancellation does not proceed", () => {
  let prompt = "";
  const accepted = confirmAffiliatePromotionChange(false, (message) => { prompt = message; return false; });
  assert.equal(accepted, false);
  assert.match(prompt, /active affiliate memberships will be withdrawn/i);
});

test("enabling does not require a confirmation prompt", () => {
  assert.equal(confirmAffiliatePromotionChange(true, () => assert.fail("unexpected confirmation")), true);
});

test("ordinary product update payload omits affiliate promotion state", async () => {
  const requests = [];
  globalThis.fetch = async (url, options) => {
    const parsed = new URL(url);
    requests.push({ path: parsed.pathname, method: options.method, body: options.body ? JSON.parse(options.body) : null });
    const product = { id: "product-1", model: "retail", name: "Item", affiliatePromotionEnabled: true, retail: { price: 10, stock: 2 }, images: [] };
    return new Response(JSON.stringify({ product }), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  await productService.updateProduct("product-1", { name: "Updated", affiliatePromotionEnabled: false });
  const patch = requests.find((request) => request.method === "PATCH");
  assert.equal(patch.path, "/api/merchant/products/product-1");
  assert.equal(Object.hasOwn(patch.body, "affiliatePromotionEnabled"), false);
});
