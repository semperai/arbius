import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function CopyButton({
  text,
  label = 'Copy',
  className = '',
  variant = 'ghost',
  size = 'icon'
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy');
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleCopy}
            className={className}
            aria-label={copied ? 'Copied!' : label}
          >
            {copied ? (
              <CheckIcon className="h-4 w-4 text-green-500" />
            ) : (
              <CopyIcon className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{copied ? 'Copied!' : label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Variant that shows text with copy button inline
interface CopyTextProps {
  text: string;
  displayText?: string;
  className?: string;
}

export function CopyText({ text, displayText, className = '' }: CopyTextProps) {
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <code className="text-sm bg-muted/40 rounded px-2 py-0.5 font-mono">
        {displayText || text}
      </code>
      <CopyButton text={text} size="icon" variant="ghost" />
    </div>
  );
}
