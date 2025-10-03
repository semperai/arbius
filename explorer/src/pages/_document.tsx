import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Meta Tags */}
        <meta name="description" content="Explore the Arbius decentralized AI network. View tasks, models, validators, and real-time network statistics." />
        <meta name="keywords" content="arbius, decentralized ai, blockchain, ai network, web3, ethereum, arbitrum" />
        <meta name="author" content="Arbius" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Arbius Explorer | Decentralized AI Network" />
        <meta property="og:description" content="Explore the Arbius decentralized AI network. View tasks, models, validators, and real-time network statistics." />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:site_name" content="Arbius Explorer" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Arbius Explorer | Decentralized AI Network" />
        <meta name="twitter:description" content="Explore the Arbius decentralized AI network. View tasks, models, validators, and real-time network statistics." />
        <meta name="twitter:image" content="/og-image.png" />

        {/* Theme Color */}
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
