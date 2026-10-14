#!/usr/bin/env bash
# Hotfix demonstration. Runs in a throwaway clone, so this repository's
# branches and tags do not change. Nothing is pushed.
#
#   bash exercises/hotfix/demo.sh
#
# Scenario:
#   - Production runs v1.0.0.
#   - main has newer work that cannot ship yet.
#   - A bug fix ships as v1.0.1, built from v1.0.0 plus the fix only.
#   - The fix then goes back into main.
set -euo pipefail

repo=$(git rev-parse --show-toplevel)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

run() {
  echo "\$ $*"
  "$@"
}

git clone -q "$repo" "$work/lab"
cd "$work/lab"
git config user.name "Hotfix Demo"
git config user.email "hotfix-demo@example.invalid"
git config advice.detachedHead false

echo "== 1. Production is v1.0.0"
run git tag -a v1.0.0 -m "Release v1.0.0"

echo
echo "== 2. main gets newer work that is not ready to ship"
sed -i.bak 's|<h2>What you get</h2>|<p>Coming soon: post tags (unfinished).</p>\n    <h2>What you get</h2>|' apps/marketing/index.html
rm apps/marketing/index.html.bak
run git commit -q -am "Add teaser for unfinished post tags feature"
unreleased=$(git rev-parse --short HEAD)

echo
echo "== 3. Create the hotfix branch from the production tag, not from main"
run git switch -q -c hotfix/v1.0.1 v1.0.0

echo
echo "== 4. Fix the bug and run the relevant checks"
run git apply "$repo/exercises/hotfix/fix-comment-whitespace.patch"
(
  cd apps/server
  echo "\$ bin/rails db:test:prepare"
  bin/rails db:test:prepare >/dev/null
  run bundle exec rspec spec/models/comment_spec.rb spec/requests/comments_spec.rb
)
run git commit -q -am "Strip whitespace around comment bodies"

echo
echo "== 5. Tag the corrected commit"
run git tag -a v1.0.1 -m "Release v1.0.1"
echo "In a real repository: git push origin hotfix/v1.0.1 v1.0.1"
echo "That push starts the normal Release workflow for v1.0.1. (Not run in this demo.)"

echo
echo "== 6. Bring the fix back into main"
run git switch -q main
run git merge -q --no-ff hotfix/v1.0.1 -m "Merge hotfix v1.0.1 into main"

echo
echo "== Result"
git log --graph --decorate-refs-exclude=refs/remotes --format='%h %s%d' main hotfix/v1.0.1 --not v1.0.0~1
echo
for tag in v1.0.0 v1.0.1; do
  echo "$tag identifies commit $(git rev-parse --short "$tag^{commit}"): $(git log -1 --format=%s "$tag")"
done
echo "main is at commit $(git rev-parse --short main): $(git log -1 --format=%s main)"
echo

if git merge-base --is-ancestor "$unreleased" v1.0.1; then
  echo "FAIL: v1.0.1 contains the unreleased main commit $unreleased"
  exit 1
fi
echo "OK: v1.0.1 does not contain the unreleased main commit $unreleased."
if git merge-base --is-ancestor v1.0.1 main; then
  echo "OK: main contains the v1.0.1 fix."
fi
echo "Files that differ between v1.0.0 and v1.0.1:"
git diff --stat v1.0.0 v1.0.1 | sed 's/^/  /'
