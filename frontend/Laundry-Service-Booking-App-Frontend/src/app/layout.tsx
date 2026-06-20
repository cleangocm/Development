import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import AuthContextProvider from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import ScrollToTop from "@/components/common/ScrollToTop";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CleanGo - Collecte propre, avenir propre",
  description: "CleanGo organise la collecte intelligente des dechets a domicile et pour les entreprises au Cameroun.",
  keywords: "CleanGo, collecte dechets, gestion dechets, ramassage ordures, Yaounde, Cameroun",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning={true} className={`${inter.variable} antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300`}>
        <Script src="/assets/lang-config.js" strategy="beforeInteractive" />
        <Script src="/assets/translation.js" strategy="beforeInteractive" />
        <Script src="//translate.google.com/translate_a/element.js?cb=TranslateInit" strategy="afterInteractive" />
        <AuthContextProvider>
          <ThemeProvider>
            <ToastProvider>
              <div id="google_translate_element" style={{ display: 'none' }}></div>
              <ConditionalLayout>{children}</ConditionalLayout>
              <ScrollToTop />
            </ToastProvider>
          </ThemeProvider>
        </AuthContextProvider>
      </body>
    </html>
  );
}
