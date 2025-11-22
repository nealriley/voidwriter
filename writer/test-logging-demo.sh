#!/bin/bash

echo "=== VoidWriter Logging & Error Handling Demo ==="
echo ""
echo "Starting server with all features enabled..."
echo ""

# Start server
node voidwriter.js \
  --port 3362 \
  --title "LOGGING DEMO" \
  --main-text "Watch the logs!" \
  --sub-text "Check ~/.voidwriter/logs/" \
  --save-mode both \
  --save-path /tmp/logging-demo.txt \
  --no-open \
  --timeout 10 \
  --verbose &

SERVER_PID=$!
sleep 2

echo ""
echo "=== Making API requests ==="
echo ""

# Test 1: Health check
echo "1. Health check..."
curl -s http://localhost:3362/api/health | jq . 2>/dev/null || echo "Response OK"

# Test 2: Save request
echo ""
echo "2. Save request with metadata..."
curl -s -X POST http://localhost:3362/api/save \
  -H "Content-Type: application/json" \
  -d '{
    "buffer": "This is a test of the comprehensive logging system",
    "metadata": {
      "wordCount": 9,
      "wpm": 140,
      "duration": 5,
      "combo": 9,
      "timestamp": "'$(date -Iseconds)'"
    }
  }' | jq .

# Test 3: Error case - missing buffer
echo ""
echo "3. Error case - missing buffer (intentional)..."
curl -s -X POST http://localhost:3362/api/save \
  -H "Content-Type: application/json" \
  -d '{"metadata":{"test":true}}' | jq .

# Test 4: Completion
echo ""
echo "4. Completion request..."
curl -s -X POST http://localhost:3362/api/complete \
  -H "Content-Type: application/json" \
  -d '{
    "success": true,
    "text": "Logging demo complete",
    "metadata": {"wordCount": 3}
  }' | jq .

# Wait for server
wait $SERVER_PID

echo ""
echo "=== Demo Complete ==="
echo ""
echo "View the log file:"
ls -lh ~/.voidwriter/logs/ | tail -1
echo ""
echo "Log file contents:"
tail -5 ~/.voidwriter/logs/voidwriter-*.log | tail -20

