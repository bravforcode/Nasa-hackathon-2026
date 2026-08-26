$roots = @(
  "https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/",
  "https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/ldem/"
)
foreach ($u in $roots) {
  try {
    $r = Invoke-WebRequest $u -UseBasicParsing -TimeoutSec 15
    Write-Host "=== $u => $($r.StatusCode), $($r.Content.Length) bytes"
    ($r.Content -split "`n" | Select-String -Pattern 'href="([^"]+)"' | ForEach-Object {
      $_.Matches[0].Groups[1].Value
    } | Select-Object -First 40)
  } catch {
    Write-Host "=== $u FAIL: $($_.Exception.Message)"
  }
}
