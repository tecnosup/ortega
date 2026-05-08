import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin"],
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  // não cacheia rotas dinâmicas do admin — dados sempre frescos
  runtimeCaching: [],
  buildExcludes: [/middleware-manifest\.json$/],
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
