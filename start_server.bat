@echo off
chcp 65001 > nul
echo.
echo ========================================
echo 게임 로컬 서버 시작
echo ========================================
echo.
echo 브라우저를 열고 다음 주소로 접속하세요:
echo http://localhost:8000
echo.
echo Memory.html 게임:
echo http://localhost:8000/Memory.html
echo.
echo 서버를 중지하려면 Ctrl+C를 누르세요
echo.
echo ========================================
echo.

python -m http.server 8000

pause
