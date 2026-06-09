import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search") ?? "";
  const assets = await prisma.asset.findMany({
    where: search ? { name: { contains: search } } : undefined,
    include: { assetType: true, measureUnit: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(assets);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const activo = await prisma.asset.create({ data: body, include: { assetType: true, measureUnit: true } });
  return NextResponse.json(activo, { status: 201 });
}
