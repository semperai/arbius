import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CircleIcon } from 'lucide-react';

export function NetworkStatus() {
  const networkName = process.env.NEXT_PUBLIC_NETWORK_NAME || 'Arbitrum One';
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || '42161';
  const blockExplorer = process.env.NEXT_PUBLIC_BLOCK_EXPLORER || 'https://arbiscan.io';

  const isMainnet = chainId === '42161';
  const isTestnet = chainId === '421614';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={isMainnet ? "default" : "outline"}
            className="gap-1.5 cursor-help"
          >
            <CircleIcon
              className={`h-2 w-2 fill-current ${
                isMainnet ? 'text-green-500' :
                isTestnet ? 'text-yellow-500' :
                'text-gray-500'
              }`}
            />
            <span className="hidden sm:inline">{networkName}</span>
            <span className="sm:hidden">
              {isMainnet ? 'Mainnet' : isTestnet ? 'Testnet' : 'Network'}
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <div className="font-semibold">{networkName}</div>
            <div className="text-muted-foreground">Chain ID: {chainId}</div>
            <a
              href={blockExplorer}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline block"
            >
              View on Explorer ↗
            </a>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
