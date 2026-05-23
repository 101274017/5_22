@echo off
chcp 65001 >nul
echo ============================================
echo   《此地有古人》一键启动脚本
echo ============================================
echo.

:: 检查 Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 Python，请先安装 Python 3.9+
    pause
    exit /b 1
)

:: 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js 18+
    pause
    exit /b 1
)

:: 安装后端依赖
echo [1/4] 安装后端依赖...
if not exist "backend\venv" (
    python -m venv backend\venv
)
call backend\venv\Scripts\activate.bat
pip install -r backend\requirements.txt -q
echo       后端依赖安装完成 ✓
echo.

:: 安装前端依赖
echo [2/4] 安装前端依赖...
cd frontend
if not exist "node_modules" (
    call npm install
) else (
    echo       node_modules 已存在，跳过安装
)
cd ..
echo       前端依赖安装完成 ✓
echo.

:: 启动后端
echo [3/4] 启动后端服务 (端口 8000)...
start "Ancient-Encounter-Backend" cmd /k "call backend\venv\Scripts\activate.bat && cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 3 /nobreak >nul
echo       后端服务已启动 ✓
echo.

:: 启动前端
echo [4/4] 启动前端开发服务器 (端口 5173)...
start "Ancient-Encounter-Frontend" cmd /k "cd frontend && npx vite --host"
timeout /t 3 /nobreak >nul
echo       前端服务已启动 ✓
echo.

echo ============================================
echo   全部服务已启动！
echo   后端: http://localhost:8000
echo   前端: http://localhost:5173
echo   API文档: http://localhost:8000/docs
echo ============================================
echo.
echo 关闭此窗口不会停止服务。
echo 要停止服务，请关闭对应的命令行窗口。
pause
