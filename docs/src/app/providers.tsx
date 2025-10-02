'use client'

import { type ReactNode, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { MDXProvider } from '@mdx-js/react'

import * as mdxComponents from '@/components/mdx'
import { useMobileNavigationStore } from '@/components/MobileNavigation'

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    // Close mobile navigation on route change
    useMobileNavigationStore.getState().close()
  }, [pathname])

  return (
    <MDXProvider components={mdxComponents}>
      {children}
    </MDXProvider>
  )
}
