"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Users, Briefcase, Package, Wifi, ClipboardList,
  RefreshCw, FileText, ChevronDown, ChevronRight, LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem  { label: string; href: string; }
interface NavSection { label: string; icon: React.ReactNode; items: NavItem[]; }

const navSections: NavSection[] = [
  { label: "Dashboard",     icon: <LayoutDashboard size={18} />, items: [{ label: "Resumen", href: "/home/dashboard" }] },
  { label: "Clientes",      icon: <Users size={18} />,           items: [{ label: "Lista de Clientes", href: "/home/customer/list-customer" }] },
  { label: "Empleados",     icon: <Briefcase size={18} />,       items: [{ label: "Cargos", href: "/home/employee/cargos" }, { label: "Lista de Empleados", href: "/home/employee/list-employee" }] },
  { label: "Activos",       icon: <Package size={18} />,         items: [{ label: "Tipos de Activos", href: "/home/asset/asset-types" }, { label: "Lista de Activos", href: "/home/asset/list-asset" }, { label: "Unidades de Medida", href: "/home/asset/units" }] },
  { label: "Planes",        icon: <Wifi size={18} />,            items: [{ label: "Lista de Planes", href: "/home/plans/list-plans" }] },
  { label: "Instalaciones", icon: <ClipboardList size={18} />,   items: [{ label: "Lista de Instalaciones", href: "/home/installation/list-installation" }] },
  { label: "Subscripciones",icon: <RefreshCw size={18} />,       items: [{ label: "Lista de Subscripciones", href: "/home/subscription/list-subscription" }, { label: "Prórrogas", href: "/home/extension/list-extension" }] },
  { label: "Facturación",   icon: <FileText size={18} />,        items: [{ label: "Cobranza", href: "/home/billing/cobranza" }, { label: "Comprobantes", href: "/home/billing/list-billing" }] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navSections.forEach((s) => { initial[s.label] = s.items.some((item) => pathname.startsWith(item.href)); });
    return initial;
  });

  const toggle = (label: string) => setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <aside className="fixed left-0 top-0 h-full w-[250px] bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 z-30 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-slate-800">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
          <Wifi size={18} className="text-white" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-gray-800 dark:text-slate-100 text-lg">E-Fiber</span>
          <span className="text-[10px] bg-orange-100 dark:bg-orange-900/40 text-orange-500 dark:text-orange-400 px-1.5 py-0.5 rounded font-semibold">v1.0</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {navSections.map((section) => {
          const isOpen   = openSections[section.label] ?? false;
          const isActive = section.items.some((item) => pathname === item.href);
          return (
            <div key={section.label}>
              <button
                onClick={() => toggle(section.label)}
                className={cn("sidebar-section w-full", isActive && "text-orange-500 dark:text-orange-400")}
              >
                <span className="flex items-center gap-3">
                  <span className={cn("text-gray-400 dark:text-slate-500", isActive && "text-orange-400")}>
                    {section.icon}
                  </span>
                  {section.label}
                </span>
                {isOpen
                  ? <ChevronDown size={14} className="text-gray-400 dark:text-slate-500" />
                  : <ChevronRight size={14} className="text-gray-400 dark:text-slate-500" />
                }
              </button>
              {isOpen && (
                <div className="ml-6 mt-0.5 space-y-0.5">
                  {section.items.map((item) => (
                    <Link key={item.href} href={item.href}
                      className={cn("sidebar-item", pathname === item.href && "active")}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
