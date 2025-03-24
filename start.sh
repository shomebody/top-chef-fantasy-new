#!/bin/bash

echo "Starting Top Chef Fantasy application..."

echo ""
echo "Starting backend server..."
cd server && npm install && npm run dev &

echo ""
echo "Starting frontend development server..."
cd client && npm install && npm run dev &

echo ""
echo "Application started successfully!"
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:5173"
