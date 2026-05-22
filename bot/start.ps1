# ============================================================
# WhatsApp Bot Başlatma Scripti
# Kullanım: .\start.ps1
# ============================================================

# Eğer Redis ana proje köküne (../redis5) konulduysa onu kullan, yoksa local olanı dene
$RedisExe = Join-Path $PSScriptRoot "..\redis5\redis-server.exe"
if (-not (Test-Path $RedisExe)) {
    $RedisExe = Join-Path $PSScriptRoot "redis5\redis-server.exe"
}

# 1. Redis çalışıyor mu kontrol et
$redisRunning = Get-Process -Name "redis-server" -ErrorAction SilentlyContinue

if ($redisRunning) {
    Write-Host "Redis zaten calisiyor (PID: $($redisRunning.Id))" -ForegroundColor Green
} else {
    if (Test-Path $RedisExe) {
        Write-Host "Redis baslatiliyor..." -ForegroundColor Yellow
        Start-Process -FilePath $RedisExe -WindowStyle Hidden
        Start-Sleep -Seconds 2

        $redisRunning = Get-Process -Name "redis-server" -ErrorAction SilentlyContinue
        if ($redisRunning) {
            Write-Host "Redis baslatildi (PID: $($redisRunning.Id))" -ForegroundColor Green
        } else {
            Write-Host "Redis baslatilamadi! redis5 klasoru mevcut mu?" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Redis bulunamadi. Linux/sunucu ortaminda 'systemctl start redis-server' kullanin." -ForegroundColor Yellow
    }
}

# Onceki gorsel hash'lerini temizle (duplicate detection sifirla)
$RedisCli = Join-Path $PSScriptRoot "..\redis5\redis-cli.exe"
if (Test-Path $RedisCli) {
    Write-Host "Gorsel cache temizleniyor..." -ForegroundColor DarkGray
    & $RedisCli FLUSHALL 2>$null | Out-Null
}

# 2. WhatsApp oturumunu sıfırla mı?
Write-Host ""
$resetSession = Read-Host "WhatsApp oturumunu sifirla (yeni QR kodu)? [e/H]"
if ($resetSession -eq "e" -or $resetSession -eq "E") {
    $sessionDir = Join-Path $PSScriptRoot "auth_info_baileys"
    if (Test-Path $sessionDir) {
        Remove-Item -Recurse -Force $sessionDir
        Write-Host "WhatsApp oturumu sifirlandi." -ForegroundColor Yellow
    }
}

# 3. Botu başlat
Write-Host ""
Write-Host "Bot baslatiliyor... (Cikmak icin CTRL+C)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor DarkGray
npm run dev
