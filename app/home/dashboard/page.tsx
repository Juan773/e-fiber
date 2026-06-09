"use client";

import { useEffect, useState } from "react";
import { Users, ClipboardList, RefreshCw, FileText, TrendingUp, AlertCircle } from "lucide-react";

interface Stats {
  totalClientes: number; clientesActivos: number; instalacionesPendientes: number;
  subscripcionesActivas: number; subscripcionesVencidas: number; ingresosMes: number; comprobantesMes: number;
}

function StatCard({ icon: Icon, label, value, color, sub }: { icon: React.ElementType; label: string; value: string | number; color: string; sub?: string; }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setStats);
  }, []);

  if (!stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-400 dark:text-slate-500">Resumen general del sistema e-fiber</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <StatCard icon={Users} label="Total Clientes" value={stats.totalClientes} color="bg-blue-400" sub={`${stats.clientesActivos} assets`} />
        <StatCard icon={ClipboardList} label="Instalaciones Pendientes" value={stats.instalacionesPendientes} color="bg-yellow-400" />
        <StatCard icon={RefreshCw} label="Subscripciones Activas" value={stats.subscripcionesActivas} color="bg-green-400" />
        <StatCard icon={AlertCircle} label="Subscripciones Vencidas" value={stats.subscripcionesVencidas} color="bg-red-400" />
        <StatCard icon={TrendingUp} label="Ingresos del Mes" value={`S/. ${stats.ingresosMes.toFixed(2)}`} color="bg-orange-400" sub="invoices emitidos" />
        <StatCard icon={FileText} label="Comprobantes este Mes" value={stats.comprobantesMes} color="bg-purple-400" />
      </div>
      {stats.subscripcionesVencidas > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-700">Atención requerida</p>
            <p className="text-sm text-red-500">Tienes {stats.subscripcionesVencidas} subscripción(es) vencida(s). Revisa la sección de Subscripciones.</p>
          </div>
        </div>
      )}
    </div>
  );
}
