import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Writing entries are .mdx files imported by the /writing routes
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // Dev only: let phones/tablets on the same Wi-Fi load the dev server by IP
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
  // The Design page is the home page now; projects still live at /design/[slug]
  async redirects() {
    return [{ source: "/design", destination: "/", permanent: false }];
  },
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
