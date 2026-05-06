"use client";
import { useState } from "react";
import Link from "next/link";

type Rarity = "all" | "common" | "rare" | "epic" | "legendary";

const models = [
  { id: 1, rarity: "common" as const },
  { id: 2, rarity: "common" as const },
  { id: 3, rarity: "rare" as const },
  { id: 4, rarity: "rare" as const },
  { id: 5, rarity: "epic" as const },
  { id: 6, rarity: "epic" as const },
  { id: 7, rarity: "legendary" as const },
  { id: 8, rarity: "legendary" as const },
];

const rarityConfig = {
  common: {
    label: "Common",
    badge: "bg-[#374151] text-[#d1d5db]",
    border: "border-[#4b5563]",
    glow: "",
    bg: "from-[#1f2937] to-[#111827]",
    text: "text-[#9ca3af]",
    price: "text-[#6b7280]",
    filterText: "text-white",
    filterBorder: "border-[#4b5563]",
    filterActive: "bg-[#374151] text-white border-[#4b5563]",
  },
  rare: {
    label: "Rare",
    badge: "bg-[#1d4ed8] text-[#bfdbfe]",
    border: "border-[#2563eb]",
    glow: "shadow-[0_0_16px_rgba(59,130,246,0.2)]",
    bg: "from-[#1e3a5f] to-[#0f172a]",
    text: "text-[#60a5fa]",
    price: "text-[#3b82f6]",
    filterText: "text-[#60a5fa]",
    filterBorder: "border-[#2563eb]",
    filterActive: "bg-[#1d4ed8] text-white border-[#1d4ed8]",
  },
  epic: {
    label: "Epic",
    badge: "bg-[#6d28d9] text-[#ddd6fe]",
    border: "border-[#7c3aed]",
    glow: "shadow-[0_0_20px_rgba(124,58,237,0.25)]",
    bg: "from-[#2e1065] to-[#0f0a1e]",
    text: "text-[#a78bfa]",
    price: "text-[#8b5cf6]",
    filterText: "text-[#a78bfa]",
    filterBorder: "border-[#7c3aed]",
    filterActive: "bg-[#6d28d9] text-white border-[#6d28d9]",
  },
  legendary: {
    label: "Legendary",
    badge: "bg-[#b45309] text-[#fde68a]",
    border: "border-[#f59e0b]",
    glow: "shadow-[0_0_24px_rgba(245,158,11,0.3)]",
    bg: "from-[#3d1f00] to-[#1c0f00]",
    text: "text-[#fbbf24]",
    price: "text-[#f59e0b]",
    filterText: "text-[#fbbf24]",
    filterBorder: "border-[#b45309]",
    filterActive: "bg-[#b45309] text-white border-[#b45309]",
  },
};

export default function StorePage() {
  const [active, setActive] = useState<Rarity>("all");

  const filtered = active === "all" ? models : models.filter((m) => m.rarity === active);

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-12">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block mb-4 px-3 py-1 rounded-full text-xs font-medium tracking-widest uppercase bg-purple-900/30 border border-purple-700/40 text-purple-400">
            AIM Method — Exclusive
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
            AI Model <span className="text-purple-400">Store</span>
          </h1>
          <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            Each model is sold to one student only — once it&apos;s gone, it&apos;s gone.
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-2 mb-8 md:flex md:justify-center md:gap-3">
          <button
            onClick={() => setActive("all")}
            className={`col-span-2 px-5 py-2 rounded-full text-sm font-bold border-2 transition-all ${
              active === "all"
                ? "bg-purple-700 text-white border-purple-700"
                : "text-purple-400 border-purple-700 bg-transparent"
            }`}
          >
            All Models
          </button>
          {(["common", "rare", "epic", "legendary"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setActive(r)}
              className={`px-5 py-2 rounded-full text-sm font-bold border-2 transition-all capitalize ${
                active === r
                  ? rarityConfig[r].filterActive
                  : `${rarityConfig[r].filterText} ${rarityConfig[r].filterBorder} bg-transparent`
              }`}
            >
              {rarityConfig[r].label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filtered.map((model) => {
            const cfg = rarityConfig[model.rarity];
            return (
              <div
                key={model.id}
                className={`rounded-xl overflow-hidden border-2 bg-[#111] relative transition-transform hover:-translate-y-1 ${cfg.border} ${cfg.glow}`}
              >
                {/* Card image area */}
                <div className={`w-full aspect-[3/4] bg-gradient-to-b ${cfg.bg} flex flex-col items-center justify-center gap-2 relative`}>
                  {/* Legendary glow overlay */}
                  {model.rarity === "legendary" && (
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.08),transparent_60%)]" />
                  )}
                  {/* Rarity badge */}
                  <span className={`absolute top-2 left-2 text-[10px] font-bold tracking-wide uppercase px-2 py-1 rounded-full ${cfg.badge}`}>
                    {cfg.label}
                  </span>
                  {/* Coming soon */}
                  <span className="text-3xl opacity-40">🔒</span>
                  <span className={`text-[10px] font-bold tracking-widest uppercase opacity-50 ${cfg.text}`}>
                    Coming Soon
                  </span>
                </div>
                {/* Card body */}
                <div className="px-3 py-3">
                  <p className="text-sm font-bold text-gray-200 mb-1">
                    Model #{String(model.id).padStart(3, "0")}
                  </p>
                  <p className={`text-xs font-medium ${cfg.price}`}>Price TBA</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Back link */}
        <div className="text-center mt-12">
          <Link href="/" className="text-sm text-gray-600 hover:text-purple-400 transition-colors">
            ← Back to AIM Method
          </Link>
        </div>

      </div>
    </main>
  );
}
