'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center px-4 py-12">
          <div className="max-w-2xl w-full space-y-8">
            <div className="space-y-4">
              <h1 className="text-8xl font-bold text-destructive/20">Error</h1>
              <h2 className="text-3xl font-semibold">Something went wrong!</h2>
              <p className="text-muted-foreground text-lg">
                An unexpected error occurred. Our team has been notified.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => reset()}>Try again</button>
              <button onClick={() => (window.location.href = '/')}>Return Home</button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
