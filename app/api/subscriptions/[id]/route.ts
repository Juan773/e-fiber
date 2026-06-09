import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  if (body.startDate) body.startDate = new Date(body.startDate);
  if (body.endDate) body.endDate = new Date(body.endDate);
  const sub = await prisma.subscription.update({ where: { id: params.id }, data: body });
  return NextResponse.json(sub);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.subscription.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
