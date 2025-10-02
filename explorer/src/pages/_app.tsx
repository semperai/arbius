import type { AppProps } from 'next/app';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState, FormEvent } from 'react';
import '@/styles/globals.css';

import { ThemeProvider } from '@/components/theme-provider';
import { NetworkStatus } from '@/components/NetworkStatus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Search as SearchIcon, Menu as MenuIcon, MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Toaster } from 'sonner';

import logoLight from '@/assets/logo-light.webp';
import logoDark from '@/assets/logo.webp';

function Header() {
  const { setTheme, theme } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();

    if (!query) return;

    // Check if it's a hex string starting with 0x
    if (query.startsWith('0x')) {
      // If it's 42 chars (0x + 40 hex), it's likely an address
      if (query.length === 42) {
        router.push(`/address/${query}`);
      }
      // If it's 66 chars (0x + 64 hex), it could be a task ID or model hash
      // We'll try task first, the page will handle if it doesn't exist
      else if (query.length === 66) {
        router.push(`/task/${query}`);
      }
      // For other lengths, try as task ID
      else {
        router.push(`/task/${query}`);
      }

      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <Image
            src={logoDark}
            alt="Arbius"
            className="h-8 w-auto dark:hidden"
            height={32}
            priority
          />
          <Image
            src={logoLight}
            alt="Arbius"
            className="h-8 w-auto hidden dark:block"
            height={32}
            priority
          />
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className='relative flex-1 max-w-md'>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by address, task ID, or model hash..."
              className="w-full pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

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
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <SunIcon className="h-5 w-5 rotate-0 scale-100 transition-all dark:rotate-90 dark:scale-0" />
            <MoonIcon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </nav>

        {/* Mobile Menu */}
        <div className="flex items-center gap-2 md:hidden">
          <NetworkStatus />

          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <SunIcon className="h-5 w-5 rotate-0 scale-100 transition-all dark:rotate-90 dark:scale-0" />
            <MoonIcon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <MenuIcon className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background border-l">
              <nav className="flex flex-col gap-8 mt-8 ml-4">
                <Link href="/tasks" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  Tasks
                </Link>
                <Link href="/models" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  Models
                </Link>
                <Link href="/validators" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  Validators
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const contractAddress = process.env.NEXT_PUBLIC_ENGINE_ADDRESS || "0x9b51Ef044d3486A1fB0A2D55A6e0CeeAdd323E66";
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || "42161";
  const explorerUrl = chainId === "42161" ? "https://arbiscan.io" : "https://sepolia.arbiscan.io";

  return (
    <footer className="border-t py-8 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* About */}
          <div>
            <h3 className="font-semibold mb-3">Arbius Explorer</h3>
            <p className="text-sm text-muted-foreground">
              Explore the decentralized AI network on Arbitrum. View tasks, models, and validators in real-time.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-3">Resources</h3>
            <div className="flex flex-col space-y-2">
              <a
                href="https://arbius.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Official Website
              </a>
              <a
                href="https://docs.arbius.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Documentation
              </a>
              <a
                href="https://github.com/semperai/arbius"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>

          {/* Community */}
          <div>
            <h3 className="font-semibold mb-3">Community</h3>
            <div className="flex flex-col space-y-2">
              <a
                href="https://discord.gg/arbius"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Discord
              </a>
              <a
                href="https://twitter.com/arbius_ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Twitter
              </a>
              <a
                href={`${explorerUrl}/address/${contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                View Contract
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Arbius Explorer. Built for the Arbius community.
        </div>
      </div>
    </footer>
  );
}

// Layout wrapper
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  // Special pages that don't need the full layout (like 404)
  const is404Page = Component.displayName === 'NotFound';

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Toaster position="bottom-right" richColors />

      {is404Page ? (
        <Component {...pageProps} />
      ) : (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      )}
    </ThemeProvider>
  );
}
