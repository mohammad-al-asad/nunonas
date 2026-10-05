const nextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.figma.com",
        pathname: "/api/mcp/asset/**"
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "meetz-bucket.s3.eu-north-1.amazonaws.com",
        pathname: "/**"
      }
    ]
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = {
        type: "memory",
      };
    }
    return config;
  }
};

export default nextConfig;



