import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const subscriptions = await prisma.subscription.findMany({
    include: {
      client: { select: { firstName: true, lastName: true } },
      plan: { select: { name: true, monthlyPrice: true } },
      installation: { select: { installationAddress: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(subscriptions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  // Convertir fechas string a Date
  if (body.startDate) body.startDate = new Date(body.startDate);
  if (body.endDate) body.endDate = new Date(body.endDate);
  const sub = await prisma.subscription.create({
    data: body,
    include: { client: { select: { firstName: true, lastName: true } }, plan: { select: { name: true } } },
  });
  return NextResponse.json(sub, { status: 201 });
}
