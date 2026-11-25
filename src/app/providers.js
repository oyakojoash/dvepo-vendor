
"use client";

import { ProductProvider } from "./Context/ProductContext";
import { OrderProvider } from "./Context/OrderContext";
import { StoryProvider } from "./Context/StoryContext";

export default function Providers({ children }) {
  return (
    <ProductProvider>
      <OrderProvider>
        <StoryProvider>{children}</StoryProvider>
      </OrderProvider>
    </ProductProvider>
  );
}
