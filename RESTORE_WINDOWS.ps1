$ErrorActionPreference = 'Stop'
Write-Host 'SHAFI MOBILE ZONE - RESTORE' -ForegroundColor Cyan
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'Node.js is not installed. Install Node.js 20.19+ or 22.12+, then reopen PowerShell.'
}
if (-not (Test-Path '.env')) {
  Copy-Item '.env.example' '.env'
  Write-Host 'Created .env from .env.example. Add your existing Supabase URL and publishable/anon key.' -ForegroundColor Yellow
}
npm install
npm run build
Write-Host 'Restore setup complete. Run: npm run dev' -ForegroundColor Green
