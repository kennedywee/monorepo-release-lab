// The store version comes from the release tag (see app.config.ts). Without this skip,
// every new tag would change the runtime version, and a JavaScript-only hotfix such as
// v1.0.1 could not reach v1.0.0 binaries through EAS Update.
// The default skip is kept so package.json scripts do not affect the fingerprint.
/** @type {import('expo/fingerprint').Config} */
module.exports = {
  sourceSkips: ["ExpoConfigVersions", "PackageJsonAndroidAndIosScriptsIfNotContainRun"],
};
