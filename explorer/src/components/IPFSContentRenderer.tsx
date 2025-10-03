import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircleIcon, FileIcon, ImageIcon, VideoIcon, FileTextIcon } from 'lucide-react';

interface IPFSContentRendererProps {
  cid: string;
  title?: string;
  className?: string;
  expectedType?: 'image' | 'video' | 'text' | 'json'; // Hint from model template
}

type ContentType = 'image' | 'video' | 'text' | 'json' | 'unknown';

interface ContentMetadata {
  type: ContentType;
  url: string;
  mimeType?: string;
}

const IPFS_GATEWAY = 'https://ipfs.arbius.org/ipfs';

export function IPFSContentRenderer({ cid, title = "Content", className = "", expectedType }: IPFSContentRendererProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ContentMetadata | null>(null);
  const [textContent, setTextContent] = useState<string>('');
  const [jsonContent, setJsonContent] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    async function loadContent() {
      if (!cid || cid.startsWith('ipfs://')) {
        setError('Invalid CID format');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Clean CID - remove ipfs:// prefix if present
        const cleanCid = cid.replace('ipfs://', '').trim();

        if (!cleanCid) {
          setError('Empty CID');
          setLoading(false);
          return;
        }

        const url = `${IPFS_GATEWAY}/${cleanCid}`;

        // Try to fetch and determine content type
        const response = await fetch(url, {
          method: 'HEAD',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch content: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || '';
        let type: ContentType = 'unknown';

        // Use expectedType from template if available
        if (expectedType) {
          type = expectedType;
        } else {
          // Auto-detect from content-type header
          if (contentType.startsWith('image/')) {
            type = 'image';
          } else if (contentType.startsWith('video/')) {
            type = 'video';
          } else if (contentType.includes('json')) {
            type = 'json';
          } else if (contentType.startsWith('text/') || contentType.includes('plain')) {
            type = 'text';
          }
        }

        setMetadata({
          type,
          url,
          mimeType: contentType
        });

        // For text and JSON, fetch the content
        if (type === 'text' || type === 'json') {
          const contentResponse = await fetch(url);
          const content = await contentResponse.text();

          if (type === 'json') {
            try {
              setJsonContent(JSON.parse(content));
            } catch {
              setTextContent(content);
              setMetadata(prev => prev ? { ...prev, type: 'text' } : null);
            }
          } else {
            setTextContent(content);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading IPFS content:', err);
        setError(err instanceof Error ? err.message : 'Failed to load content');
        setLoading(false);
      }
    }

    loadContent();
  }, [cid, expectedType]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircleIcon className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">CID: {cid}</p>
        </CardContent>
      </Card>
    );
  }

  if (!metadata) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {metadata.type === 'image' && <ImageIcon className="h-5 w-5" />}
            {metadata.type === 'video' && <VideoIcon className="h-5 w-5" />}
            {metadata.type === 'text' && <FileTextIcon className="h-5 w-5" />}
            {metadata.type === 'json' && <FileIcon className="h-5 w-5" />}
            {metadata.type === 'unknown' && <FileIcon className="h-5 w-5" />}
            {title}
          </CardTitle>
          <a
            href={metadata.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            View on IPFS ↗
          </a>
        </div>
        {metadata.mimeType && (
          <p className="text-xs text-muted-foreground">Type: {metadata.mimeType}</p>
        )}
      </CardHeader>
      <CardContent>
        {metadata.type === 'image' && (
          <div className="rounded-md overflow-hidden border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={metadata.url}
              alt="IPFS Content"
              className="w-full h-auto max-h-[600px] object-contain"
              loading="lazy"
            />
          </div>
        )}

        {metadata.type === 'video' && (
          <div className="rounded-md overflow-hidden border">
            <video
              controls
              className="w-full h-auto max-h-[600px]"
              preload="metadata"
            >
              <source src={metadata.url} type={metadata.mimeType} />
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {metadata.type === 'text' && (
          <div className="rounded-md border bg-muted/30 p-4">
            <pre className="text-sm whitespace-pre-wrap break-words font-mono max-h-[400px] overflow-auto">
              {textContent}
            </pre>
          </div>
        )}

        {metadata.type === 'json' && jsonContent && (
          <div className="rounded-md border bg-muted/30 p-4">
            <pre className="text-sm whitespace-pre-wrap break-words font-mono max-h-[400px] overflow-auto">
              {JSON.stringify(jsonContent, null, 2)}
            </pre>
          </div>
        )}

        {metadata.type === 'unknown' && (
          <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
            <FileIcon className="h-12 w-12 mb-2" />
            <p className="text-sm">Unsupported content type</p>
            <p className="text-xs mt-1">{metadata.mimeType || 'Unknown'}</p>
            <a
              href={metadata.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline mt-4"
            >
              Download File ↗
            </a>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4 truncate">
          CID: {cid}
        </p>
      </CardContent>
    </Card>
  );
}
