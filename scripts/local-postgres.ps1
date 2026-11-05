param([string]$ToolsRoot = "$env:USERPROFILE/.sm-tools", [int]$Port = 55439)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$localRoot = Join-Path $repoRoot '.local'
$pgBin = Join-Path $ToolsRoot 'pgsql/bin'
$pgData = Join-Path $localRoot 'postgres'
$credentialFile = Join-Path $localRoot 'database.env'
New-Item -ItemType Directory -Force -Path $localRoot | Out-Null
if (!(Test-Path -LiteralPath (Join-Path $pgBin 'initdb.exe'))) { throw 'Khong tim thay PostgreSQL portable; truyen -ToolsRoot.' }
if (!(Test-Path -LiteralPath (Join-Path $pgData 'PG_VERSION'))) {
  if ((Test-Path -LiteralPath $pgData) -and (Get-ChildItem -LiteralPath $pgData -Force)) { throw 'Thu muc data khong rong; dung de tranh ghi de.' }
  if (Test-Path -LiteralPath $credentialFile) { throw 'Da co credentials nhung thieu cluster; can kiem tra thu cong.' }
  $secretBytes = New-Object byte[] 32
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $rng.GetBytes($secretBytes)
  $rng.Dispose()
  $pgPassword = [BitConverter]::ToString($secretBytes).Replace('-', '').ToLowerInvariant()
  $passwordFile = Join-Path $localRoot 'initdb-password'
  [IO.File]::WriteAllText($passwordFile, $pgPassword)
  & (Join-Path $pgBin 'initdb.exe') -D $pgData -U sm_local -E UTF8 --locale=C --auth=scram-sha-256 --pwfile=$passwordFile
  if ($LASTEXITCODE -ne 0) { throw 'initdb failed' }
  [IO.File]::WriteAllText($credentialFile, "DATABASE_URL=postgresql://sm_local:$pgPassword@127.0.0.1:$Port/smart_mushroom_dev`n")
  # Chi xoa file mat khau tam vua tao, khong xoa database hay file nguoi dung.
  Remove-Item -LiteralPath $passwordFile
}
if (!(Test-Path -LiteralPath $credentialFile)) { throw 'Thieu .local/database.env; khong tu tao lai mat khau cluster.' }
$connectionString = (Get-Content -LiteralPath $credentialFile | Where-Object { $_.StartsWith('DATABASE_URL=') }).Substring(13)
$connectionUri = [Uri]$connectionString
if ($connectionUri.Port -ne $Port) { throw 'Port khac credentials hien co.' }
& (Join-Path $pgBin 'pg_ctl.exe') -D $pgData status *> $null
if ($LASTEXITCODE -ne 0) {
  & (Join-Path $pgBin 'pg_ctl.exe') -D $pgData -l (Join-Path $localRoot 'postgres.log') -o "-h 127.0.0.1 -p $Port" -w start
  if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL start failed; xem .local/postgres.log' }
}
$env:DATABASE_URL = $connectionString
$env:PGPASSWORD = $connectionUri.UserInfo.Split(':')[1]
$existing = & (Join-Path $pgBin 'psql.exe') -h 127.0.0.1 -p $Port -U sm_local -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='smart_mushroom_dev'"
if ($LASTEXITCODE -ne 0) { throw 'Khong ket noi duoc PostgreSQL' }
if ($existing -notcontains '1') {
  & (Join-Path $pgBin 'createdb.exe') -h 127.0.0.1 -p $Port -U sm_local smart_mushroom_dev
  if ($LASTEXITCODE -ne 0) { throw 'createdb failed' }
}
$env:PGPASSWORD = $null
Write-Output "PostgreSQL local ready on 127.0.0.1:$Port. DATABASE_URL loaded for this shell."
