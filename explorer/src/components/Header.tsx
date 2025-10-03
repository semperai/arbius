// Server Component - imports client components for interactive parts
import Link from 'next/link';
import Image from 'next/image';
import { NetworkStatus } from '@/components/NetworkStatus';
import { HeaderSearch } from '@/components/HeaderSearch';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MobileMenu } from '@/components/MobileMenu';

import logoLight from '@/assets/logo-light.webp';
import logoDark from '@/assets/logo.webp';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src={logoDark}
            alt="Arbius"
            className="h-6 w-auto dark:hidden"
            height={24}
            priority
          />
          <Image
            src={logoLight}
            alt="Arbius"
            className="h-6 w-auto hidden dark:block"
            height={24}
            priority
          />
        </Link>

        {/* Search Bar - Client Component */}
        <HeaderSearch />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:gap-6">
          <NetworkStatus />
          <Link href="/tasks" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Tasks
          </Link>
          <Link href="/models" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Models
          </Link>
          <Link href="/validators" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Validators
          </Link>
          <ThemeToggle />
        </nav>

        {/* Mobile Menu */}
        <div className="flex items-center gap-2 md:hidden">
          <NetworkStatus />
          <ThemeToggle />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
