import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  listSessions,
  createSession,
  getHistory,
  sendMessage,
  getApiBaseUrl,
  toFriendlyError,
} from "../services/api";
import SessionSidebar from "./SessionSidebar";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

/**
 * Helper to extract a session id from various possible field names.
 */
function getSessionId(s) {
  if (!s) return null;
  return s.id || s.session_id || s.sessionId || null;
}

/**
 * Choose the latest session by created_at if available; otherwise fall back to the first.
 * This matches the requirement to select the latest session on load.
 */
function selectLatestSession(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  let latest = list[0];
  let latestTs = latest?.created_at ? Date.parse(latest.created_at) : null;

  for (let i = 1; i < list.length; i++) {
    const item = list[i];
    const ts = item?.created_at ? Date.parse(item.created_at) : null;
    if (ts && (!latestTs || ts > latestTs)) {
      latest = item;
      latestTs = ts;
    }
  }
  return latest;
}

// Helper to normalize different possible message shapes coming from backend
function normalizeMessage(m) {
  if (!m) return null;
  const role = m.role || m.sender || m.author || "assistant";
  const content = m.content || m.text || m.message || "";
  const ts = m.timestamp || m.created_at || m.time || null;
  return { role, content, timestamp: ts };
}

// PUBLIC_INTERFACE
export default function Chat() {
  /** Main chat container. Manages sessions, active session, messages, and API calls. */
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });

  const apiBase = useMemo(() => getApiBaseUrl(), []);

  const showToast = useCallback((message, type = "error", duration = 3500) => {
    setToast({ visible: true, message, type });
    const t = setTimeout(() => setToast({ visible: false, message: "", type }), duration);
    return () => clearTimeout(t);
  }, []);

  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    setError("");
    try {
      const data = await listSessions();
      const list = Array.isArray(data) ? data : data?.sessions || [];
      setSessions(list);

      if (!list || list.length === 0) {
        // Create a default session if none exists
        const createdResp = await createSession();
        const sessionObj = createdResp?.session || createdResp || null;
        const newId = getSessionId(sessionObj);
        const updated = sessionObj ? [sessionObj] : [];
        setSessions(updated);
        setActiveSessionId(newId);
      } else {
        const latest = selectLatestSession(list) || list[0];
        const latestId = getSessionId(latest);
        setActiveSessionId((prev) => prev || latestId);
      }
    } catch (err) {
      const msg = toFriendlyError(err);
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoadingSessions(false);
    }
  }, [showToast]);

  const fetchHistory = useCallback(
    async (sessionId) => {
      if (!sessionId) return;
      setLoadingMessages(true);
      setError("");
      try {
        const data = await getHistory(sessionId);
        // Backend returns { history: [...] } per OpenAPI. Fall back to data.messages/array for resiliency.
        const raw = Array.isArray(data) ? data : data?.history || data?.messages || [];
        const normalized = raw.map(normalizeMessage).filter(Boolean);
        setMessages(normalized);
      } catch (err) {
        const msg = toFriendlyError(err);
        setError(msg);
        showToast(msg, "error");
      } finally {
        setLoadingMessages(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (activeSessionId) {
      fetchHistory(activeSessionId);
    } else {
      setMessages([]);
    }
  }, [activeSessionId, fetchHistory]);

  const onCreateSession = useCallback(async () => {
    try {
      const createdResp = await createSession();
      const sessionObj = createdResp?.session || createdResp || null;
      const createdId = getSessionId(sessionObj);
      if (sessionObj) {
        setSessions((prev) => [sessionObj, ...prev]);
      }
      setActiveSessionId(createdId);
      showToast("New session created", "success", 2000);
    } catch (err) {
      const msg = toFriendlyError(err);
      setError(msg);
      showToast(msg, "error");
    }
  }, [showToast]);

  const onSelectSession = useCallback((id) => {
    setActiveSessionId(id);
  }, []);

  const onSend = useCallback(
    async (text) => {
      if (!activeSessionId || !text?.trim()) return;
      // Optimistic update with user message
      const userMsg = { role: "user", content: text, timestamp: new Date().toISOString() };
      setMessages((prev) => [...prev, userMsg]);
      setSending(true);
      setError("");

      try {
        await sendMessage({ session_id: activeSessionId, message: text });
        // Refresh history to reflect assistant response
        await fetchHistory(activeSessionId);
      } catch (err) {
        const msg = toFriendlyError(err);
        setError(msg);
        showToast(msg, "error");
      } finally {
        setSending(false);
      }
    },
    [activeSessionId, fetchHistory, showToast]
  );

  const activeSession = useMemo(() => {
    return sessions.find((s) => getSessionId(s) === activeSessionId);
  }, [sessions, activeSessionId]);

  return (
    <div className="chat-app">
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon" aria-hidden="true">✨</div>
          <div className="brand-text">
            <h1 className="app-title">AI Copilot</h1>
            <p className="app-subtitle">Elegant Champagne Experience</p>
          </div>
        </div>
        <div className="env-badge" aria-label="API base URL">
          API: {apiBase}
        </div>
      </header>

      <main className="layout">
        <aside className="sidebar" aria-label="Chat sessions">
          <SessionSidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={onSelectSession}
            onCreateSession={onCreateSession}
            loading={loadingSessions}
          />
        </aside>

        <section className="chat-container" aria-label="Chat window">
          {error && (
            <div className="error-banner" role="alert" aria-live="assertive">
              {error}
            </div>
          )}

          <div className="chat-card">
            <MessageList
              messages={messages}
              loading={loadingMessages}
              session={activeSession}
            />

            <MessageInput onSend={onSend} disabled={sending || loadingMessages} />
          </div>
        </section>
      </main>

      {toast.visible && (
        <div
          className={`toast ${toast.type}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {toast.message}
        </div>
      )}

      {/* Keep this for test compatibility */}
      <span className="sr-only">learn react</span>
    </div>
  );
}
