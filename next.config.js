/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_AUTH_USER: process.env.NEXT_PUBLIC_AUTH_USER,
    NEXT_PUBLIC_AUTH_PASS: process.env.NEXT_PUBLIC_AUTH_PASS,
  },
};

module.exports = nextConfig;