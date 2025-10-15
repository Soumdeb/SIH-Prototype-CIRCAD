// src/pages/Register.jsx
import React, { useState } from "react";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ username: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return alert("Passwords do not match!");
    await register(form.username, form.password);
    navigate("/home", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 relative text-white">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        className="absolute w-[600px] h-[600px] bg-cyan-500/25 blur-[180px] rounded-full"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-[#0f172a]/85 backdrop-blur-2xl border border-cyan-400/40 shadow-[0_0_40px_rgba(6,182,212,0.25)] rounded-3xl p-8 w-[90%] max-w-md"
      >
        <h1 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Create an Account
        </h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={(e) =>
              setForm({ ...form, username: e.target.value })
            }
            className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-cyan-400 text-white"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-cyan-400 text-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2 text-gray-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <input
            type="password"
            placeholder="Confirm Password"
            value={form.confirm}
            onChange={(e) =>
              setForm({ ...form, confirm: e.target.value })
            }
            className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 focus:ring-2 focus:ring-cyan-400 text-white"
          />
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium flex items-center justify-center gap-2 transition shadow-md hover:shadow-cyan-500/30"
          >
            <UserPlus size={18} /> Sign Up
          </motion.button>
          <p className="text-center text-sm text-gray-300">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              type="button"
              className="text-cyan-400 hover:underline"
            >
              Log in
            </button>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
