import { type Metadata } from 'next'
import { type ReactNode } from 'react'

import { Providers } from './providers'
import { Layout } from '@/components/Layout'

import '@/styles/globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s - Arbius Protocol Reference',
    default: 'Arbius Protocol Reference',
  },
  description: 'Learn everything there is to know about the Arbius Protocol and integrate Arbius into your product.',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  other: {
    'msapplication-TileColor': '#da532c',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="flex min-h-full bg-white antialiased dark:bg-zinc-900">
        <Providers>
          <div className="w-full">
            <Layout>{children}</Layout>
          </div>
        </Providers>
      </body>
    </html>
  )
}
