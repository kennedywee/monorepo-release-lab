import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" makes the build work from any path, including Electron's file:// URL.
// The desktop app packages this same build instead of copying the screens.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
