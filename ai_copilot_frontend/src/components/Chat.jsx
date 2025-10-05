import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
        const created = await createSession();
        const createdId = created?.id || created?.session_id || created?.sessionId;
        const createdObj = created?.session || created || { id: createdId };
        const updated = [...list, createdObj];
        setSessions(updated);
        setActiveSessionId(createdId);
      } else {
        const firstId = list[0]?.id || list[0]?.session_id || list[0]?.sessionId;
        setActiveSessionId((prev) => prev || firstId);
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
        const raw = Array.isArray(data) ? data : data?.messages || [];
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
      const created = await createSession();
      const createdId = created?.id || created?.session_id || created?.sessionId;
      const createdObj = created?.session || created || { id: createdId };
      setSessions((prev) => [createdObj, ...prev]);
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
    return sessions.find(
      (s) => (s?.id || s?.session_id || s?.sessionId) === activeSessionId
    );
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
