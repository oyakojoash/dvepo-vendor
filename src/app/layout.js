
import "./globals.css";
import Providers from "./providers";
import { MerchantAuthProvider } from "./Context/MerchantAuthContext";

export const metadata = {
  title: "Dvepo",
  description: "Dvepo Merchant Portal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <MerchantAuthProvider>
          <Providers>{children}</Providers>
        </MerchantAuthProvider>
      </body>
    </html>
  );
}
