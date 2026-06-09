import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const invoices = await prisma.invoice.findMany({
    include: { client: { select: { firstName: true, lastName: true, docType: true, docNumber: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(invoices);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Calcular siguiente sequential
  const last = await prisma.invoice.findFirst({
    where: { type: body.type },
    orderBy: { sequential: "desc" },
  });
  const sequential = (last?.sequential ?? 0) + 1;
  const series = body.type === "BOLETA" ? "B001" : "F001";

  const invoice = await prisma.invoice.create({
    data: {
      ...body,
      series,
      sequential,
      issueDate: new Date(),
    },
    include: { client: { select: { firstName: true, lastName: true } } },
  });

  return NextResponse.json(invoice, { status: 201 });
}
