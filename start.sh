#!/bin/bash

# This traps the Ctrl+C signal and kills all background processes started by this script
trap 'kill %1 %2; exit' SIGINT

echo "Starting The Tech ShopWay Servers..."

# 1. Start Django Backend in the background
echo "Starting Django Backend on port 8000..."
cd Backend/App || exit
python manage.py runserver & 

# Go back to the root folder
cd ../..

# 2. Start React Frontend in the background
echo "Starting React Frontend on port 3000..."
cd Frontend/testapp || exit
npm run dev &

echo "✅ Both servers are running!"
echo "➡️  Frontend: http://localhost:3000"
echo "➡️  Backend:  http://127.0.0.1:8000"
echo "🛑 Press [Ctrl+C] to stop both servers."

# Wait keeps the script running so the background processes don't close
wait