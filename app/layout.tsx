import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";
import { LanguageProvider } from "../components/LanguageProvider";

// Nonces must be generated for each HTML request, rather than prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mgzavri | Intercity minivans in Georgia",
  description: "Find and book shared minivan seats or an entire van between cities in Georgia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-violet-900 focus:px-5 focus:py-3 focus:text-white">Skip to content</a>
          <Navbar />
          <main id="main-content">{children}</main>
        </LanguageProvider>
      </body>
    </html>
  );
}
