"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Wallet, 
  PieChart as PieChartIcon, 
  Settings,
  TrendingUp,
  Calendar,
  Globe
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 hidden md:flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-white hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-zinc-950" />
          </div>
          FXDashboard
        </Link>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        <NavItem href="/" icon={<LayoutDashboard size={20} />} label="Overview" active={pathname === "/"} />
        <NavItem href="/trades" icon={<Wallet size={20} />} label="Trade Log" active={pathname === "/trades"} />
        <NavItem href="/calendar" icon={<Calendar size={20} />} label="Calendar" active={pathname === "/calendar"} />
        <NavItem href="/summaries" icon={<TrendingUp size={20} />} label="Summaries" active={pathname === "/summaries"} />
        <NavItem href="/reports" icon={<PieChartIcon size={20} />} label="Detailed Reports" active={pathname === "/reports"} />
        <NavItem href="/news" icon={<Globe size={20} />} label="News Calendar" active={pathname === "/news"} />
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <NavItem href="#" icon={<Settings size={20} />} label="Settings" />
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label, active = false }: { href: string, icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <Link href={href} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
      active 
        ? "bg-zinc-800 text-white font-medium" 
        : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
    }`}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}
