"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Plus, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { Column } from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import Avatar from "@/components/shared/Avatar";
import Modal from "@/components/shared/Modal";
import CustomerForm from "@/components/customers/CustomerForm";

interface Cliente {
  id: string;
  docType: string;
  docNumber: string;
  firstName: string;
  lastName: string;
  gender?: string;
  birthDate?: string;
  maritalStatus?: string;
  address?: string;
  occupation?: string;
  email?: string;
  phone?: string;
  emergencyPhone?: string;
  status: string;
}

export default function ListCustomerPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filtered, setFiltered] = useState<Cliente[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/clients");
    const data = await res.json();
    setClientes(data);
    setFiltered(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      clientes.filter((c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.docNumber.includes(q)
      )
    );
  }, [search, clientes]);

  async function handleSave(form: Partial<Cliente>) {
    setSaving(true);
    if (editing) {
      await fetch(`/api/clients/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    } else {
      await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, status: "Activo" }) });
    }
    setSaving(false);
    setModalOpen(false);
    setEditing(null);
    fetchClientes();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este client?")) return;
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    fetchClientes();
  }

  const columns: Column<Cliente>[] = [
    {
      key: "firstName", header: "Cliente",
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar firstName={row.firstName} lastName={row.lastName} />
          <span className="font-medium text-gray-800 dark:text-slate-100">{row.firstName} {row.lastName}</span>
        </div>
      ),
    },
    {
      key: "docNumber", header: "Identificacion",
      render: (row) => (
        <div>
          <span className="font-semibold text-gray-700 text-xs uppercase block">{row.docType}</span>
          <span className="text-gray-600 dark:text-slate-300">{row.docNumber}</span>
        </div>
      ),
    },
    {
      key: "phone", header: "Telefono",
      render: (row) => <span className="text-gray-500 dark:text-slate-400">{row.phone ?? "-"}</span>,
    },
    {
      key: "email", header: "Correo",
      render: (row) => <span className="text-gray-500 dark:text-slate-400 text-sm">{row.email ?? "-"}</span>,
    },
    {
      key: "status", header: "Estado",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "acciones", header: "",
      render: (row) => (
        <div className="flex gap-2">
          <button className="btn-edit" onClick={() => { setEditing(row); setModalOpen(true); }}>
            <Pencil size={14} />
          </button>
          <button className="btn-delete" onClick={() => handleDelete(row.id)}>
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        icon={Users}
        title="Clientes"
        description="Añade y gestiona a tus clientes."
        action={
          <button className="btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus size={16} /> Registrar client
          </button>
        }
      />

      <DataTable
        columns={columns} data={filtered} loading={loading}
        searchPlaceholder="Buscar Cliente ..." onSearch={setSearch} searchValue={search}
      />

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? "Modificar Cliente" : "Registrar Cliente"}
        subtitle="Ingrese la informacion del client ..."
      >
        <CustomerForm
          initial={editing ? {
            docType: editing.docType as never,
            docNumber: editing.docNumber,
            firstName: editing.firstName,
            lastName: editing.lastName,
            gender: editing.gender as never,
            maritalStatus: editing.maritalStatus as never,
            address: editing.address,
            occupation: editing.occupation as never,
            email: editing.email,
            phone: editing.phone,
            emergencyPhone: editing.emergencyPhone,
          } : {}}
          onSubmit={handleSave}
          onCancel={() => { setModalOpen(false); setEditing(null); }}
          loading={saving}
        />
      </Modal>
    </>
  );
}
