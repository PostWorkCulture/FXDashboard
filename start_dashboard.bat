@echo off
echo Starting Trading Dashboard Backend (FastAPI)...
cd backend
start cmd /k "..\..\venv\Scripts\python.exe main.py"

echo Starting Trading Dashboard Frontend (Next.js)...
cd ..\frontend
start cmd /k "npm run dev"

echo Dashboard should be available at http://localhost:3000
