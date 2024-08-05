//import "./globals.css";
import Header from '@/app/components/Header/Header'
import Footer from '@/app/components/Footer/Footer'
import {Lato} from 'next/font/google'
import Head from 'next/head'


export const lato = Lato({
    subsets: ['latin'],
    preload:true,
    weight: ['400', '700'],
    display: 'swap',
    variable: '--font-lato',
  })
export const metadata = {
  title: "Arbius: Decentralized AI Hosting & Marketplace",
  description: "Arbius is a decentralized network powered by GPUs globally and a shared economy around generative AI",
  baseURL: "https://arbius.ai"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <Head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        
        <meta property="og:url" content="https://arbius.ai/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={metadata.title} />
        <meta property="og:description" content={metadata.description} />
        <meta property="og:image" content={metadata.baseURL+"/arbius_thumbnail_website.png"} />

        <meta name="twitter:card" content={metadata.baseURL+"/arbius_thumbnail_website.png"} />
        <meta property="twitter:domain" content="arbius.ai" />
        <meta property="twitter:url" content={metadata.baseURL} />
        <meta name="twitter:title" content={metadata.title} />
        <meta name="twitter:description" content={metadata.description} />
        <meta name="twitter:image" content={metadata.baseURL+"/arbius_thumbnail_website.png"} />

        <link rel="preload" as="font" href="https://res.cloudinary.com/aniket98571/raw/upload/v1715256918/Geist-SemiBold_h3w290.ttf" crossOrigin="anonymous"/>
        <link rel="preload" as="font" href="https://res.cloudinary.com/aniket98571/raw/upload/v1715232194/Geist-Regular_vvwe3i.ttf" crossOrigin="anonymous"/>
        <link rel="preload" as="font" href="https://res.cloudinary.com/aniket98571/raw/upload/v1717580903/AtHaussAero-Light_iwko9o.ttf" crossOrigin="anonymous"/>
      </Head>
      <body class="bg-white-background">
        <Header/>
        {children}
        <Footer/>
      </body>
    </html>
  );
}
