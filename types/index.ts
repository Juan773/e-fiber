// ─── Auth & Users ───────────────────────────────────────────────────────────
export type UserRole = "admin" | "tecnico" | "vendedor";

export interface AppUser {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

// ─── Geo ─────────────────────────────────────────────────────────────────────
export interface Pais {
  id: number;
  nombre: string;
}
export interface Departamento {
  id: number;
  pais_id: number;
  nombre: string;
}
export interface Provincia {
  id: number;
  departamento_id: number;
  nombre: string;
}
export interface Distrito {
  id: number;
  provincia_id: number;
  nombre: string;
}

// ─── Clientes ────────────────────────────────────────────────────────────────
export type TipoDocumento = "DNI" | "RUC" | "CE" | "PASAPORTE";
export type Genero = "Masculino" | "Femenino" | "Otro";
export type EstadoCivil = "Soltero" | "Casado" | "Divorciado" | "Viudo" | "Conviviente";
export type EstadoCliente = "Activo" | "Inactivo" | "Suspendido";
export type Ocupacion = "Hogar" | "Dependiente" | "Independiente" | "Empresario" | "Estudiante" | "Otro";

export interface Cliente {
  id: string;
  tipo_documento: TipoDocumento;
  nro_documento: string;
  nombres: string;
  apellidos: string;
  genero?: Genero;
  fecha_nacimiento?: string;
  estado_civil?: EstadoCivil;
  direccion?: string;
  pais_id?: number;
  departamento_id?: number;
  provincia_id?: number;
  distrito_id?: number;
  ocupacion?: Ocupacion;
  correo?: string;
  telefono?: string;
  telefono_emergencia?: string;
  estado: EstadoCliente;
  user_id?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  // joins
  pais?: Pais;
  departamento?: Departamento;
  provincia?: Provincia;
  distrito?: Distrito;
}

// ─── Empleados ───────────────────────────────────────────────────────────────
export interface Cargo {
  id: string;
  nombre: string;
  descripcion?: string;
  created_at: string;
}

export interface Empleado {
  id: string;
  tipo_documento: TipoDocumento;
  nro_documento: string;
  nombres: string;
  apellidos: string;
  genero?: Genero;
  fecha_nacimiento?: string;
  estado_civil?: EstadoCivil;
  direccion?: string;
  pais_id?: number;
  departamento_id?: number;
  provincia_id?: number;
  distrito_id?: number;
  correo?: string;
  telefono?: string;
  cargo_id?: string;
  estado: "Activo" | "Inactivo";
  user_id?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  // joins
  cargo?: Cargo;
}

// ─── Activos ─────────────────────────────────────────────────────────────────
export interface TipoActivo {
  id: string;
  nombre: string;
  descripcion?: string;
  created_at: string;
}

export interface UnidadMedida {
  id: string;
  nombre: string;
  abreviatura: string;
  created_at: string;
}

export interface Activo {
  id: string;
  nombre: string;
  tipo_activo_id: string;
  unidad_medida_id?: string;
  descripcion?: string;
  stock: number;
  precio_unitario?: number;
  estado: "Activo" | "Inactivo";
  created_at: string;
  updated_at: string;
  // joins
  tipo_activo?: TipoActivo;
  unidad_medida?: UnidadMedida;
}

// ─── Planes ──────────────────────────────────────────────────────────────────
export interface Plan {
  id: string;
  nombre: string;
  descripcion?: string;
  velocidad_mbps: number;
  precio_mensual: number;
  estado: "Activo" | "Inactivo";
  created_at: string;
}

// ─── Instalaciones ───────────────────────────────────────────────────────────
export type EstadoInstalacion =
  | "Pendiente"
  | "En Proceso"
  | "Completada"
  | "Cancelada";

export interface Instalacion {
  id: string;
  cliente_id: string;
  empleado_id?: string;
  plan_id: string;
  direccion_instalacion: string;
  pais_id?: number;
  departamento_id?: number;
  provincia_id?: number;
  distrito_id?: number;
  fecha_programada?: string;
  fecha_completada?: string;
  estado: EstadoInstalacion;
  observaciones?: string;
  created_at: string;
  updated_at: string;
  // joins
  cliente?: Cliente;
  empleado?: Empleado;
  plan?: Plan;
}

// ─── Subscripciones ──────────────────────────────────────────────────────────
export type EstadoSubscripcion =
  | "Activa"
  | "Vencida"
  | "Suspendida"
  | "Cancelada";

export interface Subscripcion {
  id: string;
  cliente_id: string;
  instalacion_id: string;
  plan_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  precio_mensual: number;
  estado: EstadoSubscripcion;
  created_at: string;
  updated_at: string;
  // joins
  cliente?: Cliente;
  instalacion?: Instalacion;
  plan?: Plan;
}

// ─── Prórrogas ───────────────────────────────────────────────────────────────
export interface Prorroga {
  id: string;
  subscripcion_id: string;
  fecha_inicio_anterior: string;
  fecha_fin_anterior: string;
  nueva_fecha_fin: string;
  motivo?: string;
  aprobado_por?: string;
  created_at: string;
  // joins
  subscripcion?: Subscripcion;
}

// ─── Facturación ─────────────────────────────────────────────────────────────
export type TipoComprobante = "BOLETA" | "FACTURA";
export type EstadoComprobante =
  | "Borrador"
  | "Emitido"
  | "Anulado"
  | "Error";

export interface ItemComprobante {
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  igv: number;
  subtotal: number;
}

export interface Comprobante {
  id: string;
  tipo: TipoComprobante;
  serie: string;
  correlativo: number;
  cliente_id: string;
  subscripcion_id?: string;
  items: ItemComprobante[];
  subtotal: number;
  igv: number;
  total: number;
  estado: EstadoComprobante;
  nubefact_id?: string;
  enlace_pdf?: string;
  enlace_xml?: string;
  fecha_emision: string;
  created_at: string;
  updated_at: string;
  // joins
  cliente?: Cliente;
}

// ─── Shared ──────────────────────────────────────────────────────────────────
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  error?: string;
}
