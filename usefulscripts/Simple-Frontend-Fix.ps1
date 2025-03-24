# Simple-Frontend-Fix.ps1
# A straightforward fix for frontend variable errors

$scriptPath = "C:\Users\garre\Documents\top-chef-fantasy\setup-topchef-fixed.ps1"
$backupPath = "C:\Users\garre\Documents\top-chef-fantasy\setup-topchef-backup3.ps1"

# Create a backup
Copy-Item -Path $scriptPath -Destination $backupPath

# Read the file content
$content = Get-Content -Path $scriptPath -Raw

# Fix specific problematic variable patterns with direct replacements
$content = $content -replace '`\$indexHtml', '$indexHtml'
$content = $content -replace '`\$indexCss', '$indexCss'
$content = $content -replace '`\$mainJsx', '$mainJsx'
$content = $content -replace '`\$appJsx', '$appJsx'
$content = $content -replace '`\$authContext', '$authContext'
$content = $content -replace '`\$themeContext', '$themeContext'
$content = $content -replace '`\$socketContext', '$socketContext'
$content = $content -replace '`\$leagueContext', '$leagueContext'
$content = $content -replace '`\$useAuth', '$useAuth'
$content = $content -replace '`\$useTheme', '$useTheme'
$content = $content -replace '`\$useSocket', '$useSocket'
$content = $content -replace '`\$useLeague', '$useLeague'
$content = $content -replace '`\$useChat', '$useChat'
$content = $content -replace '`\$frontendPackageJson', '$frontendPackageJson'
$content = $content -replace '`\$viteConfig', '$viteConfig'
$content = $content -replace '`\$tailwindConfig', '$tailwindConfig'
$content = $content -replace '`\$postcssConfig', '$postcssConfig'
$content = $content -replace '`\$logoSvg', '$logoSvg'
$content = $content -replace '`\$tsConfig', '$tsConfig'
$content = $content -replace '`\$tsConfigNode', '$tsConfigNode'
$content = $content -replace '`\$eslintConfig', '$eslintConfig'
$content = $content -replace '`\$loginPage', '$loginPage'
$content = $content -replace '`\$registerPage', '$registerPage'
$content = $content -replace '`\$notFoundPage', '$notFoundPage'
$content = $content -replace '`\$dashboardPage', '$dashboardPage'
$content = $content -replace '`\$chefRosterPage', '$chefRosterPage'
$content = $content -replace '`\$leaguesPage', '$leaguesPage'
$content = $content -replace '`\$leagueDetailPage', '$leagueDetailPage'
$content = $content -replace '`\$schedulePage', '$schedulePage'
$content = $content -replace '`\$settingsPage', '$settingsPage'
$content = $content -replace '`\$apiService', '$apiService'
$content = $content -replace '`\$authService', '$authService'
$content = $content -replace '`\$leagueService', '$leagueService'
$content = $content -replace '`\$chefService', '$chefService'
$content = $content -replace '`\$challengeService', '$challengeService'
$content = $content -replace '`\$messageService', '$messageService'
$content = $content -replace '`\$mainLayout', '$mainLayout'
$content = $content -replace '`\$authLayout', '$authLayout'
$content = $content -replace '`\$logoComponent', '$logoComponent'
$content = $content -replace '`\$buttonComponent', '$buttonComponent'
$content = $content -replace '`\$cardComponent', '$cardComponent'
$content = $content -replace '`\$inputComponent', '$inputComponent'
$content = $content -replace '`\$themeToggleComponent', '$themeToggleComponent'
$content = $content -replace '`\$loadingScreenComponent', '$loadingScreenComponent'
$content = $content -replace '`\$sidebarComponent', '$sidebarComponent'
$content = $content -replace '`\$headerComponent', '$headerComponent'
$content = $content -replace '`\$mobileNavComponent', '$mobileNavComponent'
$content = $content -replace '`\$chatPanelComponent', '$chatPanelComponent'
$content = $content -replace '`\$chatMessageComponent', '$chatMessageComponent'
$content = $content -replace '`\$protectedRouteComponent', '$protectedRouteComponent'
$content = $content -replace '`\$frontendEnvExample', '$frontendEnvExample'
$content = $content -replace '`\$backendEnvExample', '$backendEnvExample'
$content = $content -replace '`\$vscodeSettings', '$vscodeSettings'
$content = $content -replace '`\$startBatContent', '$startBatContent'
$content = $content -replace '`\$startShContent', '$startShContent'

# Save the fixed content
Set-Content -Path $scriptPath -Value $content

Write-Host "Fixed the frontend variables in the script." -ForegroundColor Green
Write-Host "A backup of the original script was saved to: $backupPath" -ForegroundColor Yellow
Write-Host "You can now try running the fixed script again." -ForegroundColor Cyan