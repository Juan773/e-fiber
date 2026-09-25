/**
 * Deja solo los planes reales de E-Fiber: 100 Mbps S/50, 300 Mbps S/70, 400 Mbps S/100.
 *
 * - Renombra plan_50 → "Plan 100" y crea plan_300 y plan_400.
 * - Mueve las instalaciones del antiguo plan_200 al Plan 300.
 * - Borra plan_100, plan_200, plan_500 y plan_1000 (se cancela si alguno sigue en uso).
 * Todo en una transacción: si algo falla, no se cambia nada.
 *
 * Uso:  npx tsx prisma/update-plans.ts   (con DATABASE_URL apuntando a la base destino)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const OLD_PLANS = ["plan_100", "plan_200", "plan_500", "plan_1000"];

async function main() {
  const result = await prisma.$transaction(async (tx) => {
    await tx.plan.upsert({
      where: { id: "plan_50" },
      update: { name: "Plan 100", speedMbps: 100, monthlyPrice: 50, description: "Internet estable para navegación y redes sociales", status: "Activo" },
      create: { id: "plan_50", name: "Plan 100", speedMbps: 100, monthlyPrice: 50, description: "Internet estable para navegación y redes sociales" },
    });
    await tx.plan.upsert({
      where: { id: "plan_300" },
      update: {},
      create: { id: "plan_300", name: "Plan 300", speedMbps: 300, monthlyPrice: 70, description: "Streaming HD/4K, videollamadas y juegos en línea" },
    });
    await tx.plan.upsert({
      where: { id: "plan_400" },
      update: {},
      create: { id: "plan_400", name: "Plan 400", speedMbps: 400, monthlyPrice: 100, description: "Máximo rendimiento para hogares con muchos dispositivos" },
    });

    const moved = await tx.installation.updateMany({ where: { planId: "plan_200" }, data: { planId: "plan_300" } });

    const inUse =
      (await tx.installation.count({ where: { planId: { in: OLD_PLANS } } })) +
      (await tx.subscription.count({ where: { planId: { in: OLD_PLANS } } }));
    if (inUse > 0) throw new Error(`Hay ${inUse} registros usando planes antiguos; no se cambió nada.`);

    const deleted = await tx.plan.deleteMany({ where: { id: { in: OLD_PLANS } } });
    return { instalacionesMovidas: moved.count, planesBorrados: deleted.count };
  });

  console.log("✅", result);
  console.table(
    await prisma.plan.findMany({ orderBy: { monthlyPrice: "asc" }, select: { id: true, name: true, speedMbps: true, monthlyPrice: true } }),
  );
}

main()
  .catch((e) => {
    console.error("❌", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
