/** @type {import('next').NextConfig} */
const repo = "estatistica24_25_CPRaio";
const isProd = process.env.NODE_ENV === "production";
const basePath = isProd ? `/${repo}` : "";

const nextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath,
  assetPrefix: isProd ? `/${repo}/` : "",
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath
  }
};

module.exports = nextConfig;
