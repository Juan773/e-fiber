"use client";

import { useState, useEffect, useCallback } from "react";
import { Briefcase, Plus, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { Column } from "@/components/shared/DataTable";
import Modal from "@/components/shared/Modal";

interface Cargo { id: string; name: string; description?: string; }

export default function CargosPage() {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [filtered, setFiltered] = useState<Cargo[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Cargo | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  const fetchCargos = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/positions");
    const data = await res.json();
    setCargos(data); setFiltered(data); setLoading(false);
  }, []);

  useEffect(() => { fetchCargos(); }, [fetchCargos]);
  useEffect(() => {
    setFiltered(cargos.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())));
  }, [search, cargos]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    if (editing) {
      await fetch(`/api/positions/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await fetch("/api/positions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    }
    setSaving(false); setModalOpen(false); fetchCargos();
  }

  const columns: Column<Cargo>[] = [
    { key: "name", header: "Cargo" },
    { key: "description", header: "Descripción", render: (row) => <span className="text-gray-500 dark:text-slate-400">{row.description ?? "-"}</span> },
    { key: "acciones", header: "", render: (row) => (
      <div className="flex gap-2">
        <button className="btn-edit" onClick={() => { setEditing(row); setForm({ name: row.name, description: row.description ?? "" }); setModalOpen(true); }}><Pencil size={14} /></button>
        <button className="btn-delete" onClick={async () => { if (confirm("¿Eliminar?")) { await fetch(`/api/positions/${row.id}`, { method: "DELETE" }); fetchCargos(); } }}><Trash2 size={14} /></button>
      </div>
    )},
  ];

  return (
    <>
      <PageHeader icon={Briefcase} title="Cargos" description="Gestiona los cargos de employees."
        action={<button className="btn-primary" onClick={() => { setEditing(null); setForm({ name: "", description: "" }); setModalOpen(true); }}><Plus size={16} /> Nuevo Cargo</button>}
      />
      <DataTable columns={columns} data={filtered} loading={loading} searchPlaceholder="Buscar position..." onSearch={setSearch} searchValue={search} />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Modificar Cargo" : "Nuevo Cargo"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="relative"><label className="form-label">Nombre del Cargo</label>
            <input className="form-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="relative"><label className="form-label">Descripción</label>
            <textarea className="form-input min-h-[80px] resize-none" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
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
