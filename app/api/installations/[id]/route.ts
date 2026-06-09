import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addMonths, getDaysInMonth } from "date-fns";

/**
 * Genera los pagos de una suscripción:
 *
 * - Pago 0 (prorrateo): días restantes del mes de instalación
 *   amount = round((precio / días_del_mes) * días_restantes, 2)
 *   dueDate = fecha de instalación
 *
 * - Pagos 1..11: precio completo, dueDate = día 1 de cada mes siguiente
 */
async function generarPagos(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  subscriptionId: string,
  installationDate: Date,
  monthlyPrice: number
) {
  const payments: {
    subscriptionId: string;
    month: number;
    year: number;
    amount: number;
    dueDate: Date;
    status: string;
    isProrated: boolean;
  }[] = [];

  // ── Pago 0: prorrateo ─────────────────────────────────────────────────────
  const dayOfInstall    = installationDate.getDate();
  const totalDays       = getDaysInMonth(installationDate);
  const remainingDays   = totalDays - dayOfInstall + 1; // incluye hoy
  const proratedAmount  = Math.round((monthlyPrice / totalDays) * remainingDays * 100) / 100;

  payments.push({
    subscriptionId,
    month:      installationDate.getMonth() + 1,
    year:       installationDate.getFullYear(),
    amount:     proratedAmount,
    dueDate:    installationDate,
    status:     "Pendiente",
    isProrated: true,
  });

  // ── Pagos 1..11: día 1 de cada mes siguiente ──────────────────────────────
  for (let i = 1; i <= 11; i++) {
    const base    = addMonths(installationDate, i);
    const dueDate = new Date(base.getFullYear(), base.getMonth(), 1);
    payments.push({
      subscriptionId,
      month:      dueDate.getMonth() + 1,
      year:       dueDate.getFullYear(),
      amount:     monthlyPrice,
      dueDate,
      status:     "Pendiente",
      isProrated: false,
    });
  }

  for (const p of payments) {
    await tx.payment.upsert({
      where: {
        subscriptionId_month_year: {
          subscriptionId: p.subscriptionId,
          month: p.month,
          year:  p.year,
        },
      },
      update: {},
      create: p,
    });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  const instalacionActual = await prisma.installation.findUnique({
    where: { id: params.id },
    include: { plan: true },
  });

  if (!instalacionActual) {
    return NextResponse.json({ error: "Instalación no encontrada" }, { status: 404 });
  }

  const seCompleta =
    body.status === "Completada" && instalacionActual.status !== "Completada";

  if (seCompleta) {
    const result = await prisma.$transaction(async (tx) => {
      const completedDate = new Date();

      const installation = await tx.installation.update({
        where: { id: params.id },
        data: { ...body, completedDate },
      });

      const subExistente = await tx.subscription.findFirst({
        where: { installationId: params.id, status: { in: ["Activa", "Suspendida"] } },
      });

      let subscription = subExistente;

      if (!subExistente) {
        const startDate    = completedDate;
        const endDate      = addMonths(startDate, 12);
        const monthlyPrice = Number(instalacionActual.plan.monthlyPrice);

        subscription = await tx.subscription.create({
          data: {
            clientId:       instalacionActual.clientId,
            installationId: params.id,
            planId:         instalacionActual.planId,
            startDate,
            endDate,
            monthlyPrice,
            status: "Activa",
          },
        });

        await generarPagos(tx, subscription.id, startDate, monthlyPrice);
      }

      return { installation, subscriptionId: subscription?.id };
    });

    return NextResponse.json(result);
  }

  const installation = await prisma.installation.update({
    where: { id: params.id },
    data: body,
  });
  return NextResponse.json(installation);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.installation.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
