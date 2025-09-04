"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [role, setRole] = useState("Developer");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    // For demo: Simple role-based password system
    const rolePasswords: any = {
      Admin: "admin123",
      Manager: "manager123",
      Developer: "dev123",
    };

    if (password === rolePasswords[role]) {
      localStorage.setItem("userRole", role);
      router.push("/dashboard");
    } else {
      alert("Invalid password!");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-emerald-50 to-green-100 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg w-96">
        <h1 className="text-xl font-bold mb-4 text-center">Login</h1>

        <label className="block mb-2 text-sm">Select Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full p-2 mb-4 border rounded-md"
        >
          <option>Admin</option>
          <option>Manager</option>
          <option>Developer</option>
        </select>

        <label className="block mb-2 text-sm">Password</label>
        <input
          type="password"
          className="w-full p-2 mb-4 border rounded-md"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700 transition"
        >
          Login
        </button>
      </div>
    </div>
  );
}
