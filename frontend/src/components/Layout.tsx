import { Outlet, Link, useLocation } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export default function Layout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 font-bold text-gray-900 text-xl hover:opacity-80 transition-opacity">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span>PaperGuard</span>
          </Link>
          <span className="text-xs font-medium text-gray-500 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
            ✨ Copiloto editorial · Hackathon Latam
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
        <Outlet />
      </main>

      <footer className="text-center text-xs text-gray-500 py-6 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <p>PaperGuard usa IA (Claude Sonnet) para detectar señales de riesgo. Las alertas requieren revisión humana final.</p>
      </footer>
    </div>
  );
}
