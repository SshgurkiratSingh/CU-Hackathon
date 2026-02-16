#!/bin/bash

# Greenhouse OS Backend - Quick Setup Guide

echo "🌱 Greenhouse OS Backend - Setup Script"
echo "========================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚙️  Creating .env from template..."
    cp .env.example .env
    echo "⚠️  IMPORTANT: Edit .env and add your GEMINI_API_KEY"
else
    echo "✅ .env already exists"
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker."
    exit 1
fi

echo "✅ Docker found"

# Check Node
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 20+"
    exit 1
fi

echo "✅ Node.js $(node --version) found"

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🚀 Starting Greenhouse OS Stack..."
echo ""
echo "Services starting:"
echo "  • MongoDB (27017)"
echo "  • Redis (6379)"
echo "  • MQTT (1883)"
echo "  • Backend API (3000)"
echo ""

docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 5

# Check health
echo ""
echo "🔍 Checking service health..."
HEALTH=$(curl -s http://localhost:3000/health || echo "failed")

if [ "$HEALTH" != "failed" ]; then
    echo "✅ API is healthy!"
else
    echo "⏳ API still starting, check docker logs in 10 seconds..."
fi

echo ""
echo "📋 Quick Start Commands:"
echo ""
echo "1. Register a user:"
echo "   curl -X POST http://localhost:3000/api/auth/register \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"farmer@test.com\",\"password\":\"SecurePass123\",\"name\":\"John\"}'"
echo ""
echo "2. Login:"
echo "   curl -X POST http://localhost:3000/api/auth/login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"farmer@test.com\",\"password\":\"SecurePass123\"}'"
echo ""
echo "3. Access kiosk (no auth required):"
echo "   curl http://localhost:3000/api/kiosk/dashboard?siteId=default-greenhouse"
echo ""
echo "4. Check API health:"
echo "   curl http://localhost:3000/health"
echo ""
echo "📖 For full documentation, see:"
echo "   • IMPLEMENTATION.md - All endpoints"
echo "   • PHASE1_COMPLETE.md - Implementation summary"
echo ""
echo "🐳 Docker commands:"
echo "   • View logs: docker-compose logs -f backend"
echo "   • Stop: docker-compose down"
echo "   • Reset: docker-compose down -v"
echo ""
