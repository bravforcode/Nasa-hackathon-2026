# Start dev server detached + health check
Start-Process -FilePath "C:\Users\menum\.bun\bin\bun.exe" -ArgumentList "run","dev" -WorkingDirectory "C:\lunar-relay-os" -WindowStyle Hidden
Start-Sleep -Seconds 8
try {
  $res = Invoke-WebRequest "http://localhost:3000/" -UseBasicParsing -TimeoutSec 10
  Write-Host "HTTP STATUS=$($res.StatusCode) len=$($res.Content.Length)"
  if ($res.Content -match '<div id="root">') { Write-Host "ROOT_DIV=OK" } else { Write-Host "ROOT_DIV=MISSING" }
} catch {
  Write-Host "HEALTH CHECK FAILED: $($_.Exception.Message)"
}
