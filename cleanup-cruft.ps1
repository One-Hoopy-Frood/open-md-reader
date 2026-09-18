# Open Markdown Reader: remove upstream cruft.
# Run from the repo root, the folder containing package.json.
# Every path below was verified as unreferenced by any file under src/,
# or as upstream-specific material that should not ship in a fork.

$ErrorActionPreference = 'Stop'

if (-not (Test-Path 'package.json')) {
  Write-Error 'Run this from the repo root (the folder with package.json).'
}

function Remove-IfPresent($path) {
  if (Test-Path $path) {
    Remove-Item -Recurse -Force $path
    Write-Host "removed  $path"
  } else {
    Write-Host "skipped  $path (not present)"
  }
}

Write-Host "`n-- locales the maintainer cannot verify --"
'en_GB','en_US','ko','uk','zh_CN','zh_TW' | ForEach-Object {
  Remove-IfPresent "src\_locales\$_"
}

Write-Host "`n-- images not referenced anywhere in src, but copied into every build --"
# Browser badges and web-store buttons: README marketing art only.
'Arc.png','Chrome.png','Edge.png','Firefox.png','Safari.png',
'chrome-web-store.svg','fx-addon.svg',
# WeChat donation QR pointing at the upstream author.
'mp-qrcode.jpg' | ForEach-Object {
  Remove-IfPresent "src\images\$_"
}

Write-Host "`n-- upstream project documents --"
# Translated READMEs for languages this fork does not maintain.
Remove-IfPresent 'README-cn.md'
Remove-IfPresent 'README-ko.md'
# Routes sponsorship to the upstream author.
Remove-IfPresent '.github\FUNDING.yml'
# Names upstream's contact address (mdreader@163.com) as the reporting channel.
Remove-IfPresent 'CODE_OF_CONDUCT.md'

Write-Host "`n-- optional --"
Write-Host 'src\images\logo*.png and logo*.svg are still the upstream logo.'
Write-Host 'Kept on purpose: replacing them needs new artwork. See ATTRIBUTION.md.'
Write-Host '.github\ISSUE_TEMPLATE\feature_request.md says "Suggest an idea for md-reader".'
Write-Host 'Edit or delete that folder depending on whether you take issues.'

Write-Host "`nDone. Rebuild with: pnpm build:extension"
