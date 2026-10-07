import { withPayload } from '@payloadcms/next/withPayload'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js config here
  allowedDevOrigins: [
    'http://172.18.25.87:3015',
    'http://172.18.25.87:3005',
    'http://172.18.25.87:3030',
    'http://172.18.25.87:5432',
  ],
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  basePath,
  // docusign-esign's entry file is a UMD wrapper whose AMD branch lists bare
  // module names ('ApiClient', './model/...', etc.) - webpack's static analysis
  // tries to resolve those even though that branch never executes under Node.
  // Keeping it external avoids bundling it at all (both the Server Actions
  // bundle and dev's route bundles), which is the standard fix for this class
  // of legacy-CJS/UMD SDK under webpack.
  serverExternalPackages: ['docusign-esign'],
  experimental: { serverActions: { bodySizeLimit: '50mb' }, serverMinification: false },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '172.18.25.87',
      },
      { protocol: 'http', hostname: 'public.dohaoasis.com' },
      { protocol: 'https', hostname: 'public.dohaoasis.com' },
    ],
  },
  async redirects() {
    // In production, these redirects are handled by nginx
    if (process.env.NODE_ENV === 'production') return []
    return [
      {
        source: '/api/:path*',
        destination: `${basePath}/api/:path*`,
        permanent: false,
        basePath: false,
      },
      {
        source: '/admin/:path*',
        destination: `${basePath}/admin/:path*`,
        permanent: false,
        basePath: false,
      },
      {
        source: '/graphql/:path*',
        destination: `${basePath}/graphql/:path*`,
        permanent: false,
        basePath: false,
      },
      {
        source: '/graphql-playground/:path*',
        destination: `${basePath}/graphql-playground/:path*`,
        permanent: false,
        basePath: false,
      },
    ]
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
