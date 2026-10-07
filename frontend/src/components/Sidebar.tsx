"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Wallet,
  PieChart as PieChartIcon, 
  Trophy,
  TrendingUp,
  Calendar,
  Globe
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 hidden md:flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <img 
            src={`${process.env.NODE_ENV === "production" ? "/FXDashboard" : ""}/icons/logo.jpg?v=2`}
            alt="PWC FX" 
            className="w-auto h-12 object-contain rounded"
          />
        </Link>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        <NavItem href="/" icon={<LayoutDashboard size={20} />} label="Overview" active={pathname === "/"} />
        <NavItem href="/trades" icon={<Wallet size={20} />} label="Trades" active={pathname === "/trades"} />
        <NavItem href="/calendar" icon={<Calendar size={20} />} label="Calendar" active={pathname === "/calendar"} />
        <NavItem href="/summaries" icon={<TrendingUp size={20} />} label="Summaries" active={pathname === "/summaries"} />
        <NavItem href="/reports" icon={<PieChartIcon size={20} />} label="Reports" active={pathname === "/reports"} />
        <NavItem href="/news" icon={<Globe size={20} />} label="News" active={pathname === "/news"} />
        <NavItem href="/prop" icon={<Trophy size={20} />} label="Prop" active={pathname === "/prop"} />
      </nav>
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
