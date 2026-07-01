/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: {
    outputFileTracingIncludes: {
      '/api/chat': ['./debate-instructions.md', './knowledge/**/*'],
    },
  },
};
export default nextConfig;
