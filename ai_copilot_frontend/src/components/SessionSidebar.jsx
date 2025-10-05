import React from "react";

// PUBLIC_INTERFACE
export default function SessionSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  loading,
}) {
  /** Renders the sessions list and controls to create/select sessions. */
  return (
    <div className="sidebar-inner">
      <div className="sidebar-header">
        <h2>Sessions</h2>
        <button
          className="btn btn-primary"
          onClick={onCreateSession}
          disabled={loading}
          aria-label="Create new session"
          title="Create new session"
        >
          + New
        </button>
      </div>

      <div className="session-list" role="list">
        {loading && (
          <div className="loading-block">
            <div className="spinner" aria-label="Loading sessions" />
          </div>
        )}

        {!loading && (!sessions || sessions.length === 0) && (
          <div className="empty-state">No sessions yet</div>
        )}

        {!loading &&
          Array.isArray(sessions) &&
          sessions.map((s, idx) => {
            const id = s?.id || s?.session_id || s?.sessionId || `session-${idx}`;
            const label =
              s?.title || s?.name || (id ? `Session ${id.toString().slice(0, 6)}` : `Session ${idx + 1}`);
            const active = id === activeSessionId;
            return (
              <button
                key={id}
                className={`session-item ${active ? "active" : ""}`}
                onClick={() => onSelectSession(id)}
                role="listitem"
                aria-current={active ? "true" : "false"}
                aria-label={`Open ${label}`}
                title={label}
              >
                <span className="session-dot" aria-hidden="true" />
                <span className="session-label">{label}</span>
              </button>
            );
          })}
      </div>
    </div>
  );
}
