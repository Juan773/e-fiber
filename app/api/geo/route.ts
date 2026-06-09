import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const parentId = req.nextUrl.searchParams.get("parentId");

  if (type === "paises") {
    return NextResponse.json(await prisma.country.findMany({ orderBy: { name: "asc" } }));
  }
  if (type === "departments") {
    return NextResponse.json(await prisma.department.findMany({ where: parentId ? { countryId: Number(parentId) } : undefined, orderBy: { name: "asc" } }));
  }
  if (type === "provinces") {
    return NextResponse.json(await prisma.province.findMany({ where: parentId ? { departmentId: Number(parentId) } : undefined, orderBy: { name: "asc" } }));
  }
  if (type === "districts") {
    return NextResponse.json(await prisma.district.findMany({ where: parentId ? { provinceId: Number(parentId) } : undefined, orderBy: { name: "asc" } }));
  }
  if (type === "tipos-activo") {
    return NextResponse.json(await prisma.assetType.findMany({ orderBy: { name: "asc" } }));
  }
  if (type === "unidades-medida") {
    return NextResponse.json(await prisma.measureUnit.findMany({ orderBy: { name: "asc" } }));
  }

  return NextResponse.json({ error: "type requerido" }, { status: 400 });
}
