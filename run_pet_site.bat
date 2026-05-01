@echo off
chcp 65001 > nul
cd /d "%~dp0"

echo [1/4] Installing dependencies...
call npm install
if errorlevel 1 goto error

echo [2/4] Generating Prisma client...
call npx prisma generate
if errorlevel 1 goto error

echo [3/4] Running Prisma migration...
call npx prisma migrate dev --name init
if errorlevel 1 goto error

echo [4/4] Starting development server...
start "pet-restaurant-site" http://localhost:3000
call npm run dev
exit /b 0

:error
echo.
echo Error occurred. Check .env and DATABASE_URL first.
pause
exit /b 1
