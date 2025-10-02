import type { Metadata } from "next";
import { Geist, Geist_Mono, Lato } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const lato = Lato({
  weight: ["400", "700"],
  variable: "--font-lato",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arbius",
  description: "Arbius - Decentralized Machine Learning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lato.variable} antialiased flex min-h-screen flex-col bg-white`}
      >
        <GoogleAnalytics />
        <Providers>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[10000] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-lg">
            Skip to main content
          </a>
          <Navbar />
          <main id="main-content" className="flex-1" role="main">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
