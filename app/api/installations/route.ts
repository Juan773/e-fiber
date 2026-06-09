import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const installations = await prisma.installation.findMany({
    include: {
      client: { select: { firstName: true, lastName: true } },
      employee: { select: { firstName: true, lastName: true } },
      plan: { select: { name: true, speedMbps: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(installations);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { client: clienteData, ...instalacionData } = body;

  // Si viene con datos de client, crear o reutilizar client en la misma transacción
  if (clienteData) {
    const result = await prisma.$transaction(async (tx) => {
      // Buscar si ya existe por documento
      let client = await tx.client.findFirst({
        where: {
          docType: clienteData.docType,
          docNumber: clienteData.docNumber,
        },
      });

      if (!client) {
        client = await tx.client.create({
          data: { ...clienteData, status: "Activo" },
        });
      }

      const installation = await tx.installation.create({
        data: { ...instalacionData, clientId: client.id, status: "Pendiente" },
        include: {
          client: { select: { firstName: true, lastName: true } },
          plan: { select: { name: true } },
        },
      });

      return installation;
    });

    return NextResponse.json(result, { status: 201 });
  }

  // Sin datos de client (flujo normal)
  const installation = await prisma.installation.create({
    data: { ...instalacionData, status: "Pendiente" },
    include: {
      client: { select: { firstName: true, lastName: true } },
      plan: { select: { name: true } },
    },
  });
  return NextResponse.json(installation, { status: 201 });
}
