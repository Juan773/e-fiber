import { prisma } from "@/lib/db";

/**
 * Etapas de cobranza basadas en el día del mes (no en días de mora):
 *
 * Etapa 0 — Sin notificación
 * Etapa 1 — Día 27: Envío de recibos a TODOS los clientes
 * Etapa 2 — Día 1:  Aviso de cobranza a TODOS los clientes
 * Etapa 3 — Día 10: Último día de pago (solo deudores)
 * Etapa 4 — Día 11: Suspensión del servicio (solo deudores)
 * Etapa 5 — Día 15: Retiro de equipos (solo deudores)
 */

export interface BillingStageInfo {
  stage: number;
  label: string;
  dayOfMonth: number;
  debtorsOnly: boolean;
  description: string;
}

export const BILLING_STAGES: BillingStageInfo[] = [
  { stage: 1, label: "Envío de recibos",          dayOfMonth: 27, debtorsOnly: false, description: "Se envían los recibos del próximo mes con el monto, medios de pago y solicitud de comprobante." },
  { stage: 2, label: "Aviso de cobranza",          dayOfMonth: 1,  debtorsOnly: false, description: "Recordatorio: hoy corresponde realizar el pago y enviar el comprobante al Área Financiera." },
  { stage: 3, label: "Último día de pago",         dayOfMonth: 10, debtorsOnly: true,  description: "Plazo de pago vencido. Enviar comprobante antes de finalizar el día para evitar suspensión." },
  { stage: 4, label: "Suspensión del servicio",    dayOfMonth: 11, debtorsOnly: true,  description: "Servicio suspendido por falta de pago. Reactivación: monto adeudado + S/10. Plazo: 5 días." },
  { stage: 5, label: "Retiro de equipos",          dayOfMonth: 15, debtorsOnly: true,  description: "El Área Técnica coordinará el recojo de equipos." },
];

/** Determina qué etapa corresponde hoy según el día del mes */
export function getStageForToday(): BillingStageInfo | null {
  const today = new Date();
  const day   = today.getDate();
  // Buscar la etapa que corresponde exactamente al día de hoy
  return BILLING_STAGES.find((s) => s.dayOfMonth === day) ?? null;
}

/** Devuelve la etapa más alta que ya debería haberse activado este mes */
export function getActiveStageForDay(dayOfMonth: number): number {
  const passed = BILLING_STAGES.filter((s) => s.dayOfMonth <= dayOfMonth);
  if (passed.length === 0) return 0;
  return Math.max(...passed.map((s) => s.stage));
}

export interface NotifyResult {
  stage: number | null;
  total: number;
  marked: number;
  details: Array<{ paymentId: string; clientName: string; stage: number }>;
}

/**
 * checkAndMark:
 * Evalúa el día actual, determina la etapa correspondiente,
 * y marca los pagos que aún no tienen esa etapa registrada.
 * (El envío real del mensaje se hace por canal separado — WhatsApp, correo, etc.)
 */
export async function checkAndMark(): Promise<NotifyResult> {
  const today    = new Date();
  const dayToday = today.getDate();
  const month    = today.getMonth() + 1;
  const year     = today.getFullYear();

  const stageInfo = getStageForToday();
  if (!stageInfo) {
    return { stage: null, total: 0, marked: 0, details: [] };
  }

  // Determinar qué pagos aplican
  // Para etapas de deudores (3,4,5): solo pagos Pendiente/Vencido del mes actual
  // Para etapas de todos (1,2): todos los pagos del mes siguiente/actual
  const whereStatus = stageInfo.debtorsOnly
    ? { status: { in: ["Pendiente", "Vencido"] } }
    : {};

  // Para etapa 1 (día 27): aplica a pagos del MES SIGUIENTE
  // Para etapas 2-5: aplica a pagos del mes actual
  let targetMonth = month;
  let targetYear  = year;
  if (stageInfo.stage === 1) {
    targetMonth = month === 12 ? 1 : month + 1;
    targetYear  = month === 12 ? year + 1 : year;
  }

  const payments = await prisma.payment.findMany({
    where: {
      month: targetMonth,
      year: targetYear,
      notificationStage: { lt: stageInfo.stage }, // no ha llegado a esta etapa aún
      ...whereStatus,
    },
    include: {
      subscription: {
        include: {
          client: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  const result: NotifyResult = {
    stage: stageInfo.stage,
    total: payments.length,
    marked: 0,
    details: [],
  };

  for (const payment of payments) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        notificationStage: stageInfo.stage,
        lastNotifiedAt: new Date(),
        notified: true,
        // Marcar suscripción como suspendida en etapa 4
        ...(stageInfo.stage === 4 && {
          subscription: {
            update: { status: "Suspendida", suspendedAt: new Date() },
          },
        }),
      },
    });

    result.marked++;
    result.details.push({
      paymentId: payment.id,
      clientName: `${payment.subscription.client.firstName} ${payment.subscription.client.lastName}`,
      stage: stageInfo.stage,
    });
  }

  return result;
}

/**
 * getPaymentsByStage:
 * Devuelve todos los pagos de un mes/año agrupados con su etapa actual
 * y cuál etapa debería tener hoy.
 */
export async function getPaymentStageStatus(month: number, year: number) {
  const today    = new Date();
  const dayToday = today.getDate();
  const activeStage = getActiveStageForDay(
    today.getMonth() + 1 === month && today.getFullYear() === year ? dayToday : 31
  );

  const payments = await prisma.payment.findMany({
    where: { month, year },
    include: {
      subscription: {
        include: {
          client: { select: { firstName: true, lastName: true, phone: true } },
          plan:   { select: { name: true, speedMbps: true } },
        },
      },
    },
  });

  return { payments, activeStage, stageInfo: BILLING_STAGES };
}
