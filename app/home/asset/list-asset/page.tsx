"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, Plus, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { Column } from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import Modal from "@/components/shared/Modal";

interface TipoActivo { id: string; name: string; }
interface UnidadMedida { id: string; name: string; abbreviation: string; }
interface Activo { id: string; name: string; assetTypeId?: string; measureUnitId?: string; description?: string; stock: number; unitPrice?: number; status: string; assetType?: TipoActivo; measureUnit?: UnidadMedida; }

export default function ListAssetPage() {
  const [assets, setActivos] = useState<Activo[]>([]);
  const [filtered, setFiltered] = useState<Activo[]>([]);
  const [tipos, setTipos] = useState<TipoActivo[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Activo | null>(null);
  const [form, setForm] = useState<Partial<Activo>>({});
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [actRes, tipRes, unRes] = await Promise.all([
      fetch("/api/assets"),
      fetch("/api/geo?type=tipos-activo"),
      fetch("/api/geo?type=unidades-medida"),
    ]);
    setActivos(await actRes.json()); setTipos(await tipRes.json()); setUnidades(await unRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { setFiltered(assets.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))); }, [search, assets]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const payload = { ...form, stock: Number(form.stock ?? 0), unitPrice: form.unitPrice ? Number(form.unitPrice) : undefined };
    if (editing) {
      await fetch(`/api/assets/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      await fetch("/api/assets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, status: "Activo" }) });
    }
    setSaving(false); setModalOpen(false); fetchAll();
  }

  const set = (key: keyof Activo, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const columns: Column<Activo>[] = [
    { key: "name", header: "Activo", render: (row) => <span className="font-medium text-gray-800 dark:text-slate-100">{row.name}</span> },
    { key: "assetType", header: "Tipo", render: (row) => <span className="text-gray-500 dark:text-slate-400">{row.assetType?.name ?? "-"}</span> },
    { key: "stock", header: "Stock", render: (row) => <span className="font-semibold text-gray-700">{row.stock}</span> },
    { key: "unitPrice", header: "Precio", render: (row) => <span className="text-gray-600 dark:text-slate-300">{row.unitPrice ? `S/. ${Number(row.unitPrice).toFixed(2)}` : "-"}</span> },
    { key: "status", header: "Estado", render: (row) => <StatusBadge status={row.status} /> },
    { key: "acciones", header: "", render: (row) => (
      <div className="flex gap-2">
        <button className="btn-edit" onClick={() => { setEditing(row); setForm(row); setModalOpen(true); }}><Pencil size={14} /></button>
        <button className="btn-delete" onClick={async () => { if (confirm("¿Eliminar?")) { await fetch(`/api/assets/${row.id}`, { method: "DELETE" }); fetchAll(); } }}><Trash2 size={14} /></button>
      </div>
    )},
  ];

  return (
    <>
      <PageHeader icon={Package} title="Activos" description="Gestiona el inventario de equipos y materiales."
        action={<button className="btn-primary" onClick={() => { setEditing(null); setForm({}); setModalOpen(true); }}><Plus size={16} /> Nuevo Activo</button>}
      />
      <DataTable columns={columns} data={filtered} loading={loading} searchPlaceholder="Buscar activo..." onSearch={setSearch} searchValue={search} />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Modificar Activo" : "Nuevo Activo"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="relative"><label className="form-label">Nombre</label>
            <input className="form-input" value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative"><label className="form-label">Tipo de Activo</label>
              <select className="form-select" value={form.assetTypeId ?? ""} onChange={(e) => set("assetTypeId", e.target.value || undefined)}>
                <option value="">Seleccionar</option>
                {tipos.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="relative"><label className="form-label">Unidad de Medida</label>
              <select className="form-select" value={form.measureUnitId ?? ""} onChange={(e) => set("measureUnitId", e.target.value || undefined)}>
                <option value="">Seleccionar</option>
                {unidades.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative"><label className="form-label">Stock</label>
              <input type="number" min={0} className="form-input" value={form.stock ?? 0} onChange={(e) => set("stock", e.target.value)} />
            </div>
            <div className="relative"><label className="form-label">Precio Unitario (S/.)</label>
              <input type="number" step="0.01" min={0} className="form-input" value={form.unitPrice ?? ""} onChange={(e) => set("unitPrice", e.target.value)} />
            </div>
          </div>
          <div className="relative"><label className="form-label">Descripción</label>
            <textarea className="form-input min-h-[70px] resize-none" value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
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
