import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
  const finMes = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [
    totalClientes,
    clientesActivos,
    instalacionesPendientes,
    subscripcionesActivas,
    subscripcionesVencidas,
    compsMes,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { status: "Activo" } }),
    prisma.installation.count({ where: { status: "Pendiente" } }),
    prisma.subscription.count({ where: { status: "Activa" } }),
    prisma.subscription.count({ where: { status: "Vencida" } }),
    prisma.invoice.findMany({
      where: { status: "Emitido", issueDate: { gte: inicioMes, lte: finMes } },
      select: { total: true },
    }),
  ]);

  const ingresosMes = compsMes.reduce((sum, c) => sum + Number(c.total), 0);

  return NextResponse.json({
    totalClientes,
    clientesActivos,
    instalacionesPendientes,
    subscripcionesActivas,
    subscripcionesVencidas,
    ingresosMes,
    comprobantesMes: compsMes.length,
  });
}
