/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/webp", "image/avif"],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/sales',
        permanent: false,
        has: [
          {
            type: 'host',
            value: 'aimodelmethods.com',
          },
        ],
      },
      {
        source: '/',
        destination: '/sales',
        permanent: false,
        has: [
          {
            type: 'host',
            value: 'www.aimodelmethods.com',
          },
        ],
      },
      // Legacy upsell URLs renamed to versioned paths. Query strings are
      // preserved by Next.js by default, so PerfectPay / ad-tracking params
      // ride through the redirect.
      {
        source: '/upsell',
        destination: '/upsell-1',
        permanent: true,
      },
      {
        source: '/upsell/downsell',
        destination: '/downsell-1',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
