# Automatic-JS-Fix.ps1
# Script to automatically fix common JavaScript syntax errors

$serverDir = "C:\Users\garre\Documents\top-chef-fantasy\server\src"

# Get all JavaScript files
$jsFiles = Get-ChildItem -Path $serverDir -Recurse -Include "*.js"
$fixCount = 0

foreach ($file in $jsFiles) {
  Write-Host "Processing: $($file.FullName)" -ForegroundColor Cyan
  $content = Get-Content -Path $file.FullName -Raw
  $originalContent = $content
    
  # Fix console.log statements without quotes or template literals
  $content = $content -replace 'console\.log\(([^"`\(\)]+)\);', 'console.log(`$1`);'
    
  # Fix console.log with variables by preserving variable names
  $content = $content -replace 'console\.log\(([^"`:]+):([^"`\)]+)\);', 'console.log(`$1: ${$2}`);'
    
  # General fix for missing template literals in statements with variables
  $content = $content -replace '([a-zA-Z0-9_]+):\s*\$\{([a-zA-Z0-9_\.]+)\}', '`$1: ${$2}`'
    
  # Fix object properties missing commas
  $content = $content -replace '(\w+):\s*([^,\s\}]+)\s+(\w+):', '$1: $2, $3:'
    
  # Save changes if the file was modified
  if ($content -ne $originalContent) {
    $fixCount++
    Set-Content -Path $file.FullName -Value $content -Encoding UTF8
    Write-Host "  Fixed syntax issues in $($file.Name)" -ForegroundColor Green
  }
  else {
    Write-Host "  No issues found in $($file.Name)" -ForegroundColor Gray
  }
}

Write-Host "`nFix complete! Modified $fixCount files." -ForegroundColor Yellow
Write-Host "You may need to run this script multiple times to catch all errors." -ForegroundColor Yellow