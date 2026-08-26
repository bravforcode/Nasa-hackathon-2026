$base = "https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/ldem/"
foreach ($i in @("ldem_3.lbl","ldem_3.img","ldem_16.lbl","ldem_16.img","ldem_4.lbl","ldem_4.img")) {
  try {
    $r = Invoke-WebRequest ($base + $i) -Method Head -UseBasicParsing -TimeoutSec 12
    Write-Host "$i : HTTP $($r.StatusCode) len=$($r.Headers['Content-Length'])"
  } catch {
    $code = "?"
    if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
    Write-Host "$i : FAIL $code"
  }
}
