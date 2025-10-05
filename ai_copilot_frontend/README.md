# AI Copilot Frontend (React)

## Overview

This is the React frontend for the AI Copilot chat application. It provides a clean chat interface, renders conversation history, and calls the FastAPI backend over HTTP. The app uses Axios for HTTP requests and expects the backend to run on port 3001 by default.

The current API base URL is shown in the header badge at runtime, sourced from the REACT_APP_API_BASE_URL environment variable.

## Getting started

1) Install dependencies
- cd ai-copilot-chat-application-4348/ai_copilot_frontend
- npm install

2) Configure the backend URL (optional if you use the default http://localhost:3001)
- Create a .env file in this folder with:
  ```
  REACT_APP_API_BASE_URL=http://localhost:3001
  ```
- Restart the dev server after changing environment variables.

3) Start the dev server on port 3000
- npm start
- If port 3000 is busy, you can force it: PORT=3000 npm start
- Open http://localhost:3000

## How the frontend calls the backend

- All requests go through src/services/api.js. The Axios instance defaults to:
  - baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:3001"
- Public functions:
  - listSessions(): GET /api/sessions
  - createSession(): POST /api/sessions
  - getHistory(sessionId): GET /api/sessions/{session_id}/history
  - sendMessage({ session_id, message }): POST /api/chat
- Errors are normalized by toFriendlyError(), which surfaces CORS or network issues with a helpful message in the UI.

## Development tips

- After modifying REACT_APP_API_BASE_URL, always restart the dev server for changes to take effect.
- If the backend runs on a non‑default host or port, update REACT_APP_API_BASE_URL to match and ensure that origin is permitted by the backend’s CORS configuration (ALLOWED_ORIGINS).
- The UI will optimistically append your message to the list and then refresh history to show the assistant reply from the backend.

## Troubleshooting

- Network/CORS errors: In DevTools, check the failing request. If Axios reports a network error, verify:
  - The backend is reachable at REACT_APP_API_BASE_URL.
  - The exact frontend origin (scheme+host+port) is listed in the backend’s ALLOWED_ORIGINS.
- Backend health: http://localhost:3001/ should return {"status":"ok"}; Swagger UI at http://localhost:3001/docs
- Missing GEMINI_API_KEY: The backend returns a clear 500 error if the key is not set. Add GEMINI_API_KEY to the backend .env and restart the backend.

## Scripts

- npm start: Start the dev server (port 3000 by default).
- npm test: Run tests in watch mode.
- npm run build: Production build to the build/ directory.

## Notes on integration

The frontend assumes the backend API contract described by the backend OpenAPI schema. If you regenerate or change the backend schema, ensure frontend calls (paths and payload shapes) remain compatible.
