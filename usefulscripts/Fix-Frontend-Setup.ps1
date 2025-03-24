# Fix-Frontend-Setup.ps1
# Fix the $indexHtml variable error

$scriptPath = "C:\Users\garre\Documents\top-chef-fantasy\setup-topchef-fixed.ps1"
$backupPath = "C:\Users\garre\Documents\top-chef-fantasy\setup-topchef-backup.ps1"

# Create a backup
Copy-Item -Path $scriptPath -Destination $backupPath

# Read the file content
$content = Get-Content -Path $scriptPath -Raw

# Fix the specific variable error by removing the backtick before $indexHtml
$content = $content -replace '`\$indexHtml', '$indexHtml'

# Fix other similar frontend variables that might have the same issue
$frontendVars = @(
    'indexHtml',
    'mainJsx',
    'indexCss',
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
    'settingsPage'
)

foreach ($var in $frontendVars) {
    $content = $content -replace "`\`\`\$${var}", "`$${var}"
}

# Save the fixed content
Set-Content -Path $scriptPath -Value $content

Write-Host "Fixed the `$indexHtml variable error in the script." -ForegroundColor Green
Write-Host "A backup of the original script was saved to: $backupPath" -ForegroundColor Yellow
Write-Host "You can now try running the fixed script again." -ForegroundColor Cyan