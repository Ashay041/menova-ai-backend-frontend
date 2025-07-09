#!/bin/bash

PORT=${1:-8000}

echo "Looking for process on port $PORT..."

PID=$(lsof -ti tcp:$PORT)

if [ -z "$PID" ]; then
  echo "✅ No process is using port $PORT."
else
  echo "⚠️  Killing process $PID on port $PORT..."
  kill -9 $PID
  echo "✅ Port $PORT is now free."
fi

uvicorn app.main:app --reload