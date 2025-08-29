/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Enable for Cloudflare Pages deployment (disabled for dev API routes)
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  assetPrefix: '',
  env: {
    NEXT_PUBLIC_MAPBOX_TOKEN: 'pk.eyJ1Ijoic21uc2h6aCIsImEiOiJjbWU3YzlpZjEwMnV3MmlzaXFsMTU0ZTYxIn0.JoucB_gPN8eUkeVAv6pi8w'
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};
export default nextConfig;
