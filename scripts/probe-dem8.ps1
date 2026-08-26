$r = Invoke-WebRequest "https://imbrium.mit.edu/DATA/LOLA_GDR/POLAR/IMG/" -UseBasicParsing -TimeoutSec 20
$hrefs = $r.Content -split "`n" | Select-String -Pattern 'href="([^"]+)"' | ForEach-Object { $_.Matches[0].Groups[1].Value }
Write-Host "TOTAL hrefs: $($hrefs.Count)"
$hrefs | Where-Object { $_ -match '80S' } | ForEach-Object { Write-Host $_ }
