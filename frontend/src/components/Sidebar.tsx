"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, List, BarChart3, Trophy } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 hidden md:flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
          <div className="text-3xl font-black tracking-tighter">
            <span className="text-white">PWC</span>
            <span className="text-lime-400 drop-shadow-[0_0_8px_rgba(163,230,53,0.5)]">fx</span>
          </div>
        </Link>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        <NavItem href="/" icon={<LayoutDashboard size={20} />} label="Overview" active={pathname === "/"} />
        <NavItem href="/trades" icon={<List size={20} />} label="Trades" active={pathname === "/trades"} />
        <NavItem href="/analytics" icon={<BarChart3 size={20} />} label="Analytics" active={pathname === "/analytics"} />
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
