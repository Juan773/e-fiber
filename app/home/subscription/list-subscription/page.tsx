"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Plus, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { Column } from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import Modal from "@/components/shared/Modal";

interface Cliente { id: string; firstName: string; lastName: string; }
interface Plan { id: string; name: string; monthlyPrice: number; }
interface Instalacion { id: string; clientId: string; installationAddress: string; }
interface Subscripcion {
  id: string; clientId: string; installationId: string; planId: string;
  startDate: string; endDate: string; monthlyPrice: number; status: string;
  client?: Cliente; plan?: Plan; installation?: Instalacion;
}

export default function ListSubscriptionPage() {
  const [items, setItems] = useState<Subscripcion[]>([]);
  const [filtered, setFiltered] = useState<Subscripcion[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [installations, setInstalaciones] = useState<Instalacion[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subscripcion | null>(null);
  const [form, setForm] = useState<Partial<Subscripcion & { monthlyPrice: number }>>({});
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [subRes, clsRes, insRes, plsRes] = await Promise.all([
      fetch("/api/subscriptions"), fetch("/api/clients"),
      fetch("/api/installations"), fetch("/api/plans"),
    ]);
    setItems(await subRes.json()); setClientes(await clsRes.json());
    setInstalaciones(await insRes.json()); setPlanes(await plsRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(items.filter((i) => i.client ? `${i.client.firstName} ${i.client.lastName}`.toLowerCase().includes(q) : true));
  }, [search, items]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    if (editing) {
      await fetch(`/api/subscriptions/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await fetch("/api/subscriptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, status: "Activa" }) });
    }
    setSaving(false); setModalOpen(false); fetchAll();
  }

  const set = (key: string, value: unknown) => setForm((f) => ({ ...f, [key]: value }));
  const clienteInstalaciones = installations.filter((i) => !form.clientId || i.clientId === form.clientId);

  const columns: Column<Subscripcion>[] = [
    { key: "client", header: "Cliente", render: (row) => <span className="font-medium text-gray-800 dark:text-slate-100">{row.client ? `${row.client.firstName} ${row.client.lastName}` : "-"}</span> },
    { key: "plan", header: "Plan", render: (row) => <span className="text-gray-600 dark:text-slate-300">{row.plan?.name ?? "-"}</span> },
    { key: "monthlyPrice", header: "Precio/Mes", render: (row) => <span className="font-semibold text-gray-700">S/. {Number(row.monthlyPrice).toFixed(2)}</span> },
    { key: "startDate", header: "Inicio", render: (row) => <span className="text-gray-500 dark:text-slate-400 text-sm">{new Date(row.startDate).toLocaleDateString("es-PE")}</span> },
    { key: "endDate", header: "Vencimiento", render: (row) => <span className="text-gray-500 dark:text-slate-400 text-sm">{new Date(row.endDate).toLocaleDateString("es-PE")}</span> },
    { key: "status", header: "Estado", render: (row) => <StatusBadge status={row.status} /> },
    { key: "acciones", header: "", render: (row) => (
      <div className="flex gap-2">
        <button className="btn-edit" onClick={() => { setEditing(row); setForm({ clientId: row.clientId, installationId: row.installationId, planId: row.planId, startDate: row.startDate?.split("T")[0], endDate: row.endDate?.split("T")[0], monthlyPrice: Number(row.monthlyPrice), status: row.status }); setModalOpen(true); }}><Pencil size={14} /></button>
        <button className="btn-delete" onClick={async () => { if (confirm("¿Eliminar?")) { await fetch(`/api/subscriptions/${row.id}`, { method: "DELETE" }); fetchAll(); } }}><Trash2 size={14} /></button>
      </div>
    )},
  ];

  return (
    <>
      <PageHeader icon={RefreshCw} title="Subscripciones" description="Gestiona los contratos de servicio."
        action={<button className="btn-primary" onClick={() => { setEditing(null); setForm({}); setModalOpen(true); }}><Plus size={16} /> Nueva Subscripción</button>}
      />
      <DataTable columns={columns} data={filtered} loading={loading} searchPlaceholder="Buscar subscripción..." onSearch={setSearch} searchValue={search} />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Modificar Subscripción" : "Nueva Subscripción"}>
        <form onSubmit={handleSave} className="space-y-4">
          <p className="form-section-title">Datos del Contrato</p>
          <div className="relative"><label className="form-label">Cliente</label>
            <select className="form-select" value={form.clientId ?? ""} onChange={(e) => set("clientId", e.target.value)} required>
              <option value="">Seleccionar client</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
          </div>
          <div className="relative"><label className="form-label">Instalación</label>
            <select className="form-select" value={form.installationId ?? ""} onChange={(e) => set("installationId", e.target.value)} required>
              <option value="">Seleccionar instalación</option>
              {clienteInstalaciones.map((i) => <option key={i.id} value={i.id}>{i.installationAddress}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative"><label className="form-label">Plan</label>
              <select className="form-select" value={form.planId ?? ""} onChange={(e) => { const p = planes.find((pl) => pl.id === e.target.value); set("planId", e.target.value); if (p) set("monthlyPrice", p.monthlyPrice); }} required>
                <option value="">Seleccionar plan</option>
                {planes.map((p) => <option key={p.id} value={p.id}>{p.name} — S/. {Number(p.monthlyPrice).toFixed(2)}</option>)}
              </select>
            </div>
            <div className="relative"><label className="form-label">Precio Mensual (S/.)</label>
              <input type="number" step="0.01" className="form-input" value={form.monthlyPrice ?? ""} onChange={(e) => set("monthlyPrice", Number(e.target.value))} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative"><label className="form-label">Fecha Inicio</label>
              <input type="date" className="form-input" value={form.startDate ?? ""} onChange={(e) => set("startDate", e.target.value)} required />
            </div>
            <div className="relative"><label className="form-label">Fecha Fin</label>
              <input type="date" className="form-input" value={form.endDate ?? ""} onChange={(e) => set("endDate", e.target.value)} required />
            </div>
          </div>
          {editing && (
            <div className="relative"><label className="form-label">Estado</label>
              <select className="form-select" value={form.status ?? "Activa"} onChange={(e) => set("status", e.target.value)}>
                {["Activa","Vencida","Suspendida","Cancelada"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
