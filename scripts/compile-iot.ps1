param([string]$ToolsRoot = "$env:USERPROFILE/.sm-tools")
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$cli = Join-Path $ToolsRoot 'arduino-cli/arduino-cli.exe'
$cliConfig = Join-Path $ToolsRoot 'arduino-cli/arduino-cli.yaml'
$sketch = Join-Path $repoRoot 'iot/esp32/SmartMushroom'
foreach ($profile in @(@{Mode=1;Outputs=0},@{Mode=0;Outputs=0},@{Mode=0;Outputs=1})) {
  $mode=$profile.Mode; $outputs=$profile.Outputs
  $output = Join-Path $repoRoot ".local/iot-build-$mode-$outputs"
  & $cli compile --config-file $cliConfig --fqbn esp32:esp32:esp32 --jobs 4 --build-property "compiler.cpp.extra_flags=-DSM_SIMULATION=$mode -DSM_ENABLE_HARDWARE_OUTPUTS=$outputs" --build-path $output $sketch
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Output "Compile PASS: SM_SIMULATION=$mode OUTPUTS=$outputs (compile only; no upload or hardware test)."
}
