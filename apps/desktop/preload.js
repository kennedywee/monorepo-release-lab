// Sets the API URL before the web renderer's config.js runs.
// Change it at runtime with the API_URL environment variable, so one desktop
// package can point at a candidate or production API without a rebuild.
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("APP_CONFIG", {
  apiUrl: process.env.API_URL || "http://localhost:3000",
});
