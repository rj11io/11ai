import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The plugin pages lived at /groups/[slug] before the concept was
      // relabeled from "skill groups" to "plugins". Keep old links working.
      {
        source: "/groups",
        destination: "/plugins",
        permanent: true,
      },
      {
        source: "/groups/:slug",
        destination: "/plugins/:slug",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
