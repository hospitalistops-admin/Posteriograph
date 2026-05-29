/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiConnectSrc =
  process.env.VITE_API_BASE_URL?.trim().replace(/\/$/, "") || "http://127.0.0.1:8787";

export default defineConfig({
  base: "/Posteriograph/",
  plugins: [
    react(),
    {
      name: "inject-csp-connect-src",
      transformIndexHtml(html) {
        return html.replace("__CSP_CONNECT_SRC__", apiConnectSrc);
      }
    }
  ],
  test: {
    environment: "node",
    globals: true
  }
});
