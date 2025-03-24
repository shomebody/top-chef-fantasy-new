# Navigate to your project directory
Set-Location C:\Users\garre\Documents\top-chef-fantasy
# Create a single output file
$outputFile = "project_files_output.txt"

# Clear the file if it exists
if (Test-Path $outputFile) { Clear-Content $outputFile }

# Get all files (excluding binary files, node_modules, .git, etc.)
Get-ChildItem -Recurse -File | 
Where-Object { 
  $_.Extension -match '\.(js|jsx|ts|tsx|html|css|scss|json|md|yaml|yml|xml|txt|py|java|c|cpp|h|hpp|cs|go|rb|php|sql)$' -and
  $_.FullName -notmatch '(node_modules|\.git|\.vscode|build|dist|\.cache)' 
} |
ForEach-Object {
  # Add file path as header
  Add-Content $outputFile "`n`n====== $($_.FullName) ======`n"
  # Add file content
  Get-Content $_.FullName | Add-Content $outputFile
}

Write-Host "All files have been written to $outputFile"