import { Button } from '@/components/Button'
import { Heading } from '@/components/Heading'

const guides = [
 { 
    href: '/register-model',
    name: 'Register model',
    description: 'Learn how to add your own model.',
  },
  { 
    href: '/mining',
    name: 'Mining',
    description: 'Learn how to earn Arbius by solving tasks.',
  },
  { 
    href: '/tokenomics',
    name: 'Tokenomics',
    description: 'Learn how Arbius works economically.',
  },
  { 
    href: '/governance',
    name: 'Governance',
    description: 'Learn how Arbius is governed.',
  },
  { 
    href: '/integration',
    name: 'Integration',
    description: 'Learn how to integrate Arbius into your project.',
  },
]

export function Guides() {
  return (
    <div className="my-16 xl:max-w-none">
      <Heading level={2} id="guides">
        Guides
      </Heading>
      <div className="not-prose mt-4 grid grid-cols-1 gap-8 border-t border-zinc-900/5 pt-10 dark:border-white/5 sm:grid-cols-2 xl:grid-cols-4">
        {guides.map((guide) => (
          <div key={guide.href}>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              {guide.name}
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {guide.description}
            </p>
            <p className="mt-4">
              <Button href={guide.href} variant="text" arrow="right">
                Read more
              </Button>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
