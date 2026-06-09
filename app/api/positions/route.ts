import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const cargos = await prisma.position.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(cargos);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const position = await prisma.position.create({ data: body });
  return NextResponse.json(position, { status: 201 });
}
