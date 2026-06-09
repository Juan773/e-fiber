import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const month = req.nextUrl.searchParams.get("month");
  const year = req.nextUrl.searchParams.get("year");
  const status = req.nextUrl.searchParams.get("status");
  const clientId = req.nextUrl.searchParams.get("clientId");

  const payments = await prisma.payment.findMany({
    where: {
      ...(month ? { month: Number(month) } : {}),
      ...(year ? { year: Number(year) } : {}),
      ...(status ? { status } : {}),
      ...(clientId
        ? { subscription: { clientId } }
        : {}),
    },
    include: {
      subscription: {
        include: {
          client: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
          plan: { select: { name: true, monthlyPrice: true } },
          installation: { select: { installationAddress: true } },
        },
      },
    },
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });

  // Marcar automáticamente como Vencido si ya pasó la fecha y sigue Pendiente
  const hoy = new Date();
  const actualizaciones: string[] = [];
  for (const p of payments) {
    if (p.status === "Pendiente" && p.dueDate < hoy) {
      actualizaciones.push(p.id);
    }
  }
  if (actualizaciones.length > 0) {
    await prisma.payment.updateMany({
      where: { id: { in: actualizaciones } },
      data: { status: "Vencido" },
    });
    // Refrescar estados en memoria
    for (const p of payments) {
      if (actualizaciones.includes(p.id)) p.status = "Vencido";
    }
  }

  return NextResponse.json(payments);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const payment = await prisma.payment.create({
    data: {
      ...body,
      dueDate: new Date(body.dueDate),
      paymentDate: body.paymentDate ? new Date(body.paymentDate) : undefined,
    },
    include: {
      subscription: {
        include: {
          client: { select: { firstName: true, lastName: true } },
          plan: { select: { name: true } },
        },
      },
    },
  });
  return NextResponse.json(payment, { status: 201 });
}
