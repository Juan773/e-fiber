import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const planes = await prisma.plan.findMany({ orderBy: { monthlyPrice: "asc" } });
  return NextResponse.json(planes);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const plan = await prisma.plan.create({ data: body });
  return NextResponse.json(plan, { status: 201 });
}
