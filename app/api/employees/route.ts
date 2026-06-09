import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search") ?? "";
  const employees = await prisma.employee.findMany({
    where: search ? { OR: [{ firstName: { contains: search } }, { lastName: { contains: search } }, { docNumber: { contains: search } }] } : undefined,
    include: { position: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(employees);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const employee = await prisma.employee.create({ data: body, include: { position: true } });
  return NextResponse.json(employee, { status: 201 });
}
