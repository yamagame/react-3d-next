const githubAction = process.env.GITHUB_ACTION
const urlPrefix = process.env.BRANCH_NAME ? '/' + process.env.BRANCH_NAME : ''

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  assetPrefix: urlPrefix,
  basePath: urlPrefix,
  trailingSlash: true,
  distDir: githubAction ? 'out' : 'out' + urlPrefix,
}

module.exports = nextConfig
