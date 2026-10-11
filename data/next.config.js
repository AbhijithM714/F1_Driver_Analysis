const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },
  images: {
    domains: ["media.formula1.com", "raw.githubusercontent.com", "assets.formula1.com"],
  },
};

module.exports = nextConfig;
