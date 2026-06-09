"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageCircle, Wifi, WifiOff, RefreshCw, Play, LogOut } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";

type WaStatus = "disconnected" | "connecting" | "connected";

interface WaState {
  status: WaStatus;
  qr: string | null;
  qrImage: string | null;
  error: string | null;
}

const STAGE_INFO: Record<number, { label: string; color: string; days: string; desc: string }> = {
  1: { label: "Emisión", color: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400", days: "Al vencer", desc: "Se envía la factura del mes con monto, plan y fecha límite." },
  2: { label: "Recordatorio", color: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400", days: "Día 3 de mora", desc: "Recordatorio amigable. Se ofrece acuerdo de pago si el cliente lo necesita." },
  3: { label: "Aviso de corte", color: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400", days: "Día 7–8 de mora", desc: "Aviso explícito de suspensión en 48 horas si no paga." },
  4: { label: "Suspensión", color: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400", days: "Día 10 de mora", desc: "Servicio suspendido. Se informa el cargo de reconexión (S/ 15)." },
};

export default function WhatsAppPage() {
  const [wa, setWa] = useState<WaState>({ status: "disconnected", qr: null, qrImage: null, error: null });
  const [cronRunning, setCronRunning] = useState(false);
  const [cronResult, setCronResult] = useState<{ sent: number; errors: number; total: number } | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp");
      const data: WaState = await res.json();
      setWa(data);
    } catch {
      // ignorar errores de red
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Polling cada 3s mientras está conectando
  useEffect(() => {
    if (wa.status !== "connecting") return;
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [wa.status, fetchStatus]);

  async function handleConnect() {
    setWa((prev) => ({ ...prev, status: "connecting", error: null }));
    try {
      const res = await fetch("/api/whatsapp/connect", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        setWa((prev) => ({ ...prev, status: "disconnected", error: data.error }));
        return;
      }
      // Esperar y luego buscar el QR
      setTimeout(fetchStatus, 2000);
    } catch (err) {
      setWa((prev) => ({ ...prev, status: "disconnected", error: `Error: ${String(err)}` }));
    }
  }

  async function handleDisconnect() {
    if (!confirm("¿Desconectar WhatsApp? Tendrás que volver a escanear el QR.")) return;
    await fetch("/api/whatsapp/disconnect", { method: "POST" });
    setWa({ status: "disconnected", qr: null, qrImage: null, error: null });
  }

  async function handleRunCron() {
    setCronRunning(true);
    setCronResult(null);
    try {
      const res = await fetch("/api/cron/billing-check");
      const data = await res.json();
      setCronResult({ sent: data.sent ?? 0, errors: data.errors ?? 0, total: data.total ?? 0 });
    } finally {
      setCronRunning(false);
    }
  }

  return (
    <div>
      <PageHeader
        icon={MessageCircle}
        title="WhatsApp"
        description="Configura la conexión para enviar notificaciones de cobranza."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">

        {/* ── Panel de conexión ── */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-medium text-gray-800 text-base">Estado de conexión</h2>

          <div className="flex items-center gap-3">
            {wa.status === "connected" ? (
              <>
                <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <Wifi size={18} className="text-green-500" />
                <span className="text-green-700 font-medium">Conectado</span>
              </>
            ) : wa.status === "connecting" ? (
              <>
                <span className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
                <RefreshCw size={18} className="text-yellow-500 animate-spin" />
                <span className="text-yellow-700 font-medium">Esperando escaneo del QR...</span>
              </>
            ) : (
              <>
                <span className="w-3 h-3 rounded-full bg-gray-300" />
                <WifiOff size={18} className="text-gray-400" />
                <span className="text-gray-500 dark:text-slate-400">Desconectado</span>
              </>
            )}
          </div>

          {wa.error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{wa.error}</p>
          )}

          {/* QR generado en el servidor como imagen base64 */}
          {wa.qrImage && wa.status === "connecting" && (
            <div className="flex flex-col items-center gap-3 py-2">
              <p className="text-sm text-gray-500 text-center">
                WhatsApp → Dispositivos vinculados → Vincular dispositivo → Escanea:
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={wa.qrImage} alt="QR WhatsApp" className="rounded-lg border border-gray-200" width={220} height={220} />
              <p className="text-xs text-gray-400">Actualizando automáticamente cada 3s...</p>
            </div>
          )}

          {wa.status === "connecting" && !wa.qrImage && (
            <p className="text-sm text-yellow-600 bg-yellow-50 rounded-lg px-3 py-2">
              Generando QR... espera unos segundos.
            </p>
          )}

          <div className="flex gap-3">
            {wa.status !== "connected" ? (
              <button
                onClick={handleConnect}
                disabled={wa.status === "connecting"}
                className="btn-primary"
              >
                <MessageCircle size={16} />
                {wa.status === "connecting" ? "Conectando..." : "Conectar WhatsApp"}
              </button>
            ) : (
              <button onClick={handleDisconnect} className="btn-delete flex items-center gap-2">
                <LogOut size={16} /> Desconectar
              </button>
            )}
            <button onClick={fetchStatus} className="btn-secondary">
              <RefreshCw size={14} /> Actualizar
            </button>
          </div>
        </div>

        {/* ── Ejecutar notificaciones ── */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-medium text-gray-800 text-base">Ejecutar notificaciones</h2>
          <p className="text-sm text-gray-500">
            Revisa todos los pagos pendientes y envía el mensaje según la etapa de mora de cada cliente.
            Esto se puede automatizar con un cron diario.
          </p>

          <button
            onClick={handleRunCron}
            disabled={cronRunning || wa.status !== "connected"}
            className="btn-primary"
          >
            <Play size={16} />
            {cronRunning ? "Ejecutando..." : "Ejecutar ahora"}
          </button>

          {wa.status !== "connected" && (
            <p className="text-xs text-orange-500">Conecta WhatsApp primero para enviar notificaciones.</p>
          )}

          {cronResult && (
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-2xl font-semibold text-gray-800">{cronResult.total}</p>
                <p className="text-xs text-gray-500 mt-0.5">Evaluados</p>
              </div>
              <div className="rounded-lg bg-green-50 p-3 text-center">
                <p className="text-2xl font-semibold text-green-700">{cronResult.sent}</p>
                <p className="text-xs text-green-600 mt-0.5">Enviados</p>
              </div>
              <div className="rounded-lg bg-red-50 p-3 text-center">
                <p className="text-2xl font-semibold text-red-600">{cronResult.errors}</p>
                <p className="text-xs text-red-500 mt-0.5">Errores</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Flujo de etapas ── */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="font-medium text-gray-800 text-base mb-4">Flujo de cobranza automático</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(STAGE_INFO).map(([stage, info]) => (
              <div key={stage} className="rounded-xl border border-gray-100 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${info.color}`}>
                    Etapa {stage}
                  </span>
                  <span className="text-xs text-gray-400">{info.days}</span>
                </div>
                <p className="font-medium text-gray-800 text-sm">{info.label}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{info.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">
            El sistema detecta automáticamente en qué etapa está cada pago y solo envía el mensaje si no fue enviado aún para esa etapa.
          </p>
        </div>

      </div>
    </div>
  );
}
