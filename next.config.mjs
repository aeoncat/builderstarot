/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

// Any host that isn't the canonical domain (e.g. the *.vercel.app deployment
// URL) is permanently redirected here so sessions aren't fragmented across
// domains. Update if the canonical domain ever changes.
const CANONICAL_HOST = "www.builderstarot.com";

const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    // Only enforce the canonical host in production so preview deployments
    // (builderstarot-git-*.vercel.app) stay directly viewable.
    if (process.env.VERCEL_ENV !== "production") {
      return [];
    }
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: ".*\\.vercel\\.app",
          },
        ],
        destination: `https://${CANONICAL_HOST}/:path*`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
