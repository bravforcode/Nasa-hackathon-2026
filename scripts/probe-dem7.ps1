$u = "https://imbrium.mit.edu/DATA/LOLA_GDR/POLAR/IMG/"
foreach ($f in @("LDEC_80S_240M.LBL","LDEC_80S_120M.LBL")) {
  try {
    $r = Invoke-WebRequest ($u + $f) -UseBasicParsing -TimeoutSec 15
    Write-Host "===== $f ====="
    $r.Content
  } catch { Write-Host "$f FAIL $($_.Exception.Message)" }
}
try {
  $h = Invoke-WebRequest ($u + "LDEC_80S_240M.IMG") -Method Head -UseBasicParsing -TimeoutSec 15
  Write-Host "IMG len=$($h.Headers['Content-Length'])"
} catch { Write-Host "IMG head fail" }
