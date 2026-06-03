"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/utils/api";
import { AlertCircle, LogOut, CheckCircle2, ShieldAlert } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRelapseModal, setShowRelapseModal] = useState(false);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchStatus();
  }, [router]);

  const fetchStatus = async () => {
    try {
      const res = await api.get("/tracker/status");
      setStatus(res.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        Cookies.remove("token");
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Cookies.remove("token");
    router.push("/login");
  };

  const handleRelapse = async () => {
    try {
      await api.post("/tracker/relapse");
      setShowRelapseModal(false);
      fetchStatus();
    } catch (error) {
      console.error("Relapse failed", error);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-teal-600 font-semibold text-lg animate-pulse">Memuat data...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center pt-20 px-4">
      {/* Header */}
      <header className="w-full max-w-4xl flex justify-between items-center mb-16">
        <h1 className="text-2xl font-bold text-teal-800 flex items-center gap-2">
          <CheckCircle2 className="text-teal-500" />
          Internet Sehat
        </h1>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors bg-white px-4 py-2 rounded-full shadow-sm"
        >
          <LogOut size={18} /> Logout
        </button>
      </header>

      {/* Main Tracker Card */}
      <main className="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-teal-100/50 p-10 flex flex-col items-center border border-teal-50 relative overflow-hidden">
        {/* Decor */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-teal-50 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-100 rounded-full blur-3xl opacity-50"></div>

        <p className="text-teal-600 font-medium tracking-wide uppercase text-sm mb-2 relative z-10">
          Perjalanan Anda
        </p>
        
        <div className="flex items-baseline justify-center mb-6 relative z-10">
          <span className="text-8xl font-black text-slate-800 tracking-tighter">
            {status?.current_streak_days || 0}
          </span>
          <span className="text-2xl font-medium text-slate-400 ml-2">Hari</span>
        </div>

        <div className="w-full bg-teal-50 rounded-xl p-4 flex justify-between items-center mb-8 relative z-10">
          <div className="flex flex-col">
            <span className="text-xs text-teal-600 uppercase font-semibold">Rekor Terlama</span>
            <span className="text-xl font-bold text-teal-900">{status?.longest_streak || 0} Hari</span>
          </div>
          <div className="h-10 w-px bg-teal-200"></div>
          <div className="flex flex-col text-right">
            <span className="text-xs text-teal-600 uppercase font-semibold">Mulai Sejak</span>
            <span className="text-sm font-medium text-teal-900">
              {status?.start_date ? new Date(status.start_date).toLocaleDateString('id-ID') : '-'}
            </span>
          </div>
        </div>

        <button 
          onClick={() => setShowRelapseModal(true)}
          className="relative z-10 flex items-center gap-2 text-sm text-red-500 hover:text-white hover:bg-red-500 transition-colors bg-red-50 py-2 px-6 rounded-full font-medium shadow-sm"
        >
          <AlertCircle size={16} />
          Saya Gagal (Reset Tracker)
        </button>
      </main>

      {/* Relapse Modal */}
      {showRelapseModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Konfirmasi Reset</h3>
            <p className="text-slate-600 mb-6 text-sm">
              Apakah Anda yakin ingin mereset tracker ke hari ke-0? Ini akan menghanguskan rekor <strong>{status?.current_streak_days} hari</strong> Anda saat ini.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowRelapseModal(false)}
                className="flex-1 py-2 rounded-lg font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleRelapse}
                className="flex-1 py-2 rounded-lg font-medium text-white bg-red-500 hover:bg-red-600 shadow-md transition-colors"
              >
                Ya, Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer / Navbar Bawah */}
      <footer className="mt-auto py-8 w-full text-center">
        <div className="inline-flex flex-col items-center justify-center p-5 rounded-2xl bg-white/60 backdrop-blur-md border border-teal-100 shadow-sm transition-all hover:shadow-md hover:bg-white/80">
          <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
            Dibuat dengan <span className="text-red-500 animate-pulse">♥</span> oleh kelompok kami
          </p>
          <div className="flex gap-3 mt-3 text-teal-800 font-semibold">
            <a 
              href="https://instagram.com/raynan.k" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-teal-50 border border-teal-100 px-4 py-1.5 rounded-full shadow-sm text-sm hover:bg-teal-100 transition-colors cursor-pointer"
            >
              Raynan
            </a>
            
            <a 
              href="https://www.instagram.com/ukasyhhh_/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-teal-50 border border-teal-100 px-4 py-1.5 rounded-full shadow-sm text-sm hover:bg-teal-100 transition-colors cursor-pointer"
            >
              Ukasyah
            </a>
            
            <a 
              href="https://www.instagram.com/rafzyaff/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-teal-50 border border-teal-100 px-4 py-1.5 rounded-full shadow-sm text-sm hover:bg-teal-100 transition-colors cursor-pointer"
            >
              Rafa Zia
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
