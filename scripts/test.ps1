param([string]$NodeDirectory = "$env:USERPROFILE/.sm-tools/node-v22.23.4-win-x64")
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $repoRoot
if (Test-Path -LiteralPath $NodeDirectory) { $env:PATH = "$NodeDirectory;" + $env:PATH }
if (!$env:TEST_DATABASE_URL) {
  $credentialFile = Join-Path $repoRoot '.local/database.env'
  if (!(Test-Path -LiteralPath $credentialFile)) { throw 'Set TEST_DATABASE_URL (sm_test_*) or run scripts/local-postgres.ps1 first.' }
  $testUri = [UriBuilder](Get-Content -LiteralPath $credentialFile).Substring(13)
  $testUri.Path = 'sm_test_' + (Get-Date -Format 'yyyyMMddHHmmss') + '_' + ([Guid]::NewGuid().ToString('N').Substring(0,8))
  $env:TEST_DATABASE_URL = $testUri.Uri.AbsoluteUri
}
& npm.cmd test
exit $LASTEXITCODE
