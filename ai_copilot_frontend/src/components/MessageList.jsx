import React, { useEffect, useRef } from "react";

function MessageBubble({ role, content, timestamp }) {
  const isUser = role === "user";
  return (
    <div className={`message-row ${isUser ? "align-end" : "align-start"}`}>
      <div className={`message ${isUser ? "user" : "assistant"}`} role="listitem">
        {!isUser && <div className="avatar" aria-hidden="true">🤖</div>}
        <div className="message-content">
          <div className="message-text">{content}</div>
          {timestamp && (
            <div className="message-time" aria-label="message timestamp">
              {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export default function MessageList({ messages, loading, session }) {
  /** Displays chat messages for the active session with auto-scroll. */
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <div className="message-list-card">
      <div className="message-list-header">
        <div className="session-title">
          {session?.title || session?.name || "Conversation"}
        </div>
      </div>

      <div className="message-list" ref={scrollRef} role="list" aria-live="polite">
        {loading && (
          <div className="loading-block">
            <div className="spinner" aria-label="Loading messages" />
          </div>
        )}
        {!loading && (!messages || messages.length === 0) && (
          <div className="empty-state">Start the conversation by sending a message…</div>
        )}
        {!loading &&
          Array.isArray(messages) &&
          messages.map((m, idx) => (
            <MessageBubble
              key={`${idx}-${m?.timestamp || ""}`}
              role={m.role}
              content={m.content}
              timestamp={m.timestamp}
            />
          ))}
      </div>
    </div>
  );
}
