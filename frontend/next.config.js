/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    reactStrictMode: true,
    experimental: {
        serverActions: {
            allowedOrigins: ['localhost:3000'],
        },
    },
    webpack: (config, { isServer }) => {
        // Add optimizations if needed
        config.cache = false; // Disable webpack cache temporarily
        return config;
    },
}

module.exports = nextConfig;
