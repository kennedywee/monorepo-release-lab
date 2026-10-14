// Builds release-manifest.json and release-notes.md from the status files that
// each release build job uploads. Used by .github/workflows/release.yml.
//
//   RELEASE_TAG=v1.0.0 RELEASE_SHA=<sha> bun scripts/release-manifest.ts <status-dir> <out-dir>
//
// Optional environment: PREVIOUS_TAG, CHANGES_FILE (output of git log), NEEDS_JSON (toJSON(needs)).
// Exits with code 1 if any expected build did not succeed. The files are still written.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Publication = {
  // "started" means an external build (for example EAS) was requested but has not finished here.
  status: "published" | "started" | "not-configured" | "not-applicable" | "failed";
  detail: string;
};
type Status = {
  app: string;
  job?: string;
  build?: "success" | "failed" | "missing";
  artifacts?: { file: string; sha256: string }[];
  platformVersion?: string;
  publication?: Publication;
};

// One entry per releasable unit. Desktop builds once per operating system.
const expected: Record<string, string> = {
  server: "build-server",
  web: "build-web",
  store: "build-web",
  marketing: "build-web",
  docs: "build-web",
  support: "build-web",
  "desktop-linux": "build-desktop",
  "desktop-macos": "build-desktop",
  "desktop-windows": "build-desktop",
  mobile: "build-mobile",
};

const [statusDir = "release-out/status", outDir = "release-out"] = process.argv.slice(2);
const tag = required("RELEASE_TAG");
const sha = required("RELEASE_SHA");
const channel = /-rc\.\d+$/.test(tag) ? "candidate" : "stable";
const needs: Record<string, { result: string }> = JSON.parse(process.env.NEEDS_JSON ?? "{}");

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const byApp = new Map<string, Status>();
for (const file of safeReadDir(statusDir).filter((name) => name.endsWith(".json"))) {
  const status: Status = JSON.parse(readFileSync(join(statusDir, file), "utf8"));
  byApp.set(status.app, { ...byApp.get(status.app), ...status });
}

const apps = Object.entries(expected).map(([app, job]): Status => {
  const status = byApp.get(app);
  if (status?.build) return status;
  const result = needs[job]?.result ?? "unknown";
  return {
    app,
    job,
    build: "missing",
    artifacts: [],
    publication: { status: "failed", detail: `No status file. Job ${job} result: ${result}.` },
  };
});

const allBuilt = apps.every((app) => app.build === "success");
const manifest = {
  tag,
  commit: sha,
  channel,
  createdAt: new Date().toISOString(),
  allBuildsSucceeded: allBuilt,
  apps,
};

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "release-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

const changes = process.env.CHANGES_FILE ? readFileSync(process.env.CHANGES_FILE, "utf8").trim() : "";
const notes = [
  `# ${tag}`,
  "",
  channel === "candidate"
    ? "**Release candidate.** For testing only. Not published to production channels."
    : "**Stable release.** Approved for production. Deployment is a separate, approved step.",
  "",
  `- Git tag: \`${tag}\``,
  `- Source commit: \`${sha}\``,
  "- Every artifact below was built from this one commit.",
  "",
  `## Changes since ${process.env.PREVIOUS_TAG || "the beginning"}`,
  "",
  changes || "_No commit list available._",
  "",
  "## Artifacts and status",
  "",
  "| App | Build | Artifacts | Platform version | Publication |",
  "| --- | --- | --- | --- | --- |",
  ...apps.map((app) =>
    [
      app.app,
      app.build,
      (app.artifacts ?? []).map((artifact) => `\`${artifact.file}\``).join("<br>") || "none",
      app.platformVersion ?? "",
      `${app.publication?.status ?? "unknown"}: ${app.publication?.detail ?? ""}`,
    ]
      .join(" | ")
      .replace(/^/, "| ")
      .concat(" |"),
  ),
  "",
  "## Not done by this workflow",
  "",
  "- Production deployment. Run the Deploy workflow and pass the production approval gate.",
  "- App store submission and release to users. Run the Mobile workflow, then release in the store consoles.",
  "- Desktop code signing and notarization. The packages are unsigned until signing credentials exist.",
  "",
  "SHA-256 checksums for every artifact are in `release-manifest.json`.",
  "",
].join("\n");
writeFileSync(join(outDir, "release-notes.md"), notes);

console.log(`Wrote ${outDir}/release-manifest.json and ${outDir}/release-notes.md`);
for (const app of apps) console.log(`  ${app.app.padEnd(16)} build=${app.build} publication=${app.publication?.status}`);
if (!allBuilt) {
  console.error("At least one build did not succeed. Do not publish this release.");
  process.exit(1);
}

function safeReadDir(dir: string): string[] {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}
