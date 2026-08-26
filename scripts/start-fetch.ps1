Start-Process -FilePath "pwsh.exe" `
  -ArgumentList "-NoLogo","-NoProfile","-File","C:\lunar-relay-os\scripts\fetch-dem.ps1" `
  -WindowStyle Hidden
Write-Host "DOWNLOAD STARTED"
