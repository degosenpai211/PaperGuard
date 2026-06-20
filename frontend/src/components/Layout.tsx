import { Outlet, Link, useLocation } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export default function Layout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-gray-900 text-lg">
            <ShieldCheck className="w-6 h-6 text-brand" />
            PaperGuard
          </Link>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
            Copiloto editorial · Hackathon Latam
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-100">
        PaperGuard usa IA (Claude Sonnet) para detectar señales de riesgo. Las alertas requieren revisión humana final.
      </footer>
    </div>
  );
}
