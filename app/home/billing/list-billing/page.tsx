"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Plus, ExternalLink, XCircle } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { Column } from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import Modal from "@/components/shared/Modal";

interface Cliente { id: string; firstName: string; lastName: string; docType: string; docNumber: string; }
interface Plan { id: string; name: string; monthlyPrice: number; }
interface Sub { id: string; clientId: string; client?: Cliente; plan?: Plan; endDate: string; }
interface Comprobante {
  id: string; type: string; series: string; sequential: number;
  clientId: string; status: string; subtotal: number; igv: number; total: number;
  issueDate: string; pdfUrl?: string; client?: Cliente;
}

function calcIGV(sub: number) { return parseFloat(((sub * 18) / 100).toFixed(2)); }

export default function ListBillingPage() {
  const [items, setItems] = useState<Comprobante[]>([]);
  const [filtered, setFiltered] = useState<Comprobante[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [emitting, setEmitting] = useState(false);
  const [form, setForm] = useState({ type: "BOLETA" as "BOLETA" | "FACTURA", clientId: "", subscriptionId: "", description: "", cantidad: 1, unitPrice: 0 });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [compRes, clsRes, subRes] = await Promise.all([
      fetch("/api/invoices"), fetch("/api/clients"), fetch("/api/subscriptions"),
    ]);
    setItems(await compRes.json()); setClientes(await clsRes.json()); setSubs(await subRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(items.filter((i) => {
      const c = i.client;
      return !q || (c ? `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) : false) || `${i.series}-${i.sequential}`.includes(q);
    }));
  }, [search, items]);

  async function handleEmitir(e: React.FormEvent) {
    e.preventDefault(); setEmitting(true);
    const subtotal = form.cantidad * form.unitPrice;
    const igv = calcIGV(subtotal);
    const total = subtotal + igv;
    await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: form.type, clientId: form.clientId,
        subscriptionId: form.subscriptionId || undefined,
        items: [{ description: form.description, cantidad: form.cantidad, unitPrice: form.unitPrice, igv, subtotal }],
        subtotal, igv, total, status: "Emitido",
      }),
    });
    setEmitting(false); setModalOpen(false);
    setForm({ type: "BOLETA", clientId: "", subscriptionId: "", description: "", cantidad: 1, unitPrice: 0 });
    fetchAll();
  }

  const subtotal = form.cantidad * form.unitPrice;
  const igv = calcIGV(subtotal);

  const columns: Column<Comprobante>[] = [
    { key: "comprobante", header: "Comprobante", render: (row) => (
      <div>
        <span className="font-semibold text-gray-800">{row.series}-{String(row.sequential).padStart(8,"0")}</span>
        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${row.type === "BOLETA" ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"}`}>{row.type}</span>
      </div>
    )},
    { key: "client", header: "Cliente", render: (row) => <span className="font-medium text-gray-700">{row.client ? `${row.client.firstName} ${row.client.lastName}` : "-"}</span> },
    { key: "issueDate", header: "Fecha", render: (row) => <span className="text-gray-500 dark:text-slate-400 text-sm">{new Date(row.issueDate).toLocaleDateString("es-PE")}</span> },
    { key: "total", header: "Total", render: (row) => <span className="font-bold text-gray-800 dark:text-slate-100">S/. {Number(row.total).toFixed(2)}</span> },
    { key: "status", header: "Estado", render: (row) => <StatusBadge status={row.status} /> },
    { key: "acciones", header: "", render: (row) => (
      <div className="flex gap-2">
        {row.pdfUrl && <a href={row.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn-edit p-2"><ExternalLink size={14} /></a>}
        {row.status === "Emitido" && (
          <button className="btn-delete" onClick={async () => {
            if (confirm("¿Anular comprobante?")) {
              await fetch(`/api/invoices/${row.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "Anulado" }) });
              fetchAll();
            }
          }}><XCircle size={14} /></button>
        )}
      </div>
    )},
  ];

  return (
    <>
      <PageHeader icon={FileText} title="Facturación" description="Emite boletas y facturas electrónicas SUNAT."
        action={<button className="btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} /> Emitir Comprobante</button>}
      />
      <DataTable columns={columns} data={filtered} loading={loading} searchPlaceholder="Buscar comprobante..." onSearch={setSearch} searchValue={search} />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Emitir Comprobante" subtitle="Boleta o Factura Electrónica">
        <form onSubmit={handleEmitir} className="space-y-4">
          <p className="form-section-title">Tipo de Comprobante</p>
          <div className="flex gap-3">
            {(["BOLETA","FACTURA"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, type: t }))}
                className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${form.type === t ? "border-orange-400 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" : "border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:border-gray-300"}`}>
                {t}
              </button>
            ))}
          </div>
          <p className="form-section-title">Datos del Cliente</p>
          <div className="relative"><label className="form-label">Cliente</label>
            <select className="form-select" value={form.clientId} onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))} required>
              <option value="">Seleccionar client</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.docType} {c.docNumber}</option>)}
            </select>
          </div>
          <div className="relative"><label className="form-label">Subscripción (opcional)</label>
            <select className="form-select" value={form.subscriptionId} onChange={(e) => {
              const sub = subs.find((s) => s.id === e.target.value);
              setForm((f) => ({
                ...f, subscriptionId: e.target.value,
                clientId: sub?.clientId ?? f.clientId,
                description: sub?.plan ? `Servicio fibra óptica — ${sub.plan.name}` : f.description,
                unitPrice: sub?.plan ? Number(sub.plan.monthlyPrice) : f.unitPrice,
              }));
            }}>
              <option value="">Ninguna</option>
              {subs.map((s) => <option key={s.id} value={s.id}>{s.client ? `${s.client.firstName} ${s.client.lastName}` : s.id} — {s.plan?.name}</option>)}
            </select>
          </div>
          <p className="form-section-title">Detalle del Servicio</p>
          <div className="relative"><label className="form-label">Descripción</label>
            <input className="form-input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required placeholder="Servicio de fibra óptica..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative"><label className="form-label">Cantidad</label>
              <input type="number" min={1} className="form-input" value={form.cantidad} onChange={(e) => setForm((f) => ({ ...f, cantidad: Number(e.target.value) }))} />
            </div>
            <div className="relative"><label className="form-label">Precio Unitario (S/.)</label>
              <input type="number" step="0.01" min={0} className="form-input" value={form.unitPrice} onChange={(e) => setForm((f) => ({ ...f, unitPrice: Number(e.target.value) }))} required />
            </div>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>S/. {subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-600"><span>IGV (18%)</span><span>S/. {igv.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-gray-800 text-base border-t border-orange-200 pt-1.5 mt-1"><span>Total</span><span>S/. {(subtotal + igv).toFixed(2)}</span></div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={emitting} className="btn-primary flex-1 justify-center"><FileText size={15} />{emitting ? "Emitiendo..." : "Emitir Comprobante"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
