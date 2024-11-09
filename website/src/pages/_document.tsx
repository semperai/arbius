import { Html, Head, Main, NextScript } from 'next/document';
import { GA_TRACKING_ID } from '@/gtag';

export default function Document() {
  return (
    <Html lang='en' className='h-full'>
      <Head>
        {process.env.NODE_ENV === 'production' && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
            />
            <script
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_TRACKING_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
      </Head>
      <body className='h-full'>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
