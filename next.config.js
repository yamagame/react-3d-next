const urlPrefix = process.env.BRANCH_NAME ? '/' + process.env.BRANCH_NAME : ''

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  assetPrefix: urlPrefix,
  basePath: urlPrefix,
  trailingSlash: true,
  distDir: 'out' + urlPrefix,
}

module.exports = nextConfig
