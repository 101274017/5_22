@echo off
chcp 65001 >nul
echo 正在停止所有服务...
taskkill /fi "WINDOWTITLE eq Ancient-Encounter-Backend" /f >nul 2>nul
taskkill /fi "WINDOWTITLE eq Ancient-Encounter-Frontend" /f >nul 2>nul
:: 也杀掉可能残留的进程
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do taskkill /pid %%a /f >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do taskkill /pid %%a /f >nul 2>nul
echo 所有服务已停止。
pause
