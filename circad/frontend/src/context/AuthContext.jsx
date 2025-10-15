// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import toast from "react-hot-toast";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("accessToken")
  );
  const [username, setUsername] = useState(localStorage.getItem("username") || "");

  useEffect(() => {
    const sync = () => {
      setIsAuthenticated(!!localStorage.getItem("accessToken"));
      setUsername(localStorage.getItem("username") || "");
    };
    window.addEventListener("storage", sync);
    window.addEventListener("auth-logout", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("auth-logout", sync);
    };
  }, []);

  const login = async (username, password) => {
    const res = await axiosClient.post("login/", { username, password });
    localStorage.setItem("accessToken", res.data.access);
    localStorage.setItem("refreshToken", res.data.refresh);
    localStorage.setItem("username", username);
    setIsAuthenticated(true);
    setUsername(username);
    toast.success(`Welcome, ${username}!`);
  };

  const register = async (username, password) => {
    await axiosClient.post("register/", { username, password });
    await login(username, password);
  };

  const logout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setUsername("");
    toast("Logged out 👋");
    window.dispatchEvent(new CustomEvent("auth-logout"));
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
