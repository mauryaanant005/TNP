import path from "path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";

export default ({ mode }: any) => {
  const env = loadEnv(mode, process.cwd());
  const API_URL = `${env.VITE_SERVER_URL ?? "http://localhost:8000"}`;

  return defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: API_URL,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: "build",
      assetsDir: "static",
    },
  });
};
