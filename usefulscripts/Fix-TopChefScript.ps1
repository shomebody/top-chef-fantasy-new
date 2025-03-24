# Fix-TopChefScript.ps1
# Fixes both function naming conventions and MongoDB operators

$scriptPath = "C:\Users\garre\Documents\top-chef-fantasy\setup-topchef.ps1"
$outputPath = "C:\Users\garre\Documents\top-chef-fantasy\setup-topchef-fixed.ps1"

# Read the script content
$content = Get-Content -Path $scriptPath -Raw

# Fix PowerShell function names to use approved verbs
$content = $content -replace "function Create-Directory", "function New-Directory"
$content = $content -replace "Create-Directory", "New-Directory"
$content = $content -replace "function Create-File", "function New-File"
$content = $content -replace "Create-File", "New-File"

# Fix MongoDB operators with backtick escaping
$mongoOperators = @(
    '\$push',
    '\$pull',
    '\$set',
    '\$addToSet',
    '\$ne',
    '\$in',
    '\$lt',
    '\$gt',
    '\$gte',
    '\$lte',
    '\$regex',
    '\$exists',
    '\$not',
    '\$and',
    '\$or',
    '\$elemMatch'
)

foreach ($operator in $mongoOperators) {
    $content = $content -replace $operator, ('`' + $operator.TrimStart('\'))
}

# Save the fixed script
Set-Content -Path $outputPath -Value $content

Write-Host "Fixed script saved to: $outputPath" -ForegroundColor Green
Write-Host "The script fixes both function naming conventions and MongoDB operators" -ForegroundColor Yellow