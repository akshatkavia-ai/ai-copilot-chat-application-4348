import React, { useCallback, useState } from "react";

// PUBLIC_INTERFACE
export default function MessageInput({ onSend, disabled }) {
  /** Input bar for composing and sending a message. */
  const [text, setText] = useState("");

  const handleSend = useCallback(() => {
    const t = text.trim();
    if (!t || disabled) return;
    onSend(t);
    setText("");
  }, [text, disabled, onSend]);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="input-bar" role="form" aria-label="Message input form">
      <textarea
        className="input"
        placeholder="Type a message…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        aria-label="Message text input"
        disabled={disabled}
      />
      <button
        className="btn btn-primary send-btn"
        onClick={handleSend}
        disabled={disabled || text.trim().length === 0}
        aria-label="Send message"
        title="Send message"
      >
        {disabled ? <span className="spinner small" aria-hidden="true" /> : "Send"}
      </button>
    </div>
  );
}
