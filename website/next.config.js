/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    domains: [
      'ipfs.arbius.org',
      'gateway.pinata.cloud',
      'gray-electric-panther-526.mypinata.cloud',
    ],
  },
}

module.exports = nextConfig
