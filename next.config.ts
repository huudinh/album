// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   images: {
//     remotePatterns: [
//       {
//         protocol: "https",
//         hostname: "huudinh.io.vn",
//         pathname: "/app/album/**",
//       },
//       {
//         protocol: "https",
//         hostname: "upload.wikimedia.org",
//       },
//     ],
//   },
// };

// module.exports = nextConfig;


/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: "build",
  output: "export",
  // basePath: "/album",
  // assetPrefix: "/album",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "huudinh.io.vn",
        pathname: "/app/album/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
    ],
  },
};

export default nextConfig;
