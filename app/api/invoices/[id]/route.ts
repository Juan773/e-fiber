import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const comp = await prisma.invoice.update({ where: { id: params.id }, data: body });
  return NextResponse.json(comp);
}
