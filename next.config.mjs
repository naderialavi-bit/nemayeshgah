const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] || "";
const isProjectPage = Boolean(process.env.GITHUB_ACTIONS) && repoName && !repoName.endsWith(".github.io");
const basePath = isProjectPage ? `/${repoName}` : "";

const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "drive.google.com" },
    ],
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
