"use client";

import { useState, useEffect, useCallback } from "react";
import { Wifi, Plus, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { Column } from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import Modal from "@/components/shared/Modal";

interface Plan { id: string; name: string; description?: string; speedMbps: number; monthlyPrice: number; status: string; }

export default function ListPlansPage() {
  const [items, setItems] = useState<Plan[]>([]);
  const [filtered, setFiltered] = useState<Plan[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState<Partial<Plan>>({});
  const [saving, setSaving] = useState(false);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/plans");
    const data = await res.json();
    setItems(data); setFiltered(data); setLoading(false);
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);
  useEffect(() => { setFiltered(items.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))); }, [search, items]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const payload = { ...form, speedMbps: Number(form.speedMbps), monthlyPrice: Number(form.monthlyPrice) };
    if (editing) {
      await fetch(`/api/plans/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      await fetch("/api/plans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, status: "Activo" }) });
    }
    setSaving(false); setModalOpen(false); fetchPlans();
  }

  const set = (key: keyof Plan, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const columns: Column<Plan>[] = [
    { key: "name", header: "Plan", render: (row) => (
      <div><p className="font-semibold text-gray-800">{row.name}</p><p className="text-xs text-gray-400">{row.description}</p></div>
    )},
    { key: "speedMbps", header: "Velocidad", render: (row) => (
      <span className="font-semibold text-orange-500">{row.speedMbps >= 1000 ? `${row.speedMbps/1000} Gbps` : `${row.speedMbps} Mbps`}</span>
    )},
    { key: "monthlyPrice", header: "Precio/Mes", render: (row) => <span className="font-bold text-gray-700">S/. {Number(row.monthlyPrice).toFixed(2)}</span> },
    { key: "status", header: "Estado", render: (row) => <StatusBadge status={row.status} /> },
    { key: "acciones", header: "", render: (row) => (
      <div className="flex gap-2">
        <button className="btn-edit" onClick={() => { setEditing(row); setForm(row); setModalOpen(true); }}><Pencil size={14} /></button>
        <button className="btn-delete" onClick={async () => { if (confirm("¿Eliminar plan?")) { await fetch(`/api/plans/${row.id}`, { method: "DELETE" }); fetchPlans(); } }}><Trash2 size={14} /></button>
      </div>
    )},
  ];

  return (
    <>
      <PageHeader icon={Wifi} title="Planes" description="Gestiona los planes de servicio de fibra óptica."
        action={<button className="btn-primary" onClick={() => { setEditing(null); setForm({}); setModalOpen(true); }}><Plus size={16} /> Nuevo Plan</button>}
      />
      <DataTable columns={columns} data={filtered} loading={loading} searchPlaceholder="Buscar plan..." onSearch={setSearch} searchValue={search} />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Modificar Plan" : "Nuevo Plan"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="relative"><label className="form-label">Nombre del Plan</label>
            <input className="form-input" value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div className="relative"><label className="form-label">Descripción</label>
            <textarea className="form-input min-h-[70px] resize-none" value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative"><label className="form-label">Velocidad (Mbps)</label>
              <input type="number" min={1} className="form-input" value={form.speedMbps ?? ""} onChange={(e) => set("speedMbps", e.target.value)} required />
            </div>
            <div className="relative"><label className="form-label">Precio Mensual (S/.)</label>
              <input type="number" step="0.01" min={0} className="form-input" value={form.monthlyPrice ?? ""} onChange={(e) => set("monthlyPrice", e.target.value)} required />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
