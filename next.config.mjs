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
    ];
  },
};

export default nextConfig;
