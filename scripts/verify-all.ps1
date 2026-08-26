lowfat bun test 2>&1 | Select-Object -Last 3
bunx tsc --noEmit
Write-Host "TSC=$LASTEXITCODE"
bun run build 2>&1 | Select-Object -Last 4
try {
  $r = Invoke-WebRequest "http://localhost:3000/" -UseBasicParsing -TimeoutSec 5
  Write-Host "DEV: $($r.StatusCode)"
} catch { Write-Host "DEV: DOWN" }
