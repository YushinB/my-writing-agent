# Start frontend development server (PowerShell helper)
Write-Host "Starting frontend dev server..."

# check docker is running or not, if not, then exit the script
if (-not (Get-Process -Name "docker" -ErrorAction SilentlyContinue)) {
    Write-Host "Docker is not running. Please start Docker and try again."
    exit 1
}


# Run the frontend dev script located in the ./frontend folder
npm --prefix .\frontend run dev:frontend
