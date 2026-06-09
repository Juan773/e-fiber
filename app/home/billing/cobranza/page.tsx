"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DollarSign, Pencil, CheckCircle2, AlertCircle,
  Clock, XCircle, ChevronLeft, ChevronRight, Filter, Search,
  Tag,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";


// ─── Tooltip ──────────────────────────────────────────────────────────────────
function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tip inline-flex">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
      </div>
    </div>
  );
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Cliente { id: string; firstName: string; lastName: string; phone?: string; email?: string; }
interface Plan { name: string; monthlyPrice: number; }
interface Instalacion { installationAddress: string; }
interface Subscripcion { id: string; client: Cliente; plan: Plan; installation: Instalacion; }
interface Pago {
  id: string; subscriptionId: string; month: number; year: number;
  amount: number; lateFee: number; discount: number; status: string;
  dueDate: string; paymentDate?: string; paymentMethod?: string;
  notes?: string; notified: boolean; isProrated: boolean;
  notificationStage: number;
  lastNotifiedAt?: string;
  subscription: Subscripcion;
}

const ETAPAS: Record<number, { label: string; color: string }> = {
  0: { label: "Sin aviso",          color: "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400" },
  1: { label: "Recibo enviado",     color: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400" },
  2: { label: "Aviso de pago",      color: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400" },
  3: { label: "Último día",         color: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400" },
  4: { label: "Suspendido",         color: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400" },
  5: { label: "Retiro equipos",     color: "bg-red-200 dark:bg-red-900/60 text-red-900 dark:text-red-300" },
};

// Calendario de eventos del mes
const CALENDARIO_COBRANZA = [
  { day: 27, stage: 1, label: "Envío de recibos",       color: "bg-blue-50 border-blue-200",   badge: "text-blue-700" },
  { day: 1,  stage: 2, label: "Aviso de cobranza",      color: "bg-yellow-50 border-yellow-200", badge: "text-yellow-700" },
  { day: 10, stage: 3, label: "Último día de pago",     color: "bg-orange-50 border-orange-200", badge: "text-orange-700" },
  { day: 11, stage: 4, label: "Suspensión de servicio", color: "bg-red-50 border-red-200",     badge: "text-red-700" },
  { day: 15, stage: 5, label: "Retiro de equipos",      color: "bg-red-100 border-red-300",    badge: "text-red-900" },
];

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const METODOS_PAGO = ["Efectivo","Yape","Plin","Transferencia","Depósito","Otro"];

function estadoConfig(status: string) {
  switch (status) {
    case "Pagado":  return { color: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400",  icon: <CheckCircle2 size={13} />, dot: "bg-green-400" };
    case "Vencido": return { color: "bg-red-100 text-red-600",      icon: <AlertCircle size={13} />,  dot: "bg-red-400" };
    case "Pendiente":return { color: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400",icon: <Clock size={13} />,        dot: "bg-yellow-400" };
    default:        return { color: "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400",    icon: <XCircle size={13} />,      dot: "bg-gray-300" };
  }
}

// ─── Modal Registrar Pago ─────────────────────────────────────────────────────
function ModalPago({ pago, onClose, onSaved }: { pago: Pago; onClose: () => void; onSaved: () => void }) {
  const totalConMora = Number(pago.amount) + Number(pago.lateFee) - Number(pago.discount);
  const [metodo, setMetodo] = useState(pago.paymentMethod ?? "Efectivo");
  const [lateFee, setMoratorio] = useState(Number(pago.lateFee) || 0);
  const [discount, setDescuento] = useState(Number(pago.discount) || 0);
  const [obs, setObs] = useState(pago.notes ?? "");
  const [saving, setSaving] = useState(false);

  const totalFinal = Number(pago.amount) + lateFee - discount;

  async function handlePagar() {
    setSaving(true);
    await fetch(`/api/payments/${pago.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "pagar", paymentMethod: metodo, lateFee, discount, notes: obs }),
    });
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 dark:bg-black/70" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-orange-400 to-orange-500" />
        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100">Registrar Pago</h2>
            <p className="text-sm text-gray-400 dark:text-slate-500">
              {pago.subscription.client.firstName} {pago.subscription.client.lastName} —{" "}
              {MESES[pago.month - 1]} {pago.year}
            </p>
          </div>

          {/* Resumen del cobro */}
          <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Mensualidad ({pago.subscription.plan.name})</span>
              <span>S/. {Number(pago.amount).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-gray-600">
              <span>Moratorio</span>
              <input
                type="number" min={0} step="0.01"
                className="w-24 text-right border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-orange-400"
                value={lateFee}
                onChange={(e) => setMoratorio(Number(e.target.value))}
              />
            </div>
            <div className="flex items-center justify-between text-gray-600">
              <span>Descuento</span>
              <input
                type="number" min={0} step="0.01"
                className="w-24 text-right border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-orange-400"
                value={discount}
                onChange={(e) => setDescuento(Number(e.target.value))}
              />
            </div>
            <div className="flex justify-between font-bold text-gray-800 border-t border-gray-200 pt-2">
              <span>Total a cobrar</span>
              <span className="text-orange-500">S/. {totalFinal.toFixed(2)}</span>
            </div>
          </div>

          {/* Método de pago */}
          <div>
            <label className="form-label">Método de pago</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {METODOS_PAGO.map((m) => (
                <button key={m} type="button"
                  onClick={() => setMetodo(m)}
                  className={`py-2 px-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                    metodo === m ? "border-orange-400 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" : "border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:border-gray-300"
                  }`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="form-label">Observaciones</label>
            <textarea
              className="form-input min-h-[60px] resize-none mt-1"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Notas del pago..."
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button type="button" disabled={saving} onClick={handlePagar}
              className="btn-primary flex-1 justify-center">
              <CheckCircle2 size={15} /> {saving ? "Registrando..." : "Confirmar Pago"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Ajuste ─────────────────────────────────────────────────────────────
function ModalAjuste({ pago, onClose, onSaved }: { pago: Pago; onClose: () => void; onSaved: () => void }) {
  const [lateFee, setMoratorio] = useState(Number(pago.lateFee) || 0);
  const [discount, setDescuento] = useState(Number(pago.discount) || 0);
  const [obs, setObs] = useState(pago.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/payments/${pago.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lateFee, discount, notes: obs }),
    });
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 dark:bg-black/70" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-orange-400 to-orange-500" />
        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100">Ajustar Cobro</h2>
            <p className="text-sm text-gray-400 dark:text-slate-500">
              {pago.subscription.client.firstName} {pago.subscription.client.lastName} — {MESES[pago.month - 1]} {pago.year}
            </p>
          </div>
          <div className="relative">
            <label className="form-label">Moratorio (S/.)</label>
            <input type="number" min={0} step="0.01" className="form-input"
              value={lateFee}
              onChange={(e) => setMoratorio(Number(e.target.value))}
              onFocus={(e) => e.target.select()} />
          </div>
          <div className="relative">
            <label className="form-label">Descuento (S/.)</label>
            <input type="number" min={0} step="0.01" className="form-input"
              value={discount}
              onChange={(e) => setDescuento(Number(e.target.value))}
              onFocus={(e) => e.target.select()} />
          </div>
          <div className="relative">
            <label className="form-label">Observaciones</label>
            <textarea className="form-input min-h-[60px] resize-none"
              value={obs} onChange={(e) => setObs(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button type="button" disabled={saving} onClick={handleSave}
              className="btn-primary flex-1 justify-center">
              {saving ? "Guardando..." : "Guardar Ajuste"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function CobranzaPage() {
  const now = new Date();
  const [month, setMes] = useState(now.getMonth() + 1);
  const [year, setAnio] = useState(now.getFullYear());
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [searchText, setSearchText] = useState("");
  const [payments, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalPago, setModalPago] = useState<Pago | null>(null);
  const [modalAjuste, setModalAjuste] = useState<Pago | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const fetchPagos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ month: String(month), year: String(year) });
    if (estadoFiltro) params.set("status", estadoFiltro);
    const res = await fetch(`/api/payments?${params}`);
    setPagos(await res.json());
    setLoading(false);
  }, [month, year, estadoFiltro]);

  useEffect(() => { fetchPagos(); }, [fetchPagos]);

  const pagosFiltrados = payments.filter((p) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    const name = `${p.subscription.client.firstName} ${p.subscription.client.lastName}`.toLowerCase();
    return name.includes(q);
  });

  // Estadísticas del month
  const totalCobrar = pagosFiltrados.reduce((s, p) => s + Number(p.amount) + Number(p.lateFee) - Number(p.discount), 0);
  const totalCobrado = pagosFiltrados.filter((p) => p.status === "Pagado").reduce((s, p) => s + Number(p.amount) + Number(p.lateFee) - Number(p.discount), 0);
  const pendientes = pagosFiltrados.filter((p) => p.status === "Pendiente").length;
  const vencidos = pagosFiltrados.filter((p) => p.status === "Vencido").length;

  // Marcar etapa manualmente desde la UI
  async function marcarEtapa(pago: Pago, stage: number) {
    await fetch(`/api/payments/${pago.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationStage: stage, notified: true, lastNotifiedAt: new Date() }),
    });
    fetchPagos();
  }

  function navMes(dir: -1 | 1) {
    let nuevoMes = month + dir;
    let nuevoAño = year;
    if (nuevoMes < 1) { nuevoMes = 12; nuevoAño--; }
    if (nuevoMes > 12) { nuevoMes = 1; nuevoAño++; }
    setMes(nuevoMes); setAnio(nuevoAño);
  }

  return (
    <>
      <PageHeader
        icon={DollarSign}
        title="Cobranza"
        description="Seguimiento de cobros mes a mes."
        action={
          <button className="btn-secondary" onClick={() => setShowCalendar((v) => !v)}>
            <Tag size={15} /> {showCalendar ? "Ocultar" : "Calendario de cobranza"}
          </button>
        }
      />

      {/* Calendario de eventos del mes */}
      {showCalendar && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
          {CALENDARIO_COBRANZA.map((ev) => (
            <div key={ev.stage} className={`rounded-xl border p-3 ${ev.color}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${ev.badge}`}>Día {ev.day}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ev.badge} bg-white/70`}>E{ev.stage}</span>
              </div>
              <p className={`text-xs font-medium ${ev.badge}`}>{ev.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Navegador de month */}
      <div className="flex items-center gap-3 mb-4">
        <Tooltip text="Mes anterior">
          <button onClick={() => navMes(-1)} className="p-2 rounded-xl border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            <ChevronLeft size={18} className="text-gray-500 dark:text-slate-400" />
          </button>
        </Tooltip>
        <span className="font-semibold text-gray-800 text-base min-w-[120px] text-center">
          {MESES[month - 1]} {year}
        </span>
        <Tooltip text="Mes siguiente">
          <button onClick={() => navMes(1)} className="p-2 rounded-xl border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            <ChevronRight size={18} className="text-gray-500 dark:text-slate-400" />
          </button>
        </Tooltip>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total a cobrar", value: `S/. ${totalCobrar.toFixed(2)}`, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
          { label: "Cobrado", value: `S/. ${totalCobrado.toFixed(2)}`, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
          { label: "Pendientes", value: pendientes, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
          { label: "Vencidos", value: vencidos, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20" },
        ].map((k) => (
          <div key={k.label} className={`${k.bg} rounded-2xl p-4`}>
            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">{k.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="form-input pl-9 h-9 text-sm w-60"
            placeholder="Buscar client..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            className="form-select pl-9 h-9 text-sm pr-8"
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
          >
            <option value="">Todos los estados</option>
            {["Pendiente","Pagado","Vencido","Anulado"].map((e) => <option key={e}>{e}</option>)}
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="space-y-0 divide-y divide-gray-50 dark:divide-slate-700">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse dark:bg-slate-800">
                <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-700" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-40 bg-gray-100 dark:bg-slate-700 rounded" />
                  <div className="h-2.5 w-24 bg-gray-100 dark:bg-slate-700 rounded" />
                </div>
                <div className="h-3 w-16 bg-gray-100 dark:bg-slate-700 rounded" />
              </div>
            ))}
          </div>
        ) : pagosFiltrados.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-slate-500">
            <DollarSign size={36} className="mx-auto mb-3 opacity-30 dark:opacity-20" />
            <p className="font-medium">No hay cobros para {MESES[month - 1]} {year}</p>
            <p className="text-sm mt-1">Los cobros se generan automáticamente al completar una instalación.</p>
          </div>
        ) : (
          <div className="overflow-x-auto dark:bg-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700 text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-medium dark:text-slate-400">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium dark:text-slate-400">Plan</th>
                  <th className="text-left px-4 py-3 font-medium dark:text-slate-400">Vencimiento</th>
                  <th className="text-right px-4 py-3 font-medium dark:text-slate-400">Monto</th>
                  <th className="text-right px-4 py-3 font-medium dark:text-slate-400">Mora</th>
                  <th className="text-right px-4 py-3 font-medium dark:text-slate-400">Dto.</th>
                  <th className="text-right px-4 py-3 font-medium dark:text-slate-400">Total</th>
                  <th className="text-left px-4 py-3 font-medium dark:text-slate-400">Estado</th>
                  <th className="text-left px-4 py-3 font-medium dark:text-slate-400">Etapa</th>
                  <th className="text-left px-4 py-3 font-medium dark:text-slate-400">Pago</th>
                  <th className="px-4 py-3 dark:bg-slate-800" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                {pagosFiltrados.map((p) => {
                  const cfg = estadoConfig(p.status);
                  const total = Number(p.amount) + Number(p.lateFee) - Number(p.discount);
                  const client = p.subscription.client;
                  const etapa = ETAPAS[p.notificationStage ?? 0];
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-bold text-xs flex-shrink-0">
                            {client.firstName[0]}{client.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 dark:text-slate-100">{client.firstName} {client.lastName}</p>
                            {client.phone && <p className="text-xs text-gray-400">{client.phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-gray-600 dark:text-slate-300 text-sm">{p.subscription.plan.name}</p>
                        {p.isProrated && (
                          <span className="text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-full font-medium">Prorrateo</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-gray-500 dark:text-slate-400 text-sm">{new Date(p.dueDate).toLocaleDateString("es-PE")}</p>
                      </td>
                      <td className="px-4 py-3.5 text-right text-gray-700 dark:text-slate-200 font-medium">
                        S/. {Number(p.amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={Number(p.lateFee) > 0 ? "text-red-500 font-medium" : "text-gray-300 dark:text-slate-600"}>
                          +{Number(p.lateFee).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={Number(p.discount) > 0 ? "text-green-500 font-medium" : "text-gray-300 dark:text-slate-600"}>
                          -{Number(p.discount).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-gray-800">
                        S/. {total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                          {cfg.icon} {p.status}
                        </span>
                      </td>
                      {/* Etapa de cobranza */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${etapa.color}`}>
                          {p.notificationStage === 0 ? "—" : `E${p.notificationStage} · ${etapa.label}`}
                        </span>
                        {p.lastNotifiedAt && (
                          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                            {new Date(p.lastNotifiedAt).toLocaleDateString("es-PE")}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-gray-400 text-xs">
                        {p.paymentDate
                          ? <span className="text-green-600 dark:text-green-400 font-medium">{new Date(p.paymentDate).toLocaleDateString("es-PE")} · {p.paymentMethod}</span>
                          : <span>—</span>
                        }
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 justify-end">
                          {/* Ajustar */}
                          {p.status !== "Pagado" && p.status !== "Anulado" && (
                            <Tooltip text="Ajustar mora / descuento">
                              <button
                                onClick={() => setModalAjuste(p)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                              >
                                <Pencil size={14} />
                              </button>
                            </Tooltip>
                          )}
                          {/* Marcar siguiente etapa */}
                          {p.status !== "Pagado" && p.status !== "Anulado" && (p.notificationStage ?? 0) < 5 && (
                            <Tooltip text={`Marcar etapa ${(p.notificationStage ?? 0) + 1}: ${ETAPAS[(p.notificationStage ?? 0) + 1]?.label}`}>
                              <button
                                onClick={() => marcarEtapa(p, (p.notificationStage ?? 0) + 1)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                              >
                                <Tag size={14} />
                              </button>
                            </Tooltip>
                          )}
                          {/* Pagar */}
                          {p.status !== "Pagado" && p.status !== "Anulado" && (
                            <Tooltip text="Registrar pago">
                              <button
                                onClick={() => setModalPago(p)}
                                className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors flex items-center gap-1"
                              >
                                <CheckCircle2 size={12} /> Pagar
                              </button>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modales */}
      {modalPago && (
        <ModalPago pago={modalPago} onClose={() => setModalPago(null)} onSaved={fetchPagos} />
      )}
      {modalAjuste && (
        <ModalAjuste pago={modalAjuste} onClose={() => setModalAjuste(null)} onSaved={fetchPagos} />
      )}
    </>
  );
}
