#!/bin/bash
# start-app.sh - Manual script for daily use

echo "Showing current status of the Invenda application..."
pm2 status

echo ""
echo "Do you want to restart the backend server? (y/n)"
read -r response

if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
    echo "Restarting server..."
    pm2 restart invenda-backend
    echo "Server restarted."
else
    echo "Operation cancelled. The server remains in its current state."
fi

# Wait a few seconds before closing if opened via double click
sleep 3
