"use client";

import { Bell, ChevronDown, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-9" />;

  const isDark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      className="relative p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
    >
      {isDark
        ? <Sun size={18} className="text-yellow-400" />
        : <Moon size={18} className="text-gray-500" />
      }
    </button>
  );
}

export default function Navbar() {
  return (
    <header className="fixed top-0 left-[250px] right-0 h-16 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 z-20 flex items-center justify-end px-6 gap-2">
      <ThemeToggle />

      {/* Notifications */}
      <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
        <Bell size={20} className="text-gray-500 dark:text-slate-400" />
        <span className="absolute top-1 right-1 w-2 h-2 bg-orange-400 rounded-full" />
      </button>

      {/* User */}
      <button className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors">
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 leading-tight">Admin E-Fiber</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 leading-tight">admin@efiber.pe</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
          A
        </div>
        <ChevronDown size={14} className="text-gray-400 dark:text-slate-500" />
      </button>
    </header>
  );
}
