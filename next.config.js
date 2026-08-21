/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/admin',
        permanent: false,
        has: [{ type: 'host', value: 'admin.revoworldtech.uk' }],
      },
    ]
  },
}
module.exports = nextConfig