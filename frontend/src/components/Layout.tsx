import { Outlet, NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, ScanSearch, History, FileText, Settings, Shield, Bell, Search, HelpCircle } from "lucide-react";

const NAV = [
  { to: "/",            label: "Dashboard",     icon: LayoutDashboard },
  { to: "/analysis",   label: "Análisis",       icon: ScanSearch },
  { to: "/history",    label: "Historial",      icon: History },
  { to: "/reports",    label: "Reportes",       icon: FileText },
  { to: "/settings",   label: "Configuración",  icon: Settings },
];

export default function Layout() {
  const { pathname } = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-surface-container-low border-r border-outline-variant">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-outline-variant">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface leading-tight">Enterprise Plan</p>
            <p className="text-xs text-on-surface-variant">AI Document Platform</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon }) => {
            const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 hover:translate-x-0.5 ${
                  isActive
                    ? "bg-secondary-container text-primary font-semibold"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "fill-primary/10" : ""}`} />
                {label}
              </NavLink>
            );
          })}
        </nav>

        {/* Storage + Upgrade */}
        <div className="p-3 border-t border-outline-variant">
          <div className="bg-surface-container-high rounded-xl p-3 mb-2">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Almacenamiento</p>
            <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden mb-1">
              <div className="h-full bg-tertiary-container rounded-full" style={{ width: "65%" }} />
            </div>
            <p className="text-xs text-on-surface-variant">65% utilizado</p>
          </div>
          <button className="w-full py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity">
            Upgrade Plan
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-6 bg-surface-container-lowest border-b border-outline-variant flex-shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-base font-bold text-primary">PaperGuard</span>
            <div className="relative hidden lg:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                className="pl-9 pr-4 py-1.5 bg-surface-container border border-outline-variant rounded-full text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/20 w-60"
                placeholder="Buscar documentos..."
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-primary text-sm font-medium hover:bg-surface-container rounded-full transition-colors">
              <HelpCircle className="w-4 h-4" /> Soporte
            </button>
            <button className="p-1.5 text-on-surface-variant hover:text-primary transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold select-none">
              PG
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
