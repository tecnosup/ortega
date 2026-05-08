import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin"],
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
};

export default withPWA({
  dest: "public",
  register: true,
  workboxOptions: {
    skipWaiting: true,
    runtimeCaching: [],
  },
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
