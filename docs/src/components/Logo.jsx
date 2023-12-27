import { useEffect } from 'react'
import Image from 'next/image'

export function Logo(props) {
    return (
      <>
        <span className="block dark:hidden">
          <Image
            src="/logo.png"
            width={52}
            height={24}
            {...props}
          />
        </span>
        <span className="hidden dark:block">
          <Image
            src="/logo-light.png"
            width={52}
            height={24}
            {...props}
          />
        </span>
      </>
    )
}
