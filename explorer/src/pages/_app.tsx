import type { AppProps } from 'next/app';
import Head from 'next/head';
import Link from 'next/link';
import '@/styles/globals.css';

import { ThemeProvider } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Search as SearchIcon, Menu as MenuIcon, MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';

function Header() {
  const { setTheme, theme } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className='relative bg-background border-b z-50 block w-full mx-4 top-auto p-0 border-0'>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tasks, models, validators..."
              className="w-full pl-8"
            />
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:gap-6">
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
        <div className="flex items-center md:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="mr-2"
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
  return (
    <footer className="border-t py-8 bg-background">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <div className="text-muted-foreground">
          © {new Date().getFullYear()} Arbius Explorer
        </div>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            Documentation
          </Link>
          <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            GitHub
          </Link>
          <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            Community
          </Link>
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
