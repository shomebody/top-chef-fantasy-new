@echo off
echo Starting Top Chef Fantasy application...

echo.
echo Starting backend server...
start cmd /k "cd server && npm install && npm run dev"

echo.
echo Starting frontend development server...
start cmd /k "cd client && npm install && npm run dev"

echo.
echo Application started successfully!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173