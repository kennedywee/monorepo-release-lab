import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The public blog uses real URLs such as /posts/1, so the host must serve
// index.html for unknown paths (a single-page-app fallback).
export default defineConfig({
  base: "/",
  plugins: [react()],
});
