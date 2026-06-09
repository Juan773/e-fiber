import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const activo = await prisma.asset.update({ where: { id: params.id }, data: body, include: { assetType: true, measureUnit: true } });
  return NextResponse.json(activo);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.asset.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
