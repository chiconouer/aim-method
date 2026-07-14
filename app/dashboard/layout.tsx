"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AIMAssistant } from "@/components/AIMAssistant";
import {
  AIMAssistantProvider,
  useAIMAssistant,
} from "@/components/AIMAssistantContext";
import { DISCORD_INVITE_URL } from "@/lib/discord";

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
  {
    label: "Certificate",
    href: "/dashboard/certificate",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="9" r="5"/>
        <polyline points="8.5 13 7 21 12 18 17 21 15.5 13"/>
      </svg>
    ),
  },
];

const ChatIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
);

// Official Discord "Clyde" logo simplified to a solid fill. Sized to
// 18×18 so it visually matches the stroked line-art icons above in
// the sidebar without looking heavier.
const DiscordIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

// Little arrow-up-right glyph so external nav items are visually
// distinguishable from internal Links at a glance. Reused for the
// Discord sidebar item (opens in new tab).
const ExternalLinkIcon = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AIMAssistantProvider>
      <DashboardLayoutBody>{children}</DashboardLayoutBody>
    </AIMAssistantProvider>
  );
}

function DashboardLayoutBody({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { openExpanded } = useAIMAssistant();

  function handleSignOut() {
    window.location.href = "/";
  }

  function handleOpenAssistant() {
    openExpanded();
    setOpen(false);
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

        {/* Discord Community — external link, opens in new tab so the
            student doesn't lose their dashboard state. Placed before
            AIM Assistant per the retention plan (this is the CTA we
            want them to hit most often after "Continue lesson"). The
            ExternalLinkIcon on the right makes the target-blank
            behavior obvious without a tooltip. */}
        <a
          href={DISCORD_INVITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          {DiscordIcon}
          <span className="flex-1">Discord Community</span>
          <span className="text-gray-600" aria-hidden="true">
            {ExternalLinkIcon}
          </span>
        </a>

        {/* AIM Assistant — opens chat in expanded mode */}
        <button
          type="button"
          onClick={handleOpenAssistant}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          {ChatIcon}
          AIM Assistant
        </button>
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

      {/* Floating AI support chat — visible on all /dashboard/* pages */}
      <AIMAssistant />
    </div>
  );
}
