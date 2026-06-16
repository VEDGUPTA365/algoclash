# ⚔️ Dewansh's Feature Implementation & Git Push Plan

*   **Branch:** `feature/duel-matchmaking`
*   **Focus Area:** Sockets Engine, ELO Matchmaking queues, Real-Time Duel scoreboards, and ELO Rankings Leaderboards.

---

## 📅 Day-by-Day Plan

### Day 1–2: Database Tables & Socket Queue Servers
*   **Task:** Setup duel historical tables and initialize the Socket.io server logic.
*   **Action Items:**
    1. Verify/Write duel and leaderboard structures in `database/schema.sql`.
    2. Write standard socket connection configurations in `backend/src/server.js` and register initial routes.
    3. Construct ELO-based matchmaking queue logic inside `backend/src/socket/randomDuelSocket.js` and `backend/src/socket/duelSocket.js`.
*   **Git Commands to run at end of Day 2:**
    ```bash
    git checkout feature/duel-matchmaking
    git add backend/src/socket/duelSocket.js backend/src/socket/randomDuelSocket.js database/schema.sql backend/src/server.js
    git commit -m "feat(duel): multiplayer database tables, socket configuration, and matchmaking queue logic"
    git push origin feature/duel-matchmaking
    ```

---

### Day 3–4: Sockets UI Integration & Rankings Leaderboard
*   **Task:** Render the leaderboard rankings and build frontend socket hook.
*   **Action Items:**
    1. Design and integrate the Leaderboard ranking scoreboard page in `frontend/src/pages/Leaderboard.jsx` sorting students by ELO wins and ratios.
    2. Implement the frontend Socket Context Provider to share real-time triggers across components.
    3. Create the queue matchmaking panel UI on the homepage (allows entering ELO search queue).
*   **Git Commands to run at end of Day 4:**
    ```bash
    git add frontend/src/pages/Leaderboard.jsx frontend/src/context/SocketContext.jsx frontend/src/pages/Home.jsx
    git commit -m "feat(duel): leaderboard page UI and matchmaking queue client integrations"
    git push origin feature/duel-matchmaking
    ```

---

### Day 5–6: Real-Time Duel Arena Sync & ELO Score Updates
*   **Task:** Synchronize duel rooms (timers, inputs, submissions scoring) and ELO upgrades.
*   **Action Items:**
    1. Build the real-time Duel Arena Room UI `frontend/src/components/DuelRoom.jsx` displaying side-by-side score progress meters.
    2. Configure duel timer countdowns, live opponent submission triggers, and room exit handlers.
    3. Build ELO calculation controller update queries (upgrades rating on victory, downgrades on loss) and save them to backend database.
*   **Git Commands to run at end of Day 6:**
    ```bash
    git add frontend/src/components/DuelRoom.jsx backend/src/controllers/duelController.js
    git commit -m "feat(duel): duel arena rooms, timer sync, and rating updates logic"
    git push origin feature/duel-matchmaking
    ```

---

### Day 7: Unified Testing and Branch Merger
*   **Task:** Run comprehensive tests and merge features into main.
*   **Action Items:**
    1. Switch to `main` branch and pull latest changes:
       ```bash
       git checkout main
       git pull origin main
       ```
    2. Merge your branch:
       ```bash
       git merge feature/duel-matchmaking
       ```
    3. Host duel matchmaking, verify duel room timers synchronize, submit solutions, and confirm rating adjustments on ELO leaderboards.
