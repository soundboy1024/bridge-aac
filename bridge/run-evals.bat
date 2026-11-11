@echo off
rem Bridge eval runner. Reads bridge\.env for the API key (see .env.example).
setlocal
cd /d "%~dp0"
if not exist node_modules (
  echo Installing dependencies...
  call npm install || exit /b 1
)
if not exist .env (
  echo No .env found. Copy .env.example to .env and put your GROQ_API_KEY in it.
  pause
  exit /b 1
)
call npm run eval
echo.
echo Full outputs are in evals\last-run.^<provider^>.json
pause
