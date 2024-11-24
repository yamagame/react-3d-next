const urlPrefix = process.env.BRANCH_NAME ? '/' + process.env.BRANCH_NAME : '/about/profile/access/map'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  assetPrefix: urlPrefix,
  basePath: urlPrefix,
  trailingSlash: true,
  distDir: 'out' + urlPrefix,
}

module.exports = nextConfig
