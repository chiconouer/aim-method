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
      // 2026-06 funnel rename — /weekly pages moved to their versioned
      // slots so the funnel reads as Upsell 1/Downsell 1 ($47/$27) and
      // Upsell 2/Downsell 2 ($197/$97). Old paths kept as 301s so any
      // links still in Hotmart panels / emails / ads keep working.
      {
        source: '/weekly',
        destination: '/upsell-1',
        permanent: true,
      },
      {
        source: '/weekly/downsell',
        destination: '/downsell-1',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
