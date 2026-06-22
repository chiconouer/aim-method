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
      // Photos delivery subroutes moved from /upsell-1/* to /upsell-2/*
      // when the sales-page ownership of /upsell-1 changed (now $47 offer).
      // These redirects keep already-sent emails resolving correctly.
      // Each source has a subroute segment so /upsell-1 itself (the $47
      // sales page) is NOT caught — only nested paths.
      {
        source: '/upsell-1/preferences/:order_id',
        destination: '/upsell-2/preferences/:order_id',
        permanent: true,
      },
      {
        source: '/upsell-1/my-model',
        destination: '/upsell-2/my-model',
        permanent: true,
      },
      {
        source: '/upsell-1/my-model/:order_id',
        destination: '/upsell-2/my-model/:order_id',
        permanent: true,
      },
      {
        source: '/upsell-1/thank-you',
        destination: '/upsell-2/thank-you',
        permanent: true,
      },
      // 2026-06-22 — retired the middle $47/$27 upsell+downsell from the
      // organic Hotmart chain. The organic post-purchase flow is now:
      //   Hotmart $29 → /upsell-2 ($197) → /downsell-2 ($97) → dashboard.
      // /upsell-1 and /downsell-1 pages still exist on disk but had empty
      // CHECKOUT_URL constants (dead buttons); redirecting them into the
      // working chain so any old Hotmart thank-you setting, bookmarked
      // link, or in-flight email lands somewhere that converts instead
      // of a dead page. 307 (not permanent) so the strategic call is
      // reversible if we ever wire the $47/$27 offers back.
      // NOTE: these match EXACT `/upsell-1` and `/downsell-1` only — the
      // subroute redirects above (preferences, my-model, thank-you) keep
      // their own destinations because Next matches the full path.
      {
        source: '/upsell-1',
        destination: '/upsell-2',
        permanent: false,
      },
      {
        source: '/downsell-1',
        destination: '/upsell-2',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
