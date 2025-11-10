@echo off
chcp 65001 > nul
cls

echo.
echo ================================================
echo   게임 로컬 서버 시작
echo ================================================
echo.

REM Node.js 설치 여부 확인
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js가 설치되지 않았습니다.
    echo.
    echo Node.js 설치 방법:
    echo 1. https://nodejs.org/ 에서 LTS 버전 다운로드
    echo 2. 설치 후 컴퓨터를 재부팅
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js가 감지되었습니다.
echo.
echo 시작 중...
echo.

REM 서버 실행
node server.js

pause
