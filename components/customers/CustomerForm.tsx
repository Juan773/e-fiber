"use client";

import { useState } from "react";
import { Save } from "lucide-react";

type TipoDocumento = "DNI" | "RUC" | "CE" | "PASAPORTE";
type Genero = "Masculino" | "Femenino" | "Otro";
type EstadoCivil = "Soltero" | "Casado" | "Divorciado" | "Viudo" | "Conviviente";
type Ocupacion = "Hogar" | "Dependiente" | "Independiente" | "Empresario" | "Estudiante" | "Otro";

interface FormData {
  docType: TipoDocumento;
  docNumber: string;
  firstName: string;
  lastName: string;
  gender?: Genero;
  birthDate?: string;
  maritalStatus?: EstadoCivil;
  address?: string;
  occupation?: Ocupacion;
  email?: string;
  phone?: string;
  emergencyPhone?: string;
}

interface CustomerFormProps {
  initial?: Partial<FormData>;
  onSubmit: (data: Partial<FormData>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

export default function CustomerForm({ initial = {}, onSubmit, onCancel, loading }: CustomerFormProps) {
  const [form, setForm] = useState<Partial<FormData>>({
    docType: "DNI",
    firstName: "",
    lastName: "",
    docNumber: "",
    ...initial,
  });

  const set = (key: keyof FormData, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="form-section-title">Datos Personales</p>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo de Documento">
          <select className="form-select" value={form.docType} onChange={(e) => set("docType", e.target.value)}>
            {(["DNI","RUC","CE","PASAPORTE"] as TipoDocumento[]).map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Nro de Documento">
          <input className="form-input" value={form.docNumber ?? ""} onChange={(e) => set("docNumber", e.target.value)} required />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Nombres">
          <input className="form-input" value={form.firstName ?? ""} onChange={(e) => set("firstName", e.target.value)} required />
        </Field>
        <Field label="Apellidos">
          <input className="form-input" value={form.lastName ?? ""} onChange={(e) => set("lastName", e.target.value)} required />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Genero">
          <select className="form-select" value={form.gender ?? ""} onChange={(e) => set("gender", e.target.value || undefined)}>
            <option value="">Seleccionar</option>
            {(["Masculino","Femenino","Otro"] as Genero[]).map((g) => <option key={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="Fecha de Nacimiento">
          <input type="date" className="form-input" value={form.birthDate ?? ""} onChange={(e) => set("birthDate", e.target.value || undefined)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Estado Civil">
          <select className="form-select" value={form.maritalStatus ?? ""} onChange={(e) => set("maritalStatus", e.target.value || undefined)}>
            <option value="">Seleccionar</option>
            {(["Soltero","Casado","Divorciado","Viudo","Conviviente"] as EstadoCivil[]).map((e) => <option key={e}>{e}</option>)}
          </select>
        </Field>
        <Field label="Direccion">
          <input className="form-input" value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
        </Field>
      </div>

      <p className="form-section-title">Datos de Contacto</p>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Ocupacion">
          <select className="form-select" value={form.occupation ?? ""} onChange={(e) => set("occupation", e.target.value || undefined)}>
            <option value="">Seleccionar</option>
            {(["Hogar","Dependiente","Independiente","Empresario","Estudiante","Otro"] as Ocupacion[]).map((o) => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Correo Electronico">
          <input type="email" className="form-input" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Telefono">
          <input type="tel" className="form-input" value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="Telefono de Emergencia">
          <input type="tel" className="form-input" value={form.emergencyPhone ?? ""} onChange={(e) => set("emergencyPhone", e.target.value)} />
        </Field>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1 justify-center">Volver atrás</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
          <Save size={15} /> {loading ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}
