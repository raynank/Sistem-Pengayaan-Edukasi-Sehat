"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import api from "@/utils/api";
import { ShieldAlert, AlertOctagon, ArrowLeft, LogIn } from "lucide-react";

export default function HoldOn() {
  const router = useRouter();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }
    setIsLoggedIn(true);
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await api.get("/tracker/status");
      setStatus(res.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        Cookies.remove("token");
        setIsLoggedIn(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRelapse = async () => {
    // Jika user sudah login, catat ke database
    if (isLoggedIn) {
      try {
        await api.post("/tracker/relapse");
      } catch (error) {
        console.error("Relapse failed", error);
      }
    }
    
    // Apapun status login-nya, tutup modal dan putar video peringatan
    setShowConfirmModal(false);
    window.location.href = "/asset/video.mp4";
  };

  const handleBackToSafety = () => {
    window.location.href = "/asset/hadits.mp4";
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-teal-600 font-semibold animate-pulse bg-slate-900">Memuat data...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-900/30 rounded-full blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-900/30 rounded-full blur-3xl opacity-50"></div>
      </div>

      {/* Login Button (Top Right) for unauthenticated users */}
      {!isLoggedIn && (
        <div className="absolute top-6 right-6 z-20">
          <Link
            href="/login"
            className="flex items-center gap-2 bg-teal-500/20 hover:bg-teal-500/40 text-teal-300 px-4 py-2 rounded-full font-medium transition-colors border border-teal-500/30"
          >
            <LogIn size={18} />
            Login
          </Link>
        </div>
      )}

      <div className="max-w-2xl w-full bg-slate-800/80 backdrop-blur-md p-10 rounded-3xl shadow-2xl border border-slate-700 relative z-10 text-center">
        <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert size={40} />
        </div>

        <h1 className="text-4xl font-black text-white mb-4 tracking-tight">Tunggu Sebentar!</h1>

        <div className="bg-slate-700/50 rounded-2xl p-6 mb-8 border border-slate-600">
          {isLoggedIn && status ? (
            <p className="text-xl text-slate-300 leading-relaxed">
              Ingat perjuanganmu sudah mencapai <span className="text-3xl font-bold text-teal-400 mx-2">{status.current_streak_days}</span> hari!
            </p>
          ) : (
            <p className="text-xl text-slate-300 leading-relaxed">
              Ingat komitmenmu! Jangan biarkan godaan ini menghancurkan <span className="text-teal-400 font-bold">harapanmu</span>.
            </p>
          )}
          <p className="text-slate-400 mt-3 text-sm">
            Tarik napas dalam-dalam. Jangan biarkan godaan sesaat menghancurkan apa yang telah Anda bangun. Anda jauh lebih kuat dari dorongan ini.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button
            onClick={handleBackToSafety}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-slate-900 bg-teal-400 hover:bg-teal-300 transition-colors shadow-lg shadow-teal-500/30"
          >
            <ArrowLeft size={20} />
            Kembali ke Tempat Aman
          </button>

          <button
            onClick={() => setShowConfirmModal(true)}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white bg-slate-700 hover:bg-red-600 transition-colors border border-slate-600 hover:border-red-500"
          >
            <AlertOctagon size={20} />
            Saya Gagal
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-3">Peringatan Terakhir</h3>
            <p className="text-slate-400 mb-8">
              Apakah kamu yakin ingin mereset progresmu? Semua perjuangan selama {status?.current_streak_days} hari akan kembali menjadi 0.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-xl font-semibold text-white bg-slate-600 hover:bg-slate-500 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleRelapse}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/50 transition-colors"
              >
                Ya, Reset Progres
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
