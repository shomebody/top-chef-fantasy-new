# Create this as convert-to-typescript.ps1 and run it from your project root

# Define paths to exclude (files that should remain as JS)
$excludePaths = @(
  "vite.config.js",
  "postcss.config.js",
  ".eslintrc.cjs",
  "tailwind.config.js",
  "main.jsx"
)

# Function to check if a file should be excluded
function ShouldExclude($filePath) {
  foreach ($exclude in $excludePaths) {
    if ($filePath -like "*$exclude") {
      return $true
    }
  }
  return $false
}

# First, convert JSX files to TSX
Write-Host "Converting JSX files to TSX..." -ForegroundColor Green
$jsxFiles = Get-ChildItem -Path .\client\src -Recurse -Filter "*.jsx"
$convertedJsx = 0

foreach ($file in $jsxFiles) {
  if (-not (ShouldExclude $file.FullName)) {
    $newName = $file.FullName -replace "\.jsx$", ".tsx"
    Rename-Item -Path $file.FullName -NewName $newName
    Write-Host "Converted: $($file.FullName) -> $newName" -ForegroundColor Cyan
    $convertedJsx++
  }
  else {
    Write-Host "Skipped: $($file.FullName)" -ForegroundColor Yellow
  }
}

# Then, convert JS files to TS (excluding config files)
Write-Host "`nConverting JS files to TS..." -ForegroundColor Green
$jsFiles = Get-ChildItem -Path .\client\src -Recurse -Filter "*.js"
$convertedJs = 0

foreach ($file in $jsFiles) {
  if (-not (ShouldExclude $file.FullName)) {
    $newName = $file.FullName -replace "\.js$", ".ts"
    Rename-Item -Path $file.FullName -NewName $newName
    Write-Host "Converted: $($file.FullName) -> $newName" -ForegroundColor Cyan
    $convertedJs++
  }
  else {
    Write-Host "Skipped: $($file.FullName)" -ForegroundColor Yellow
  }
}

Write-Host "`nConversion complete!" -ForegroundColor Green
Write-Host "Converted $convertedJsx JSX files to TSX" -ForegroundColor Green
Write-Host "Converted $convertedJs JS files to TS" -ForegroundColor Green
Write-Host "Remember to fix any TypeScript errors that appear after conversion." -ForegroundColor Yellow