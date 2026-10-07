@echo off
chcp 65001 > nul
echo ===================================================
echo 🚀 ระบบส่งข้อมูลขึ้น GitHub (Git Push)
echo ===================================================

git status

echo.
set /p commitMsg="ใส่ข้อความบันทึกการเปลี่ยนแปลง (Commit message): "
if "%commitMsg%"=="" set commitMsg="update: classroom system changes"

git add .
git commit -m "%commitMsg%"
git push origin main

echo.
echo ===================================================
echo ✅ อัปเดตขึ้น GitHub เรียบร้อยแล้ว!
echo ===================================================
pause
