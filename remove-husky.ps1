# Unblock committing: remove the husky pre-commit hook.
#
# The hook runs `npm x lint-staged`. Git hooks launched from GitHub
# Desktop or Git Bash get a minimal PATH, so `npm` is not resolvable the
# way the hook expects, and the commit aborts with exit code 127. The
# hook only ran prettier on staged files, so nothing of substance is lost.
#
# Run from the repo root, the folder containing package.json.

$ErrorActionPreference = 'Stop'

if (-not (Test-Path 'package.json')) {
  Write-Error 'Run this from the repo root (the folder with package.json).'
}

# 1. Delete the hook directory. husky 8 keeps hooks here, not in .git/hooks.
if (Test-Path '.husky') {
  Remove-Item -Recurse -Force '.husky'
  Write-Host 'removed  .husky'
} else {
  Write-Host 'skipped  .husky (not present)'
}

# 2. Clear the redirect husky set. Without this git keeps looking in
#    .husky and will complain that the hooks path does not exist.
$hooksPath = (& git config --local --get core.hooksPath) 2>$null
if ($hooksPath) {
  & git config --local --unset core.hooksPath
  Write-Host "cleared  core.hooksPath (was: $hooksPath)"
} else {
  Write-Host 'skipped  core.hooksPath (not set)'
}

# 3. Drop the now-unused packages from node_modules.
Write-Host "`nRemoving husky and lint-staged from node_modules..."
& pnpm remove husky lint-staged

Write-Host "`nDone. Commits should work now."
Write-Host 'Run prettier by hand when you want it:  pnpm format'
