// Runtime configuration. The deploy step replaces this file for each environment,
// so the same built JavaScript runs in preview, candidate, and production.
// The desktop app sets window.APP_CONFIG before this file runs, so keep the "||".
window.APP_CONFIG = window.APP_CONFIG || { apiUrl: "http://localhost:3000" };
