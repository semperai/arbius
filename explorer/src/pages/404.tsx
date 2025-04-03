import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { HomeIcon, ArrowLeftIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Set displayName so our _app.tsx can identify this component as a 404 page
const NotFoundPage = () => {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Page Not Found | Arbius Explorer</title>
        <meta name="description" content="The page you're looking for cannot be found." />
      </Head>

      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center px-4">
        <div className="max-w-md space-y-6">
          <div className="space-y-2">
            <h1 className="text-7xl font-bold">404</h1>
            <h2 className="text-2xl font-semibold">Page not found</h2>
            <p className="text-muted-foreground">
              The resource you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeftIcon className="h-4 w-4" /> Go Back
            </Button>
            <Link href="/" passHref>
              <Button className="gap-2">
                <HomeIcon className="h-4 w-4" /> Return Home
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-16 text-sm text-muted-foreground">
          <p className="max-w-md">
            If you think this is an error, please contact the site administrator.
          </p>
        </div>
      </div>
    </>
  );
};

// Set displayName explicitly for our layout check in _app.tsx
NotFoundPage.displayName = 'NotFound';

export default NotFoundPage;
