# Start frontend development server (PowerShell helper)
Write-Host "Starting frontend dev server..."

# check docker is running or not, if not, then exit the script
if (-not (Get-Process -Name "docker" -ErrorAction SilentlyContinue)) {
    Write-Host "Docker is not running. Please start Docker and try again."
    exit 1
}

cd ./backend

# Run the frontend dev script located in the ./frontend folder
# check postgres and redis containers are running, if not, then start them
$postgresContainer = docker ps --filter "name=postgres" --format "{{.Names}}"
$redisContainer = docker ps --filter "name=redis" --format "{{.Names}}"
# if both containers are not running, then start them all at once
if (-not $postgresContainer -and -not $redisContainer) {
    Write-Host "Postgres and Redis containers are not running. Starting them..."
    docker-compose up -d postgres redis
} elseif (-not $postgresContainer) {
    Write-Host "Postgres container is not running. Starting it..."
    docker-compose up -d postgres
} elseif (-not $redisContainer) {
    Write-Host "Redis container is not running. Starting it..."
    docker-compose up -d redis
} else {
    Write-Host "Both Postgres and Redis containers are already running."
}

Write-Host "running npm run dev"
npm run dev

cd ..