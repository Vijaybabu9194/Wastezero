#!/bin/bash

# Test login with admin credentials
echo "Testing Admin Login..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vijaybabuarumilli@gmail.com",
    "password": "admin@123"
  }' \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
