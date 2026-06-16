# 🔑 Ved's Feature Implementation & Git Push Plan

*   **Branch:** `feature/auth-admin`
*   **Focus Area:** Authentication, User Profiles, Security, Route Guards, and the Admin Panel.

---

## 📅 Day-by-Day Plan

### Day 1–2: Database Setup & Authentication APIs
*   **Task:** Define user storage and secure endpoints for logins.
*   **Action Items:**
    1. Verify/Write user table structure in `database/schema.sql` (excluding tournament columns).
    2. Build JWT signup and login backend route controllers under `backend/src/controllers/authController.js` and `backend/src/routes/authRoutes.js`.
    3. Ensure base Express app middleware (CORS, Express JSON) are set up in `backend/src/server.js`.
*   **Git Commands to run at end of Day 2:**
    ```bash
    git checkout feature/auth-admin
    git add database/schema.sql backend/src/controllers/authController.js backend/src/routes/authRoutes.js backend/src/server.js
    git commit -m "feat(auth): database setup and jwt authentication API endpoints"
    git push origin feature/auth-admin
    ```

---

### Day 3–4: Frontend Authentication Views & Context
*   **Task:** Construct the user session workspace in the frontend.
*   **Action Items:**
    1. Create Login and Register layout views in `frontend/src/pages/Login.jsx` and `frontend/src/pages/Register.jsx`.
    2. Write the AuthContext hook (`frontend/src/context/AuthContext.jsx`) to manage login, logout, and current user local storage.
    3. Build `Protected` and `AdminRoute` wrapper components in `frontend/src/App.jsx` to restrict page access.
*   **Git Commands to run at end of Day 4:**
    ```bash
    git add frontend/src/pages/Login.jsx frontend/src/pages/Register.jsx frontend/src/context/AuthContext.jsx frontend/src/App.jsx
    git commit -m "feat(auth): login and register forms, session state context, and routes shielding"
    git push origin feature/auth-admin
    ```

---

### Day 5–6: Admin Panel UI & Problem Management API
*   **Task:** Enable admins to upload coding problems and manage test cases.
*   **Action Items:**
    1. Write backend REST API endpoints for admin problem modifications (Create problem, Add test cases, Delete problem) in problem controller.
    2. Build the Admin Dashboard UI panel in `frontend/src/pages/Admin.jsx` to allow creating problems, choosing difficulties, and writing hidden test inputs.
*   **Git Commands to run at end of Day 6:**
    ```bash
    git add backend/src/controllers/problemController.js frontend/src/pages/Admin.jsx
    git commit -m "feat(admin): problem uploading forms and test-case admin routes"
    git push origin feature/auth-admin
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
       git merge feature/auth-admin
       ```
    3. Test auth logins and Admin panel creation with Kunal and Dewansh's features. Resolve conflicts, verify build (`npm run build`), and push final production.
