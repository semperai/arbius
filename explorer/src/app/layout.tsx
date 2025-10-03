import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';
import '@/styles/globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Arbius Explorer | Decentralized AI Network',
  description: 'Explore the Arbius decentralized AI network. View tasks, models, validators, and real-time network statistics.',
  keywords: ['arbius', 'decentralized ai', 'blockchain', 'ai network', 'web3', 'ethereum', 'arbitrum'],
  authors: [{ name: 'Arbius' }],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    title: 'Arbius Explorer | Decentralized AI Network',
    description: 'Explore the Arbius decentralized AI network. View tasks, models, validators, and real-time network statistics.',
    images: ['/og-image.png'],
    siteName: 'Arbius Explorer',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Arbius Explorer | Decentralized AI Network',
    description: 'Explore the Arbius decentralized AI network. View tasks, models, validators, and real-time network statistics.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
