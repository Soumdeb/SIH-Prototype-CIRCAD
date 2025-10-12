import React, { useState } from "react";
import axios from "axios";

export default function Login() {
  const [u, setU] = useState(""), [p, setP] = useState("");
  const submit = async e => {
    e.preventDefault();
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/auth/login/", { username:u, password:p });
      localStorage.setItem("accessToken", res.data.access);
      alert("Login successful!");
      window.location.href="/dashboard";
    } catch { alert("Invalid credentials"); }
  };
  return (<form onSubmit={submit} className="p-8 space-y-4">
    <input placeholder="Username" value={u} onChange={e=>setU(e.target.value)} className="border p-2"/>
    <input placeholder="Password" type="password" value={p} onChange={e=>setP(e.target.value)} className="border p-2"/>
    <button className="bg-blue-600 text-white px-4 py-2 rounded">Login</button>
  </form>);
}
