@echo off
chcp 65001 > nul
echo ===================================================
echo 🚀 กำลังเริ่มระบบ UD-Class System (Next.js + LINE Bot)
echo ===================================================

echo 1. ตรวจสอบฐานข้อมูล SQLite...
call npx.cmd prisma db push

echo 2. เริ่มเซิร์ฟเวอร์ UD-Class Web Dashboard...
start "UD-Class Server (Port 3000)" cmd /k "npm.cmd run start"

timeout /t 3 > nul

echo 3. เริ่ม Cloudflare Tunnel เชื่อมต่อ LINE Messaging API...
start "Cloudflare LINE Tunnel" cmd /k "node scripts/tunnel.js"

echo ===================================================
echo ✅ เปิดระบบเรียบร้อย!
echo 👉 เข้า Dashboard: http://localhost:3000
echo ===================================================
pause
