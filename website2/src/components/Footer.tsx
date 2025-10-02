export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-purple-text">Arbius</h3>
            <p className="text-sm text-footer-text">
              Decentralized machine learning network
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://docs.arbius.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-footer-text hover:text-purple-text transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/semperai/arbius"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-footer-text hover:text-purple-text transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Community</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://discord.gg/arbius"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-footer-text hover:text-purple-text transition-colors"
                >
                  Discord
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/arbius_ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-footer-text hover:text-purple-text transition-colors"
                >
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
          <p className="text-center text-sm text-copyright-text">
            © {new Date().getFullYear()} Arbius. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
