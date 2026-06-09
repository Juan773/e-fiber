import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const extensions = await prisma.extension.findMany({
    include: {
      subscription: {
        include: { client: { select: { firstName: true, lastName: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(extensions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { subscriptionId, newEndDate, reason } = body;

  const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) return NextResponse.json({ error: "Subscripción no encontrada" }, { status: 404 });

  const extension = await prisma.extension.create({
    data: {
      subscriptionId,
      previousStartDate: sub.startDate,
      previousEndDate: sub.endDate,
      newEndDate: new Date(newEndDate),
      reason,
    },
  });

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { endDate: new Date(newEndDate) },
  });

  return NextResponse.json(extension, { status: 201 });
}
