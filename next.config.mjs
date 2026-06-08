import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root to this project (avoids picking up a stray
  // lockfile elsewhere on the machine).
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
