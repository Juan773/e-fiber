/**
 * Nubefact API Client
 * OSE (Operador de Servicios Electrónicos) para SUNAT Perú
 * Docs: https://www.nubefact.com/integracion-sistema/
 */

const NUBEFACT_URL = process.env.NUBEFACT_URL!; // https://api.nubefact.com/api/v1/{ruc}
const NUBEFACT_TOKEN = process.env.NUBEFACT_TOKEN!;

export interface NubefactItem {
  unidad_de_medida: string;        // "NIU" para unidades
  codigo: string;
  descripcion: string;
  cantidad: number;
  valor_unitario: number;
  precio_unitario: number;
  descuento: string;
  subtotal: string;
  tipo_de_igv: number;             // 1 = Gravado operación onerosa
  igv: string;
  total: string;
  anticipo_regularizacion: boolean;
  anticipo_documento_serie: string;
  anticipo_documento_numero: string;
}

export interface NubefactComprobante {
  operacion: "generar_comprobante";
  tipo_de_comprobante: 1 | 2;      // 1 = Factura, 2 = Boleta
  serie: string;                   // "B001" boleta, "F001" factura
  numero: number;
  sunat_transaction: number;       // 1 = venta interna
  cliente_tipo_de_documento: number; // 1=DNI, 6=RUC
  cliente_numero_de_documento: string;
  cliente_denominacion: string;
  cliente_direccion: string;
  cliente_email: string;
  cliente_email_1: string;
  cliente_email_2: string;
  fecha_de_emision: string;        // "dd/mm/yyyy"
  fecha_de_vencimiento: string;
  moneda: number;                  // 1 = Soles
  tipo_de_cambio: string;
  porcentaje_de_igv: number;       // 18
  descuento_global: string;
  total_descuento: string;
  total_anticipo: string;
  total_gravada: string;
  total_inafecta: string;
  total_exonerada: string;
  total_igv: string;
  total_gratuita: string;
  total_otros_cargos: string;
  total: string;
  percepcion_tipo: string;
  percepcion_base_imponible: string;
  total_percepcion: string;
  total_incluido_percepcion: string;
  detraccion: boolean;
  observaciones: string;
  documento_que_se_modifica_tipo: number;
  documento_que_se_modifica_serie: string;
  documento_que_se_modifica_numero: string;
  tipo_de_nota_de_credito: string;
  tipo_de_nota_de_debito: string;
  enviar_automaticamente_a_la_sunat: boolean;
  enviar_automaticamente_al_cliente: boolean;
  codigo_unico: string;
  condiciones_de_pago: string;
  medio_de_pago: string;
  placa_vehiculo: string;
  orden_compra_servicio: string;
  tabla_personalizada_codigo: string;
  formato_de_pdf: string;
  items: NubefactItem[];
}

export interface NubefactResponse {
  enlace_del_pdf: string;
  enlace_del_xml: string;
  enlace_del_cdr: string;
  numero: number;
  serie: string;
  codigo_hash: string;
  aceptada_por_sunat: boolean;
  sunat_description: string;
  sunat_note: string;
  cadena_para_codigo_qr: string;
  codigo: number;
  errors: string[];
  sunat_responsecode: string;
  advertencias: string[];
}

export async function emitirComprobante(
  data: NubefactComprobante
): Promise<NubefactResponse> {
  const res = await fetch(NUBEFACT_URL, {
    method: "POST",
    headers: {
      Authorization: `Token token="${NUBEFACT_TOKEN}"`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Nubefact error ${res.status}: ${err}`);
  }
  return res.json();
}

/** Convierte tipo de documento de cliente al código Nubefact */
export function tipoDocToNubefact(tipo: string): number {
  const map: Record<string, number> = {
    DNI: 1,
    CE: 4,
    RUC: 6,
    PASAPORTE: 7,
  };
  return map[tipo] ?? 0;
}

/** Formatea fecha a dd/mm/yyyy */
export function formatFechaNubefact(date: Date | string): string {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}
