# 💻 Kunal's Feature Implementation & Git Push Plan

*   **Branch:** `feature/arena-compiler-ai`
*   **Focus Area:** Practice Arena Dashboard, Monaco Code Workspace, Compile/Run API pipeline, and Gemini AI Tutor helper.

---

## 📅 Day-by-Day Plan

### Day 1–2: Database Tables & REST API Endpoints
*   **Task:** Setup tables to store coding challenges, test scenarios, and user submissions.
*   **Action Items:**
    1. Verify/Write problem and test_cases table structure in `database/schema.sql`.
    2. Write seeder scripts in backend to populate standard practices coding challenges.
    3. Build API controllers in `backend/src/controllers/problemController.js` and `backend/src/routes/problemRoutes.js` to fetch problem details.
*   **Git Commands to run at end of Day 2:**
    ```bash
    git checkout feature/arena-compiler-ai
    git add backend/src/controllers/problemController.js backend/src/routes/problemRoutes.js database/schema.sql
    git commit -m "feat(arena): problem database setup, seeding script, and API endpoints"
    git push origin feature/arena-compiler-ai
    ```

---

### Day 3–4: Arena Dashboard UI & Monaco Editor Integration
*   **Task:** Build the coding workspace layout and problem selection board.
*   **Action Items:**
    1. Implement the dashboard UI `frontend/src/pages/Home.jsx` showing problem listings, filters (by tags/difficulty), and search indexes.
    2. Integrate the Monaco code editor into `frontend/src/pages/Problem.jsx` so users can select coding languages and write code.
    3. Implement backend compilation bridge (takes user code, runs it, and compares output against test_cases).
*   **Git Commands to run at end of Day 4:**
    ```bash
    git add frontend/src/pages/Home.jsx frontend/src/pages/Problem.jsx backend/src/controllers/compileController.js
    git commit -m "feat(arena): Monaco editor workspace, arena listings UI, and compilation pipeline"
    git push origin feature/arena-compiler-ai
    ```

---

### Day 5–6: Submission Evaluation & Gemini AI Tutor
*   **Task:** Build code scoring feedback and integrate the AI hint system.
*   **Action Items:**
    1. Build submissions check: runs full test suites, returns metrics (accepted, compilation error, test case fails) to backend/frontend.
    2. Build Gemini AI Tutor routes in `backend/src/controllers/aiController.js` using Gemini API key to return syntax solutions, logic bugs, or code hints.
    3. Build frontend AI side drawer pane inside Monaco workspace page to render hints.
*   **Git Commands to run at end of Day 6:**
    ```bash
    git add backend/src/controllers/aiController.js frontend/src/pages/Problem.jsx
    git commit -m "feat(arena): test suite evaluation and Gemini AI Tutor workspace drawer"
    git push origin feature/arena-compiler-ai
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
       git merge feature/arena-compiler-ai
       ```
    3. Test solving practice problems, submitting code, checking evaluation status, and calling the AI Tutor helper. Resolve conflicts and verify build.
