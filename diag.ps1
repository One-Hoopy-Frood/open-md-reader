# Run from the repo root:
#   powershell -ExecutionPolicy Bypass -File .\diag.ps1
#
# Writes an auto-numbered log to your Downloads folder, so each run makes
# a new file instead of overwriting the last one. Upload the newest.

$ErrorActionPreference = 'Continue'

if (-not (Test-Path 'package.json')) {
  Write-Host 'Run this from the repo root (the folder with package.json).' -ForegroundColor Red
  exit 1
}

# Find the next free number so runs never clobber each other.
$dl = Join-Path $env:USERPROFILE 'Downloads'
$n = 1
while (Test-Path (Join-Path $dl ("omr-diag-{0:d3}.txt" -f $n))) { $n++ }
$log = Join-Path $dl ("omr-diag-{0:d3}.txt" -f $n)

function Section($title) {
  "`n$('=' * 70)`n== $title`n$('=' * 70)" | Out-File $log -Append -Encoding utf8
}

function Run($title, $cmd) {
  Section $title
  "`$ $cmd" | Out-File $log -Append -Encoding utf8
  try {
    Invoke-Expression $cmd 2>&1 | Out-String -Width 200 | Out-File $log -Append -Encoding utf8
  } catch {
    "EXCEPTION: $_" | Out-File $log -Append -Encoding utf8
  }
}

function Show($title, $path) {
  Section $title
  if (Test-Path $path) {
    Get-Content $path -Raw | Out-File $log -Append -Encoding utf8
  } else {
    "NOT FOUND: $path" | Out-File $log -Append -Encoding utf8
  }
}

"open-md-reader diagnostic, run $n" | Out-File $log -Encoding utf8
"generated $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" | Out-File $log -Append -Encoding utf8

# ---- environment -----------------------------------------------------
Run 'node version'    'node -v'
Run 'pnpm version'    'pnpm -v'
Run 'git branch'      'git branch --show-current'
Run 'git status'      'git status --short'

# ---- what is installed ----------------------------------------------
Run 'installed versions' 'pnpm ls --depth 0'
Run 'peer dependency issues' 'pnpm peers check'

# ---- SMUI package layout (needed to pick the right CSS import) ------
Run 'svelte-material-ui root'   'Get-ChildItem node_modules\svelte-material-ui -Name'
Run 'svelte-material-ui themes' 'Get-ChildItem node_modules\svelte-material-ui\themes -Name -ErrorAction SilentlyContinue'
Run 'smui exports field'        'Get-Content node_modules\svelte-material-ui\package.json -Raw'
Run 'one component exports'     'Get-Content node_modules\@smui\switch\package.json -Raw'

# ---- current state of the files we are editing ----------------------
Show 'tsconfig.json'                'tsconfig.json'
Show 'build/webpack.common.js'      'build\webpack.common.js'
Show 'src/popup/index.ts'           'src\popup\index.ts'
Show 'src/popup/components/app.svelte' 'src\popup\components\app.svelte'
Show 'src/popup/components/warning.svelte' 'src\popup\components\warning.svelte'
Show 'src/popup/index.css'          'src\popup\index.css'

# ---- the build, last so its errors are at the end -------------------
Run 'BUILD' 'pnpm build:extension'
Run 'build output' 'Get-ChildItem extension -Recurse -Name -ErrorAction SilentlyContinue'

Write-Host ""
Write-Host "Wrote $log" -ForegroundColor Green
Write-Host "Upload that file." -ForegroundColor Green
