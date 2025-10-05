import axios from "axios";

const DEFAULT_BASE_URL = "http://localhost:3001";
const baseURL = process.env.REACT_APP_API_BASE_URL || DEFAULT_BASE_URL;

// Create a shared axios instance
const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// PUBLIC_INTERFACE
export function getApiBaseUrl() {
  /** Returns the configured API base URL used by the frontend. */
  return baseURL;
}

// PUBLIC_INTERFACE
export async function listSessions() {
  /** Fetches list of chat sessions from the backend. */
  const { data } = await api.get("/api/sessions");
  return data;
}

// PUBLIC_INTERFACE
export async function createSession() {
  /** Creates a new chat session and returns the session object. */
  const { data } = await api.post("/api/sessions");
  return data;
}

// PUBLIC_INTERFACE
export async function getHistory(sessionId) {
  /** Retrieves message history for the given sessionId. */
  if (!sessionId) throw new Error("sessionId is required");
  const { data } = await api.get(`/api/sessions/${encodeURIComponent(sessionId)}/history`);
  return data;
}

// PUBLIC_INTERFACE
export async function sendMessage({ session_id, message }) {
  /** Sends a message for a given session. Returns backend response. */
  if (!session_id) throw new Error("session_id is required");
  if (!message || !message.trim()) throw new Error("message cannot be empty");
  const { data } = await api.post("/api/chat", { session_id, message });
  return data;
}

/**
 * Utility to derive a user-friendly error message, surfacing CORS/network issues.
 */
export function toFriendlyError(err) {
  if (!err) return "Unknown error";
  if (err.response) {
    // Backend returned a response
    const status = err.response.status;
    const detail =
      err.response.data?.detail ||
      err.response.data?.message ||
      err.message ||
      "Request failed";
    return `Error ${status}: ${detail}`;
  }
  // No response: network or CORS
  if (err.code === "ERR_NETWORK" || err.message?.toLowerCase().includes("network")) {
    return "Network error (possible CORS issue). Verify the API URL and CORS settings on the backend.";
  }
  return err.message || "Unexpected error";
}

export default api;
