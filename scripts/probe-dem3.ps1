$urls = @(
  "https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/loldem/",
  "https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/",
  "https://imbrium.mit.edu/DATA/LOLA_GSDC/",
  "https://imbrium.mit.edu/DATA/"
)
foreach ($u in $urls) {
  try {
    $r = Invoke-WebRequest $u -UseBasicParsing -TimeoutSec 15
    Write-Host "=== $u => $($r.StatusCode)"
    ($r.Content -split "`n" | Select-String -Pattern 'href="([^"]+)"' | ForEach-Object {
      $_.Matches[0].Groups[1].Value
    } | Select-Object -First 30)
  } catch {
    Write-Host "=== $u FAIL: $($_.Exception.Message)"
  }
}
