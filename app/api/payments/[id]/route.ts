import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  // Si se está registrando el payment, fijar paymentDate y status
  if (body.accion === "pagar") {
    const payment = await prisma.payment.update({
      where: { id: params.id },
      data: {
        status: "Pagado",
        paymentDate: new Date(),
        paymentMethod: body.paymentMethod ?? "Efectivo",
        notes: body.notes,
        lateFee: body.lateFee !== undefined ? body.lateFee : undefined,
        discount: body.discount !== undefined ? body.discount : undefined,
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
    return NextResponse.json(payment);
  }

  // Ajuste general (lateFee, discount, notes, notified, notificationStage)
  const payment = await prisma.payment.update({
    where: { id: params.id },
    data: {
      ...(body.lateFee !== undefined && { lateFee: body.lateFee }),
      ...(body.discount !== undefined && { discount: body.discount }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.notified !== undefined && { notified: body.notified }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.notificationStage !== undefined && { notificationStage: body.notificationStage }),
      ...(body.lastNotifiedAt !== undefined && { lastNotifiedAt: new Date(body.lastNotifiedAt) }),
    },
  });
  return NextResponse.json(payment);
}
