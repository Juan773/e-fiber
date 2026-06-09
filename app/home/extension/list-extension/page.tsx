"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { Column } from "@/components/shared/DataTable";
import Modal from "@/components/shared/Modal";

interface Prorroga {
  id: string; subscriptionId: string;
  previousStartDate: string; previousEndDate: string; newEndDate: string;
  reason?: string; createdAt: string;
  subscription?: { client?: { firstName: string; lastName: string } };
}
interface SubActiva { id: string; endDate: string; status?: string; client?: { firstName: string; lastName: string }; }

export default function ListExtensionPage() {
  const [items, setItems] = useState<Prorroga[]>([]);
  const [subs, setSubs] = useState<SubActiva[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ subscriptionId: "", newEndDate: "", reason: "" });
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [prRes, subRes] = await Promise.all([fetch("/api/extensions"), fetch("/api/subscriptions")]);
    setItems(await prRes.json());
    const allSubs: SubActiva[] = await subRes.json();
    setSubs(allSubs.filter((s) => s.status === "Activa"));
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    await fetch("/api/extensions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false); setModalOpen(false); setForm({ subscriptionId: "", newEndDate: "", reason: "" }); fetchAll();
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString("es-PE");

  const columns: Column<Prorroga>[] = [
    { key: "subscription", header: "Cliente", render: (row) => {
      const c = row.subscription?.client;
      return <span className="font-medium text-gray-800 dark:text-slate-100">{c ? `${c.firstName} ${c.lastName}` : "-"}</span>;
    }},
    { key: "previousEndDate", header: "Fecha Fin Anterior", render: (row) => <span className="text-gray-500 dark:text-slate-400 text-sm">{fmt(row.previousEndDate)}</span> },
    { key: "newEndDate", header: "Nueva Fecha Fin", render: (row) => <span className="font-semibold text-orange-500 text-sm">{fmt(row.newEndDate)}</span> },
    { key: "reason", header: "Motivo", render: (row) => <span className="text-gray-500 dark:text-slate-400 text-sm">{row.reason ?? "-"}</span> },
    { key: "createdAt", header: "Registrado", render: (row) => <span className="text-gray-500 dark:text-slate-400 text-sm">{fmt(row.createdAt)}</span> },
    { key: "acciones", header: "", render: (row) => (
      <button className="btn-delete" onClick={async () => { if (confirm("¿Eliminar prórroga?")) { await fetch(`/api/extensions/${row.id}`, { method: "DELETE" }); fetchAll(); } }}><Trash2 size={14} /></button>
    )},
  ];

  return (
    <>
      <PageHeader icon={RefreshCw} title="Prórrogas" description="Gestiona las extensiones de subscriptions."
        action={<button className="btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} /> Nueva Prórroga</button>}
      />
      <DataTable columns={columns} data={items} loading={loading} searchPlaceholder="Buscar..." onSearch={() => {}} />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Prórroga" subtitle="Extiende la fecha de vencimiento">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="relative"><label className="form-label">Subscripción (Cliente)</label>
            <select className="form-select" value={form.subscriptionId} onChange={(e) => setForm((f) => ({ ...f, subscriptionId: e.target.value }))} required>
              <option value="">Seleccionar subscripción activa</option>
              {subs.map((s) => {
                const c = s.client;
                return <option key={s.id} value={s.id}>{c ? `${c.firstName} ${c.lastName}` : s.id} — vence {fmt(s.endDate)}</option>;
              })}
            </select>
          </div>
          <div className="relative"><label className="form-label">Nueva Fecha de Vencimiento</label>
            <input type="date" className="form-input" value={form.newEndDate} onChange={(e) => setForm((f) => ({ ...f, newEndDate: e.target.value }))} required />
          </div>
          <div className="relative"><label className="form-label">Motivo</label>
            <textarea className="form-input min-h-[80px] resize-none" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Razón de la prórroga..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? "Guardando..." : "Aplicar Prórroga"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
