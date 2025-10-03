// Server Component - no 'use client' needed
export function Footer() {
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
                href="https://t.me/arbius_ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Telegram
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
