import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths - required for the built app to load correctly
  // over file:// inside the Electron shell (an absolute "/" base only
  // resolves under an http(s) origin, not file://).
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  server: {
    port: 5173
  }
});
