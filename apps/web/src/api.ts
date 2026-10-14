import { createApi } from "@release-lab/api";

declare global {
  interface Window {
    APP_CONFIG?: { apiUrl?: string };
  }
}

export const api = createApi(window.APP_CONFIG?.apiUrl ?? "http://localhost:3000");
