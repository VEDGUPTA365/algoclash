# Script to copy files into individual day folders (day1 to day7) for Ved, Kunal, and Dewansh

Function Safe-Copy($Src, $Dst) {
    $Dir = Split-Path -Parent $Dst
    If (!(Test-Path $Dir)) {
        New-Item -ItemType Directory -Force -Path $Dir | Out-Null
    }
    Copy-Item -Path $Src -Destination $Dst -Force
    Write-Host "Copied: $Src -> $Dst" -ForegroundColor Green
}

# Clean existing directories to avoid stale files
Remove-Item -Path "ved", "kunal", "dewansh" -Recurse -ErrorAction Ignore

# ==========================================
# VED (Auth, Admin & Users)
# ==========================================

# Day 1: User Database Schema
Safe-Copy "database/schema.sql" "ved/day1/database/schema.sql"

# Day 2: Authentication JWT backend routes & server configuration
Safe-Copy "backend/src/controllers/authController.js" "ved/day2/backend/src/controllers/authController.js"
Safe-Copy "backend/src/routes/authRoutes.js" "ved/day2/backend/src/routes/authRoutes.js"
Safe-Copy "backend/src/server.js" "ved/day2/backend/src/server.js"

# Day 3: Frontend Login and Register UI screens
Safe-Copy "frontend/src/pages/Login.jsx" "ved/day3/frontend/src/pages/Login.jsx"
Safe-Copy "frontend/src/pages/Register.jsx" "ved/day3/frontend/src/pages/Register.jsx"

# Day 4: Session Context state and routing protections
Safe-Copy "frontend/src/context/AuthContext.jsx" "ved/day4/frontend/src/context/AuthContext.jsx"
Safe-Copy "frontend/src/App.jsx" "ved/day4/frontend/src/App.jsx"
Safe-Copy "frontend/src/components/Navbar.jsx" "ved/day4/frontend/src/components/Navbar.jsx"

# Day 5: Problem uploading database APIs
Safe-Copy "backend/src/controllers/problemController.js" "ved/day5/backend/src/controllers/problemController.js"
Safe-Copy "backend/src/routes/problemRoutes.js" "ved/day5/backend/src/routes/problemRoutes.js"

# Day 6: Admin Panel UI dashboard creation
Safe-Copy "frontend/src/pages/Admin.jsx" "ved/day6/frontend/src/pages/Admin.jsx"

# Day 7: Testing Checklist
New-Item -ItemType Directory -Force -Path "ved/day7" | Out-Null
Set-Content -Path "ved/day7/test_checklist.json" -Value '{"task": "Verify Auth & Admin pages", "status": "pending"}'


# ==========================================
# KUNAL (Practice Arena & AI Tutor)
# ==========================================

# Day 1: Arena Database Tables Configuration
Safe-Copy "database/schema.sql" "kunal/day1/database/schema.sql"

# Day 2: Problem fetching APIs & seeding default database content
Safe-Copy "backend/src/controllers/problemController.js" "kunal/day2/backend/src/controllers/problemController.js"
Safe-Copy "backend/src/routes/problemRoutes.js" "kunal/day2/backend/src/routes/problemRoutes.js"
Safe-Copy "backend/seed-problem.js" "kunal/day2/backend/seed-problem.js"

# Day 3: Practice Arena home dashboard listing
Safe-Copy "frontend/src/pages/Home.jsx" "kunal/day3/frontend/src/pages/Home.jsx"

# Day 4: Monaco Editor Workspace UI & compiler logic connection
Safe-Copy "frontend/src/pages/Problem.jsx" "kunal/day4/frontend/src/pages/Problem.jsx"
Safe-Copy "frontend/src/components/Editor.jsx" "kunal/day4/frontend/src/components/Editor.jsx"
Safe-Copy "backend/src/judge/judgeHandler.js" "kunal/day4/backend/src/judge/judgeHandler.js"

# Day 5: Submission compiler verification suite
Safe-Copy "backend/src/judge/judgeHandler.js" "kunal/day5/backend/src/judge/judgeHandler.js"

# Day 6: Gemini AI Tutor helper routes and workspace side panel UI
Safe-Copy "backend/src/controllers/aiController.js" "kunal/day6/backend/src/controllers/aiController.js"
Safe-Copy "backend/src/routes/aiRoutes.js" "kunal/day6/backend/src/routes/aiRoutes.js"
Safe-Copy "frontend/src/pages/Problem.jsx" "kunal/day6/frontend/src/pages/Problem.jsx"

# Day 7: Testing Checklist
New-Item -ItemType Directory -Force -Path "kunal/day7" | Out-Null
Set-Content -Path "kunal/day7/test_checklist.json" -Value '{"task": "Verify Arena editor and AI hints", "status": "pending"}'


# ==========================================
# DEWANSH (1v1 Duels & Matchmaking)
# ==========================================

# Day 1: Multiplayer Database Schema & Sockets server setup
Safe-Copy "database/schema.sql" "dewansh/day1/database/schema.sql"
Safe-Copy "backend/src/server.js" "dewansh/day1/backend/src/server.js"

# Day 2: Sockets ELO matchmaking queue routes
Safe-Copy "backend/src/socket/duelSocket.js" "dewansh/day2/backend/src/socket/duelSocket.js"
Safe-Copy "backend/src/socket/randomDuelSocket.js" "dewansh/day2/backend/src/socket/randomDuelSocket.js"

# Day 3: ELO Rating Rankings Leaderboard
Safe-Copy "frontend/src/pages/Leaderboard.jsx" "dewansh/day3/frontend/src/pages/Leaderboard.jsx"

# Day 4: Matchmaking search queue Client UI
Safe-Copy "frontend/src/pages/Home.jsx" "dewansh/day4/frontend/src/pages/Home.jsx"
Safe-Copy "frontend/src/components/RandomDuelButton.jsx" "dewansh/day4/frontend/src/components/RandomDuelButton.jsx"

# Day 5: Duel Arena UI Room timer broadcasts sync
Safe-Copy "frontend/src/components/DuelRoom.jsx" "dewansh/day5/frontend/src/components/DuelRoom.jsx"

# Day 6: Duel ELO results scoring APIs
Safe-Copy "backend/src/controllers/duelController.js" "dewansh/day6/backend/src/controllers/duelController.js"
Safe-Copy "backend/src/routes/duelRoutes.js" "dewansh/day6/backend/src/routes/duelRoutes.js"

# Day 7: Testing Checklist
New-Item -ItemType Directory -Force -Path "dewansh/day7" | Out-Null
Set-Content -Path "dewansh/day7/test_checklist.json" -Value '{"task": "Verify Duels, timers & score calculation", "status": "pending"}'

Write-Host "`n✅ Clean day-by-day folder hierarchy created successfully!" -ForegroundColor Yellow
