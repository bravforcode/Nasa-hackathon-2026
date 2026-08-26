# Download the real LOLA GDR south-polar DEM (build-time only, gitignored).
$ErrorActionPreference = 'Stop'
$dir = "C:\lunar-relay-os\scripts\cache"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$out = Join-Path $dir "LDEM_80S_80M.IMG"
if (Test-Path $out) {
  Write-Host "ALREADY EXISTS: $((Get-Item $out).Length) bytes"
  exit 0
}
Write-Host "Downloading 115,520,000 bytes..."
Invoke-WebRequest `
  "https://imbrium.mit.edu/DATA/LOLA_GDR/POLAR/IMG/LDEM_80S_80M.IMG" `
  -OutFile $out -UseBasicParsing -TimeoutSec 1800
Write-Host "DONE: $((Get-Item $out).Length) bytes"
