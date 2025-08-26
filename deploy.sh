#!/bin/bash
echo "Reset hard"
git reset --hard

echo "Pulling"
git pull

echo "Composing down"
sudo docker-compose down

echo "Building application"
sudo docker-compose up --build -d

echo "Check if it's running"
sudo docker ps

# Get container name (if you know it, replace `$(sudo docker ps --format '{{.Names}}' | head -n 1)` with the actual name)
container_name=$(sudo docker ps --format '{{.Names}}' | head -n 1)

echo "Fetching logs for $container_name"
sudo docker logs -f $container_name
