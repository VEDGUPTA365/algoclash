# AlgoClash - GitHub Setup and Branching Script
# ─────────────────────────────────────────────────────────────

Write-Host "`n🚀 Preparing AlgoClash repository for GitHub..." -ForegroundColor Indigo

# 1. Stage and commit the clean baseline (no tournament feature)
Write-Host "`n[1/4] Staging and committing clean tournament-free baseline..." -ForegroundColor Cyan
git add -A
git commit -m "chore: remove tournament feature and establish baseline"

# 2. Create local feature branches for the team members
Write-Host "`n[2/4] Creating local feature branches..." -ForegroundColor Cyan

# Define branches
$branches = @(
    "feature/auth-admin",       # Ved's Branch
    "feature/arena-compiler-ai", # Kunal's Branch
    "feature/duel-matchmaking"   # Dewansh's Branch
)

foreach ($branch in $branches) {
    # Check if branch already exists
    $exists = git branch --list $branch
    if ($exists) {
        Write-Host "  Branch '$branch' already exists." -ForegroundColor Yellow
    } else {
        git branch $branch
        Write-Host "  Created branch: $branch" -ForegroundColor Green
    }
}

# 3. Prompt user for remote GitHub repository link
Write-Host "`n[3/4] Linking to GitHub remote repository..." -ForegroundColor Cyan
$remoteUrl = Read-Host "Enter your GitHub Repository URL (e.g., https://github.com/username/repo.git)"

if ([string]::IsNullOrWhiteSpace($remoteUrl)) {
    Write-Host "`n⚠️ No URL entered. Skipping remote setup. You can do this manually later using:" -ForegroundColor Yellow
    Write-Host "  git remote add origin <your-repository-url>" -ForegroundColor Yellow
    Write-Host "  git push -u origin --all" -ForegroundColor Yellow
} else {
    # Check if origin already exists
    $hasRemote = git remote | Where-Object { $_ -eq "origin" }
    if ($hasRemote) {
        Write-Host "  Updating existing 'origin' remote URL..." -ForegroundColor Yellow
        git remote set-url origin $remoteUrl
    } else {
        Write-Host "  Adding 'origin' remote URL..." -ForegroundColor Green
        git remote add origin $remoteUrl
    }

    # 4. Push all branches to GitHub
    Write-Host "`n[4/4] Pushing all branches to GitHub..." -ForegroundColor Cyan
    Write-Host "  Pushing 'main'..." -ForegroundColor Gray
    git push -u origin main

    Write-Host "  Pushing feature branches..." -ForegroundColor Gray
    git push origin feature/auth-admin
    git push origin feature/arena-compiler-ai
    git push origin feature/duel-matchmaking

    Write-Host "`n✅ Successfully pushed all branches to GitHub!" -ForegroundColor Green
}

Write-Host "`n📋 Team Collaboration Guide:" -ForegroundColor White
Write-Host "  1. Ved should switch to and work on:       git checkout feature/auth-admin" -ForegroundColor White
Write-Host "  2. Kunal should switch to and work on:     git checkout feature/arena-compiler-ai" -ForegroundColor White
Write-Host "  3. Dewansh should switch to and work on:   git checkout feature/duel-matchmaking" -ForegroundColor White
Write-Host "  4. Make sure to commit and push changes on these branches to update GitHub.`n" -ForegroundColor White
