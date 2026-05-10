/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    return {
      beforeFiles: [
        {
          source: "/api/:path*/",
          destination: `${apiUrl}/api/:path*/`,
        },
        {
          source: "/api/:path*",
          destination: `${apiUrl}/api/:path*/`,
        },
      ],
    };
  },
}

export default nextConfig
