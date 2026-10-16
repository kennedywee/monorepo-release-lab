// Sets the API URL before the bundled web renderer's config.js runs.
// Change it at runtime with the API_URL environment variable, so one desktop
// package can point at a candidate or production API without a rebuild.
// When the window loads the hosted web app, this sets nothing: the hosted
// config.js already has the right API URL.
const { contextBridge } = require("electron");

if (process.argv.includes("--release-lab-bundled")) {
  contextBridge.exposeInMainWorld("APP_CONFIG", {
    apiUrl: process.env.API_URL || "http://localhost:3000",
  });
}
