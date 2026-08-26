$u = "https://imbrium.mit.edu/DATA/LOLA_GDR/POLAR/IMG/"
$r = Invoke-WebRequest ($u + "LDEM_80S_80M.LBL") -UseBasicParsing -TimeoutSec 20
Write-Host $r.Content
try {
  $h = Invoke-WebRequest ($u + "LDEM_80S_80M.IMG") -Method Head -UseBasicParsing -TimeoutSec 20
  Write-Host "IMG bytes=$($h.Headers['Content-Length'])"
} catch { Write-Host "head fail" }
