import { GoogleAnalytics as NextGoogleAnalytics } from '@next/third-parties/google'

const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID

export function GoogleAnalytics() {
  if (process.env.NODE_ENV !== 'production' || !GA_TRACKING_ID) {
    return null
  }

  return <NextGoogleAnalytics gaId={GA_TRACKING_ID} />
}
