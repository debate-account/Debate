/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/chat': ['./debate-instructions.md', './knowledge/**/*'],
    },
  },
};
export default nextConfig;
