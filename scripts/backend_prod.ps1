
# Start backend production server (PowerShell helper)
Write-Host "Starting backend prod server..."
# Run the backend prod script located in the ./backend folder
docker-compose -f docker-compose.prod.yml up -d --build

