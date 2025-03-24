# Fix-JSX-Syntax.ps1
$clientDir = "C:\Users\garre\Documents\top-chef-fantasy\client\src"

# Get all JSX files
$jsxFiles = Get-ChildItem -Path $clientDir -Recurse -Include "*.jsx"

foreach ($file in $jsxFiles) {
  $content = Get-Content -Path $file.FullName -Raw
    
  # Fix className without quotes
  $content = $content -replace 'className=([a-zA-Z0-9\-_]+)', 'className="$1"'
    
  # Fix corrupted className with multiple classes
  $content = $content -replace 'className=([a-zA-Z0-9\-_]+\s+[^"{\r\n]+)', 'className="$1"'
    
  # Fix missing closing braces in template strings
  $content = $content -replace 'className={\`([^}]+)(?<!\`)}', 'className={`$1`}'
    
  # Fix title prop with text directly inside (for Schedule.jsx)
  $content = $content -replace 'title={\s*([^{}]+?)\s*}', 'title="$1"'
    
  Set-Content -Path $file.FullName -Value $content
}

Write-Host "JSX syntax fixes applied to all React component files." -ForegroundColor Green