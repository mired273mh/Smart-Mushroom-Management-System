param([string]$JavaExe, [string]$PlantUmlJar)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
if (!$JavaExe) { $JavaExe = (Get-ChildItem (Join-Path $repoRoot '.local/tools/jre') -Filter java.exe -Recurse | Select-Object -First 1).FullName }
if (!$PlantUmlJar) { $PlantUmlJar = Join-Path $repoRoot '.local/tools/plantuml.jar' }
if (!(Test-Path -LiteralPath $JavaExe) -or !(Test-Path -LiteralPath $PlantUmlJar)) { throw 'Pass -JavaExe and -PlantUmlJar for your installed tools.' }
Set-Location $repoRoot
& $JavaExe '-Djava.awt.headless=true' -jar $PlantUmlJar -charset UTF-8 '-Playout=smetana' -failfast2 -tpng -o rendered 'docs/uml/*.puml'
exit $LASTEXITCODE
