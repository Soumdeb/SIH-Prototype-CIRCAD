// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2500,
          style: {
            background: "rgba(15,23,42,0.8)",
            backdropFilter: "blur(10px)",
            color: "#e2e8f0",
            border: "1px solid rgba(6,182,212,0.25)",
            fontSize: "15px",
            borderRadius: "10px",
            boxShadow: "0 0 25px rgba(6,182,212,0.25)",
          },
          success: {
            iconTheme: {
              primary: "#06b6d4",
              secondary: "#fff",
            },
          },
        }}
      />
  </React.StrictMode>
);
