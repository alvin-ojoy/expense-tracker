/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Enable compression
  compress: true,
  
  // Optimize bundle size with tree-shaking
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts'],
  },
  
  // Production optimizations
  productionBrowserSourceMaps: false,
  
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    // Optimize bundle splitting
    config.optimization.splitChunks = {
      ...config.optimization.splitChunks,
      cacheGroups: {
        ...config.optimization.splitChunks?.cacheGroups,
        recharts: {
          name: 'recharts',
          test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
          chunks: 'all',
          priority: 20,
        },
        datefns: {
          name: 'date-fns',
          test: /[\\/]node_modules[\\/]date-fns[\\/]/,
          chunks: 'all',
          priority: 10,
        },
      },
    };
    
    return config;
  },
};

export default nextConfig;
