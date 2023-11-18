/** @type {import('next').NextConfig} */

const urlPrefix = process.env.BRANCH_NAME ? '/' + process.env.BRANCH_NAME : ''

const nextConfig = {
  output: 'export',
  assetPrefix: urlPrefix,
  basePath: urlPrefix,
  trailingSlash: true,
}

module.exports = nextConfig
