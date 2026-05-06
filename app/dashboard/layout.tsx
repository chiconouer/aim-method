"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Home Page",
    href: "/",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    label: "AI Model Store",
    href: "/dashboard/store",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
    ),
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  function handleSignOut() {
    window.location.href = "/";
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <button onClick={handleSignOut} className="flex flex-col leading-none text-left">
          <span className="text-xl font-bold tracking-tight">
            <span className="text-white">AIM</span>{" "}
            <span className="text-purple-400">Method</span>
          </span>
          <span className="text-gray-500 text-xs font-medium">@chiconouer</span>
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-5 flex flex-col gap-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const cls = `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            active
              ? "bg-purple-600/20 text-purple-400 border border-purple-500/20"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`;
          if (item.href === "/") {
            return (
              <button
                key={item.href}
                onClick={handleSignOut}
                className={`w-full ${cls}`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cls}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-5 border-t border-white/5">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:text-white hover:bg-white/5 transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-[#0d0d0d] border-r border-white/5 fixed top-0 left-0 h-screen z-40">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed top-0 left-0 h-screen w-56 bg-[#0d0d0d] border-r border-white/5 z-50 transform transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-56 min-w-0">

        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-4 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5">
          <button
            onClick={() => setOpen(true)}
            className="text-gray-400 hover:text-white transition-colors p-1"
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <button onClick={handleSignOut} className="flex flex-col leading-none items-center">
            <span className="text-xl font-bold tracking-tight">
              <span className="text-white">AIM</span>{" "}
              <span className="text-purple-400">Method</span>
            </span>
            <span className="text-gray-500 text-xs font-medium">@chiconouer</span>
          </button>
          <div className="w-8" />
        </div>

        {children}
      </div>
    </div>
  );
}
