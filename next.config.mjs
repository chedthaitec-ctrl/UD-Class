/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "api.dicebear.com",
      "raw.githubusercontent.com",
      "images.unsplash.com",
      "profile.line-scdn.net"
    ],
  },
};

export default nextConfig;
