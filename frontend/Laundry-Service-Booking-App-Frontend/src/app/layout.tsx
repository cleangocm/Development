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
  title: "Ultra Wash - Premium Laundry & Dry Cleaning Services",
  description: "Professional dry cleaning and laundry services delivered to your doorstep. We pick up, clean, and deliver with guaranteed satisfaction.",
  keywords: "laundry, dry cleaning, wash and fold, pressing, cleaning services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
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
