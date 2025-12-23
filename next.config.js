/** @type {import('next').NextConfig} */
const repo = "estatistica24_25_CPRaio";

const nextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath: `/${repo}`,
  assetPrefix: `/${repo}/`
};

module.exports = nextConfig;
