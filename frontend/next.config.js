/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    reactStrictMode: true,
    images: {
        domains: ['arxiv.org'],
    },
    webpack: (config, { isServer }) => {
        // Add optimizations if needed
        config.cache = false; // Disable webpack cache temporarily
        return config;
    },
}

module.exports = nextConfig;
