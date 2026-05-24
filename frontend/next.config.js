/** @type {import('next').NextConfig} */
const nextConfig = {
  // Output standalone menghasilkan bundle mandiri yang efisien untuk Docker
  output: 'standalone',
};

module.exports = nextConfig;
