import type { ExpoConfig } from "expo/config";

// The repository tag (v1.2.3 or v1.2.3-rc.1) sets the store-visible version "1.2.3".
// App stores also need a build number (iOS buildNumber, Android versionCode).
// EAS manages build numbers remotely (see eas.json). A build number is not a release tag.
const releaseTag = process.env.RELEASE_TAG ?? "v0.0.0";
const version = releaseTag.replace(/^v/, "").split("-")[0];

// Set EAS_PROJECT_ID after running `eas init`. Without it, EAS Update is not configured
// and builds run only the JavaScript bundled inside the binary.
const projectId = process.env.EAS_PROJECT_ID;

const config: ExpoConfig = {
  name: "Release Lab",
  slug: "release-lab",
  scheme: "releaselab",
  version,
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "example.releaselab.mobile",
  },
  android: {
    package: "example.releaselab.mobile",
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: ["expo-router"],
  // The fingerprint changes when native code or native config changes.
  // An EAS Update reaches only builds with the same runtime version, so a
  // JavaScript-only change can ship as an update, and a native change needs a new binary.
  runtimeVersion: { policy: "fingerprint" },
  ...(projectId
    ? {
        updates: { url: `https://u.expo.dev/${projectId}` },
        extra: { eas: { projectId } },
      }
    : {}),
};

export default config;
