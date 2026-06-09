"use client";

import { useState, useEffect, useCallback } from "react";
import { ClipboardList, Plus, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { Column } from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import Avatar from "@/components/shared/Avatar";
import Modal from "@/components/shared/Modal";

interface Cliente { id: string; firstName: string; lastName: string; }
interface Empleado { id: string; firstName: string; lastName: string; }
interface Plan { id: string; name: string; speedMbps: number; }
interface Instalacion {
  id: string; clientId: string; employeeId?: string; planId: string;
  installationAddress: string; scheduledDate?: string; status: string; notes?: string;
  client?: Cliente; employee?: Empleado; plan?: Plan;
}

interface ClienteForm {
  docType: string; docNumber: string;
  firstName: string; lastName: string;
  phone?: string; email?: string; address?: string;
}

const DEFAULT_CLIENTE: ClienteForm = {
  docType: "DNI", docNumber: "",
  firstName: "", lastName: "",
  phone: "", email: "", address: "",
};

export default function ListInstallationPage() {
  const [items, setItems] = useState<Instalacion[]>([]);
  const [filtered, setFiltered] = useState<Instalacion[]>([]);
  const [employees, setEmpleados] = useState<Empleado[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Instalacion | null>(null);

  // Instalación form
  const [form, setForm] = useState<Partial<Instalacion>>({});

  // Cliente form (solo para nueva instalación)
  const [clienteForm, setClienteForm] = useState<ClienteForm>(DEFAULT_CLIENTE);

  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [insRes, empsRes, plsRes] = await Promise.all([
      fetch("/api/installations"), fetch("/api/employees"), fetch("/api/plans"),
    ]);
    setItems(await insRes.json());
    setEmpleados(await empsRes.json());
    setPlanes(await plsRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(items.filter((i) => i.client ? `${i.client.firstName} ${i.client.lastName}`.toLowerCase().includes(q) : true));
  }, [search, items]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const instalacionData = {
      ...form,
      scheduledDate: form.scheduledDate ? new Date(form.scheduledDate) : undefined,
    };

    if (editing) {
      // Editar instalación existente — no tocamos el client
      await fetch(`/api/installations/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(instalacionData),
      });
    } else {
      // Nueva instalación — enviar datos del client para crear en la misma transacción
      await fetch("/api/installations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client: clienteForm, ...instalacionData }),
      });
    }

    setSaving(false);
    setModalOpen(false);
    fetchAll();
  }

  const set = (key: keyof Instalacion, value: unknown) => setForm((f) => ({ ...f, [key]: value }));
  const setC = (key: keyof ClienteForm, value: string) => setClienteForm((f) => ({ ...f, [key]: value }));

  const columns: Column<Instalacion>[] = [
    {
      key: "client", header: "Cliente", render: (row) => row.client ? (
        <div className="flex items-center gap-3">
          <Avatar firstName={row.client.firstName} lastName={row.client.lastName} />
          <span className="font-medium text-gray-800 dark:text-slate-100">{row.client.firstName} {row.client.lastName}</span>
        </div>
      ) : <span className="text-gray-400">-</span>,
    },
    { key: "plan", header: "Plan", render: (row) => <span className="text-gray-700">{row.plan?.name ?? "-"}</span> },
    { key: "installationAddress", header: "Dirección", render: (row) => <span className="text-gray-500 dark:text-slate-400 text-sm">{row.installationAddress}</span> },
    {
      key: "scheduledDate", header: "Fecha Prog.", render: (row) => (
        <span className="text-gray-500 dark:text-slate-400 text-sm">
          {row.scheduledDate ? new Date(row.scheduledDate).toLocaleDateString("es-PE") : "-"}
        </span>
      ),
    },
    { key: "status", header: "Estado", render: (row) => <StatusBadge status={row.status} /> },
    {
      key: "acciones", header: "", render: (row) => (
        <div className="flex gap-2">
          <button className="btn-edit" onClick={() => {
            setEditing(row);
            setForm({ clientId: row.clientId, employeeId: row.employeeId, planId: row.planId, installationAddress: row.installationAddress, status: row.status, notes: row.notes, scheduledDate: row.scheduledDate });
            setModalOpen(true);
          }}><Pencil size={14} /></button>
          <button className="btn-delete" onClick={async () => {
            if (confirm("¿Eliminar instalación?")) {
              await fetch(`/api/installations/${row.id}`, { method: "DELETE" });
              fetchAll();
            }
          }}><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        icon={ClipboardList}
        title="Instalaciones"
        description="Gestiona las órdenes de instalación."
        action={
          <button className="btn-primary" onClick={() => {
            setEditing(null);
            setForm({ status: "Pendiente" });
            setClienteForm(DEFAULT_CLIENTE);
            setModalOpen(true);
          }}>
            <Plus size={16} /> Nueva Instalación
          </button>
        }
      />
      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        searchPlaceholder="Buscar instalación..."
        onSearch={setSearch}
        searchValue={search}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Modificar Instalación" : "Nueva Instalación"}
        subtitle={editing ? undefined : "Registra client e instalación al mismo tiempo"}
      >
        <form onSubmit={handleSave} className="space-y-4">

          {/* ──── Datos del Cliente (solo en creación) ──── */}
          {!editing && (
            <>
              <p className="form-section-title">Datos del Cliente</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="form-label">Tipo Documento</label>
                  <select className="form-select" value={clienteForm.docType} onChange={(e) => setC("docType", e.target.value)}>
                    {["DNI", "RUC", "Pasaporte", "Carnet Extranjería"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="relative">
                  <label className="form-label">Nro. Documento</label>
                  <input className="form-input" value={clienteForm.docNumber} onChange={(e) => setC("docNumber", e.target.value)} required placeholder="12345678" maxLength={20} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="form-label">Nombres</label>
                  <input className="form-input" value={clienteForm.firstName} onChange={(e) => setC("firstName", e.target.value)} required placeholder="Juan" />
                </div>
                <div className="relative">
                  <label className="form-label">Apellidos</label>
                  <input className="form-input" value={clienteForm.lastName} onChange={(e) => setC("lastName", e.target.value)} required placeholder="Pérez" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="form-label">Teléfono</label>
                  <input className="form-input" value={clienteForm.phone ?? ""} onChange={(e) => setC("phone", e.target.value)} placeholder="987654321" />
                </div>
                <div className="relative">
                  <label className="form-label">Correo</label>
                  <input type="email" className="form-input" value={clienteForm.email ?? ""} onChange={(e) => setC("email", e.target.value)} placeholder="email@ejemplo.com" />
                </div>
              </div>
              <div className="relative">
                <label className="form-label">Dirección del Cliente</label>
                <input className="form-input" value={clienteForm.address ?? ""} onChange={(e) => setC("address", e.target.value)} placeholder="Av. Lima 123, Puno" />
              </div>
            </>
          )}

          {/* ──── Datos de la Instalación ──── */}
          <p className="form-section-title">Datos de la Instalación</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <label className="form-label">Plan</label>
              <select className="form-select" value={form.planId ?? ""} onChange={(e) => set("planId", e.target.value)} required>
                <option value="">Seleccionar plan</option>
                {planes.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.speedMbps} Mbps</option>)}
              </select>
            </div>
            <div className="relative">
              <label className="form-label">Técnico Asignado</label>
              <select className="form-select" value={form.employeeId ?? ""} onChange={(e) => set("employeeId", e.target.value || undefined)}>
                <option value="">Sin asignar</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
              </select>
            </div>
          </div>
          <div className="relative">
            <label className="form-label">Dirección de Instalación</label>
            <input className="form-input" value={form.installationAddress ?? ""} onChange={(e) => set("installationAddress", e.target.value)} required placeholder="Calle Miraflores 456, Puno" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <label className="form-label">Fecha Programada</label>
              <input type="date" className="form-input" value={form.scheduledDate ?? ""} onChange={(e) => set("scheduledDate", e.target.value)} />
            </div>
            <div className="relative">
              <label className="form-label">Estado</label>
              <select className="form-select" value={form.status ?? "Pendiente"} onChange={(e) => set("status", e.target.value)}>
                {["Pendiente", "En Proceso", "Completada", "Cancelada"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="relative">
            <label className="form-label">Observaciones</label>
            <textarea className="form-input min-h-[70px] resize-none" value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} placeholder="Equipos necesarios, accesos, notas..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? "Guardando..." : editing ? "Guardar cambios" : "Registrar"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
