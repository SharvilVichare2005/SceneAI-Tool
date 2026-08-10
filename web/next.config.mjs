/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep the dev server's generated CSS separate from production builds.
  // This prevents `next build` from invalidating an already running `next dev` server.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
};

export default nextConfig;
