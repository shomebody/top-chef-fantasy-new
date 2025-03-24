# Fix-Frontend-Variables.ps1
# This script fixes incorrectly escaped PowerShell variables in the frontend section

$scriptPath = "C:\Users\garre\Documents\top-chef-fantasy\setup-topchef-fixed.ps1"
$backupPath = "C:\Users\garre\Documents\top-chef-fantasy\setup-topchef-backup2.ps1"

# Create a backup
Copy-Item -Path $scriptPath -Destination $backupPath

# Read the file content
$content = Get-Content -Path $scriptPath -Raw

# Define a list of frontend PowerShell variables that should NOT have backticks
$frontendVars = @(
    'indexHtml',
    'indexCss',
    'mainJsx',
    'appJsx',
    'authContext',
    'themeContext',
    'socketContext',
    'leagueContext',
    'useAuth',
    'useTheme',
    'useSocket',
    'useLeague',
    'useChat',
    'apiService',
    'authService',
    'leagueService',
    'chefService',
    'challengeService',
    'messageService',
    'mainLayout',
    'authLayout',
    'loginPage',
    'registerPage',
    'notFoundPage',
    'dashboardPage',
    'chefRosterPage',
    'leaguesPage',
    'leagueDetailPage',
    'schedulePage',
    'settingsPage',
    'frontendPackageJson',
    'viteConfig',
    'tailwindConfig',
    'postcssConfig',
    'gitignore',
    'logoSvg',
    'tsConfig',
    'tsConfigNode',
    'eslintConfig'
)

# Remove backticks from these variables by testing different patterns
foreach ($var in $frontendVars) {
    # Fix pattern where variable is at the beginning of a line with backtick
    $content = $content -replace "^\s*`\`\$${var}", "`$${var}"
    
    # Fix inside a line
    $content = $content -replace "\s+`\`\$${var}", " `$${var}"
}

# Save the fixed content
Set-Content -Path $scriptPath -Value $content

Write-Host "Fixed the incorrectly escaped frontend variables in the script." -ForegroundColor Green
Write-Host "A backup of the original script was saved to: $backupPath" -ForegroundColor Yellow
Write-Host "You can now try running the fixed script again." -ForegroundColor Cyan