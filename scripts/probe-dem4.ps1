foreach ($u in @("https://imbrium.mit.edu/DATA/LOLA_GDR/")) {
  $r = Invoke-WebRequest $u -UseBasicParsing -TimeoutSec 15
  Write-Host "=== $u => $($r.StatusCode)"
  ($r.Content -split "`n" | Select-String -Pattern 'href="([^"]+)"' | ForEach-Object {
    $_.Matches[0].Groups[1].Value
  })
}
