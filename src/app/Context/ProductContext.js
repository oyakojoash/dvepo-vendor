
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { productService } from "../Services/productService";

const ProductContext = createContext(null);

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestVersion = useRef(0);

  // Load products manually or when filters change.
  const refreshProducts = useCallback(async (filters = {}) => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);

    try {
      const result = await productService.getProducts(filters);
      if (version === requestVersion.current) setProducts(result);
      return result;
    } catch (err) {
      if (version === requestVersion.current) setError(err.message || "Failed to load products.");
      throw err;
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, []);

  // Load initial products when the provider mounts.
  useEffect(() => {
    let cancelled = false;
    const version = ++requestVersion.current;

    async function loadInitialProducts() {
      try {
        const result = await productService.getProducts();

        if (!cancelled && version === requestVersion.current) {
          setProducts(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled && version === requestVersion.current) {
          setError(err.message || "Failed to load products.");
        }
      } finally {
        if (!cancelled && version === requestVersion.current) {
          setLoading(false);
        }
      }
    }

    loadInitialProducts();

    return () => {
      cancelled = true;
      if (requestVersion.current === version) requestVersion.current += 1;
    };
  }, []);

  // Add a product.
  const addProduct = useCallback(async (productData) => {
    requestVersion.current += 1;
    setError(null);

    try {
      const newProduct = await productService.addProduct(productData);

      setProducts((currentProducts) => [
        ...currentProducts,
        newProduct,
      ]);

      return newProduct;
    } catch (err) {
      setError(err.message || "Failed to add product.");
      throw err;
    }
  }, []);

  // Update an existing product.
  const updateProduct = useCallback(async (id, changes) => {
    requestVersion.current += 1;
    setError(null);

    try {
      const updatedProduct = await productService.updateProduct(
        id,
        changes
      );

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === id ? updatedProduct : product
        )
      );

      return updatedProduct;
    } catch (err) {
      setError(err.message || "Failed to update product.");
      throw err;
    }
  }, []);

  // Activate or deactivate a product.
  const updateProductStatus = useCallback(async (id, status) => {
    requestVersion.current += 1;
    setError(null);

    try {
      const updatedProduct =
        await productService.updateProductStatus(id, status);

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === id ? updatedProduct : product
        )
      );

      return updatedProduct;
    } catch (err) {
      setError(err.message || "Failed to update product status.");
      throw err;
    }
  }, []);

  const updateAffiliatePromotion = useCallback(async (id, enabled) => {
    requestVersion.current += 1;
    setError(null);
    try {
      const updatedProduct = await productService.updateAffiliatePromotion(id, enabled);
      setProducts((currentProducts) => currentProducts.map((product) =>
        product.id === id ? updatedProduct : product
      ));
      return updatedProduct;
    } catch (err) {
      setError(err.message || "Failed to update affiliate promotion.");
      throw err;
    }
  }, []);

  const deleteProduct = useCallback(async (id) => {
    requestVersion.current += 1;
    setError(null);
    try {
      await productService.deleteProduct(id);
      await refreshProducts();
    } catch (err) {
      setError(err.message || "Failed to delete product.");
      throw err;
    }
  }, [refreshProducts]);

  const duplicateProduct = useCallback(async (id) => {
    requestVersion.current += 1;
    setError(null);
    try {
      const copy = await productService.duplicateProduct(id);
      setProducts((current) => [...current, copy]);
      return copy;
    } catch (err) {
      setError(err.message || "Failed to duplicate product.");
      throw err;
    }
  }, []);

  const value = {
    products,
    loading,
    error,
    refreshProducts,
    addProduct,
    updateProduct,
    updateProductStatus,
    updateAffiliatePromotion,
    deleteProduct,
    duplicateProduct,
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}

// Reusable hook for pages and components.
export function useProducts() {
  const context = useContext(ProductContext);

  if (!context) {
    throw new Error(
      "useProducts must be used inside a ProductProvider."
    );
  }

  return context;
}
