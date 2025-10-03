'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HomeIcon, ArrowLeftIcon, SearchIcon, FileTextIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center px-4 py-12">
      <div className="max-w-2xl w-full space-y-8">
        <div className="space-y-4">
          <h1 className="text-8xl font-bold text-primary/20">404</h1>
          <h2 className="text-3xl font-semibold">Page not found</h2>
          <p className="text-muted-foreground text-lg">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/" className="p-4 border rounded-md hover:bg-accent transition-colors flex flex-col items-center gap-2">
                <HomeIcon className="h-6 w-6 text-primary" />
                <span className="font-medium">Home</span>
                <span className="text-xs text-muted-foreground">Explore dashboard</span>
              </Link>
              <Link href="/tasks" className="p-4 border rounded-md hover:bg-accent transition-colors flex flex-col items-center gap-2">
                <SearchIcon className="h-6 w-6 text-primary" />
                <span className="font-medium">Tasks</span>
                <span className="text-xs text-muted-foreground">Search tasks</span>
              </Link>
              <Link href="/models" className="p-4 border rounded-md hover:bg-accent transition-colors flex flex-col items-center gap-2">
                <FileTextIcon className="h-6 w-6 text-primary" />
                <span className="font-medium">Models</span>
                <span className="text-xs text-muted-foreground">Browse models</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" /> Go Back
          </Button>
          <Link href="/">
            <Button className="gap-2 w-full sm:w-auto">
              <HomeIcon className="h-4 w-4" /> Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
