"use client";

import { useState, useEffect, useCallback } from "react";
import { Briefcase, Plus, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { Column } from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import Avatar from "@/components/shared/Avatar";
import Modal from "@/components/shared/Modal";

interface Cargo { id: string; name: string; }
interface Empleado { id: string; docType: string; docNumber: string; firstName: string; lastName: string; email?: string; phone?: string; positionId?: string; status: string; position?: Cargo; }

export default function ListEmployeePage() {
  const [employees, setEmpleados] = useState<Empleado[]>([]);
  const [filtered, setFiltered] = useState<Empleado[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Empleado | null>(null);
  const [form, setForm] = useState<Partial<Empleado>>({});
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [empsRes, cgsRes] = await Promise.all([fetch("/api/employees"), fetch("/api/positions")]);
    setEmpleados(await empsRes.json());
    setCargos(await cgsRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(employees.filter((e) => `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) || e.docNumber.includes(q)));
  }, [search, employees]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form };
    if (editing) {
      await fetch(`/api/employees/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      await fetch("/api/employees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, status: "Activo" }) });
    }
    setSaving(false); setModalOpen(false); fetchAll();
  }

  const set = (key: keyof Empleado, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const columns: Column<Empleado>[] = [
    { key: "firstName", header: "Empleado", render: (row) => (
      <div className="flex items-center gap-3">
        <Avatar firstName={row.firstName} lastName={row.lastName} />
        <div>
          <p className="font-medium text-gray-800 dark:text-slate-100">{row.firstName} {row.lastName}</p>
          <p className="text-xs text-gray-400">{row.position?.name}</p>
        </div>
      </div>
    )},
    { key: "docNumber", header: "Identificacion", render: (row) => (
      <div><span className="font-semibold text-xs uppercase block">{row.docType}</span><span className="text-gray-600 dark:text-slate-300">{row.docNumber}</span></div>
    )},
    { key: "phone", header: "Telefono", render: (row) => <span className="text-gray-500 dark:text-slate-400">{row.phone ?? "-"}</span> },
    { key: "email", header: "Correo", render: (row) => <span className="text-gray-500 dark:text-slate-400 text-sm">{row.email ?? "-"}</span> },
    { key: "status", header: "Estado", render: (row) => <StatusBadge status={row.status} /> },
    { key: "acciones", header: "", render: (row) => (
      <div className="flex gap-2">
        <button className="btn-edit" onClick={() => { setEditing(row); setForm(row); setModalOpen(true); }}><Pencil size={14} /></button>
        <button className="btn-delete" onClick={async () => { if (confirm("¿Eliminar?")) { await fetch(`/api/employees/${row.id}`, { method: "DELETE" }); fetchAll(); } }}><Trash2 size={14} /></button>
      </div>
    )},
  ];

  return (
    <>
      <PageHeader icon={Briefcase} title="Empleados" description="Añade y gestiona a tus employees."
        action={<button className="btn-primary" onClick={() => { setEditing(null); setForm({ docType: "DNI" }); setModalOpen(true); }}><Plus size={16} /> Registrar employee</button>}
      />
      <DataTable columns={columns} data={filtered} loading={loading} searchPlaceholder="Buscar Empleado ..." onSearch={setSearch} searchValue={search} />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Modificar Empleado" : "Registrar Empleado"}>
        <form onSubmit={handleSave} className="space-y-4">
          <p className="form-section-title">Datos Personales</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative"><label className="form-label">Tipo de Documento</label>
              <select className="form-select" value={form.docType ?? "DNI"} onChange={(e) => set("docType", e.target.value)}>
                {["DNI","RUC","CE","PASAPORTE"].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="relative"><label className="form-label">Nro de Documento</label>
              <input className="form-input" value={form.docNumber ?? ""} onChange={(e) => set("docNumber", e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative"><label className="form-label">Nombres</label>
              <input className="form-input" value={form.firstName ?? ""} onChange={(e) => set("firstName", e.target.value)} required />
            </div>
            <div className="relative"><label className="form-label">Apellidos</label>
              <input className="form-input" value={form.lastName ?? ""} onChange={(e) => set("lastName", e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative"><label className="form-label">Cargo</label>
              <select className="form-select" value={form.positionId ?? ""} onChange={(e) => set("positionId", e.target.value || undefined)}>
                <option value="">Seleccionar</option>
                {cargos.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="relative"><label className="form-label">Telefono</label>
              <input className="form-input" value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
            </div>
          </div>
          <div className="relative"><label className="form-label">Correo Electronico</label>
            <input type="email" className="form-input" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
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
