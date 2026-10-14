#!/usr/bin/env bash
# Runs the contract-break exercise from a clean checkout and restores the files afterward.
# Each step prints PASS or FAIL and whether that result was the expected one.
#
#   bash exercises/contract-break/run.sh
#
# Requires: bun install and bundle install already done. Docker is needed for step 5 only.
set -uo pipefail

cd "$(git rev-parse --show-toplevel)"
here=exercises/contract-break
oasdiff_image=tufin/oasdiff:v1.33.0

if ! git diff --quiet HEAD -- apps packages; then
  echo "apps/ or packages/ has uncommitted changes. Commit or stash them first." >&2
  exit 1
fi

restore() {
  git checkout -- apps packages
  rm -f /tmp/release-lab-stable-openapi.yaml
}
trap restore EXIT

unexpected=0

# check <expected: pass|fail> <label> <command...>
check() {
  local expected=$1 label=$2
  shift 2
  if "$@" >/tmp/release-lab-exercise.log 2>&1; then actual=pass; else actual=fail; fi
  if [ "$actual" = "$expected" ]; then verdict="as expected"; else verdict="UNEXPECTED"; unexpected=1; fi
  printf '  %-4s %-48s (%s)\n' "$(echo "$actual" | tr a-z A-Z)" "$label" "$verdict"
  if [ "$actual" = fail ]; then
    grep -E "missing required|error TS|error\s+\[" /tmp/release-lab-exercise.log | sed 's/^\s*/         /' | sort -u | head -4
  fi
}

rails_contract() { (cd apps/server && bundle exec rspec spec/requests); }
typecheck() { bun run --cwd "apps/$1" typecheck; }

echo "Step 0. Baseline on main"
check pass "Rails contract specs" rails_contract
check pass "mobile typecheck" typecheck mobile

echo "Step 1-2. Rails stops sending title; the contract still requires it"
git apply "$here/01-response-drops-title.patch"
check fail "Rails contract specs" rails_contract

echo "Step 3. Remove title from the contract and regenerate types"
git apply "$here/02-contract-drops-title.patch"
bun run contract:types >/dev/null 2>&1
check pass "Rails contract specs" rails_contract
check fail "mobile typecheck" typecheck mobile
check fail "web typecheck (desktop renderer)" typecheck web
check fail "store typecheck" typecheck store

echo "Step 4. Fix the mobile consumer"
git apply "$here/03-fix-mobile.patch"
check pass "mobile typecheck" typecheck mobile
echo "  Web and store read title too. CI checks every consumer, so fix them as well:"
git apply "$here/04-fix-web-and-store.patch"
check pass "web typecheck (desktop renderer)" typecheck web
check pass "store typecheck" typecheck store

echo "Step 5. Compare the proposed contract with the last stable contract"
# In CI the base is the contract at the last stable tag: git show v1.0.0:apps/server/openapi.yaml
# Here the base is the committed contract (HEAD), which stands in for the last stable release.
git show HEAD:apps/server/openapi.yaml >/tmp/release-lab-stable-openapi.yaml
oasdiff_breaking() {
  docker run --rm \
    -v /tmp/release-lab-stable-openapi.yaml:/stable.yaml:ro \
    -v "$PWD/apps/server/openapi.yaml:/proposed.yaml:ro" \
    "$oasdiff_image" breaking /stable.yaml /proposed.yaml --fail-on ERR
}
if command -v docker >/dev/null 2>&1; then
  check fail "oasdiff breaking-change check" oasdiff_breaking
else
  echo "  SKIP oasdiff breaking-change check (Docker is not installed)"
fi

echo
if [ "$unexpected" = 0 ]; then
  echo "Every step behaved as expected. Restoring the original files."
else
  echo "At least one step was UNEXPECTED. See the output above." >&2
fi
exit "$unexpected"
