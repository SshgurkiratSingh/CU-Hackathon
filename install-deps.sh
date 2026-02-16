#!/bin/bash

# Quick start script for Greenhouse OS - Install missing dependencies

echo "🌱 Greenhouse OS - Dependency Installation"
echo "==========================================================="
echo ""
echo "Checking for required services..."
echo ""

# Check MongoDB
if ! command -v mongod &> /dev/null; then
    echo "MongoDB not found. Installing..."
    sudo apt-get update > /dev/null 2>&1
    sudo apt-get install -y mongodb > /dev/null 2>&1
    echo "✓ MongoDB installed"
else
    echo "✓ MongoDB already installed"
fi

# Check Redis
if ! command -v redis-server &> /dev/null; then
    echo "Redis not found. Installing..."
    sudo apt-get install -y redis-server > /dev/null 2>&1
    echo "✓ Redis installed"
else
    echo "✓ Redis already installed"
fi

# Check mosquitto
if ! command -v mosquitto &> /dev/null; then
    echo "Mosquitto not found. Installing..."
    sudo apt-get install -y mosquitto mosquitto-clients > /dev/null 2>&1
    echo "✓ Mosquitto installed"
else
    echo "✓ Mosquitto already installed"
fi

echo ""
echo "==========================================================="
echo "Dependencies installation complete!"
echo ""
echo "Now run: bash start-dev.sh"
