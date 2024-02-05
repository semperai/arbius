import { useEffect } from "react";
import Head from 'next/head'
import { Router, useRouter } from 'next/router'
import type { AppProps } from "next/app"
import { MDXProvider } from '@mdx-js/react'

import { Layout } from '@/components/Layout'
import * as mdxComponents from '@/components/mdx'
import { useMobileNavigationStore } from '@/components/MobileNavigation'
import * as gtag from '@/lib/gtag'

import '@/styles/globals.css'
import 'focus-visible'

function onRouteChange() {
  useMobileNavigationStore.getState().close()
}

Router.events.on('routeChangeStart', onRouteChange)
Router.events.on('hashChangeStart', onRouteChange)


export default function App({
  Component,
  pageProps
}: AppProps<{
  title: string;
  description: string;
}>) {
  let router = useRouter()

  useEffect(() => {
    const handleRouteChange = (url: URL) => {
      if (process.env.NODE_ENV === 'production') {
        gtag.pageview(url);
      }
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  return (
    <>
      <Head>
        {router.pathname === '/' ? (
          <title>Arbius Protocol Reference</title>
        ) : (
          <title>{`${pageProps.title} - Arbius Protocol Reference`}</title>
        )}
        <meta name="description" content={pageProps.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      { /* TODO FIXME */ }
      { /* @ts-ignore */ }
      <MDXProvider components={mdxComponents}>
        <Layout {...pageProps}>
          <Component {...pageProps} />
        </Layout>
      </MDXProvider>
    </>
  )
}
