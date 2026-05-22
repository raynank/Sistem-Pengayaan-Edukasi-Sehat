"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/utils/api";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/register", { email, password });
      router.push("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl shadow-teal-100/50 border border-teal-50">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-teal-800 mb-2">Mulai Perjalanan</h1>
          <p className="text-slate-500 text-sm">Daftar untuk membuat tracker komitmen Anda</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg mb-4 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all bg-slate-50 focus:bg-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all bg-slate-50 focus:bg-white"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-lg shadow-teal-600/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Memproses..." : "Daftar Akun"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-teal-600 font-semibold hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
