import React from "react";
import "./App.css";
import Chat from "./components/Chat";

// PUBLIC_INTERFACE
function App() {
  /** Root application component. Renders the AI Copilot chat experience. */
  return (
    <div className="App">
      <Chat />
    </div>
  );
}

export default App;
