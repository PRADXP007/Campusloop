# CampusLoop Workspace Agent Guidelines

Welcome, agent! Before starting any work in this repository, please adhere to these environment preferences and configurations:

## User Environment & Preferences
- **Operating System:** macOS.
- **Default Browser:** **Safari** (Chrome is **NOT** installed).
  - *Note to agents:* Do not attempt to run Chrome-dependent browser automation tools or expect Chrome binary paths on this machine. If browser testing is needed, instruct the user to verify visually in Safari.

## Service Ports & Configuration
- **Frontend Client (Next.js 16):** Port `3000` (`http://localhost:3000`)
- **Backend API Server (Express/Mongoose):** Port `5005` (`http://localhost:5005`)
- **Free Claude Code Proxy:** Port `8082` (`http://localhost:8082`)
  - Configured in [free-claude-code](file:///Users/pradeeph/Documents/campus%20loop/free-claude-code). Start with:
    ```bash
    cd free-claude-code && uv run uvicorn server:app --host 0.0.0.0 --port 8082
    ```

## Coding Conventions
- **React 19 render purity:** Ensure all component render loops are pure. Keep functions calling `Math.random()` or accessing mutable ref values during render out of the React rendering path (move to helper functions or wrap in `useState` / `useEffect`).
