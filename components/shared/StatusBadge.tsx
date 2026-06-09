import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

const statusMap: Record<string, string> = {
  Activo: "badge-activo",
  Activa: "badge-activo",
  Completada: "badge-activo",
  Emitido: "badge-activo",
  Inactivo: "badge-inactivo",
  Inactiva: "badge-inactivo",
  Cancelada: "badge-inactivo",
  Anulado: "badge-inactivo",
  Suspendido: "badge-inactivo",
  Suspendida: "badge-inactivo",
  Pendiente: "badge-pendiente",
  "En Proceso": "badge-pendiente",
  Borrador: "badge-pendiente",
  Vencida: "badge-vencido",
  Vencido: "badge-vencido",
  Error: "badge-vencido",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const className = statusMap[status] ?? "badge-inactivo";
  return <span className={className}>{status}</span>;
}
