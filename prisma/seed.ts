import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Países
  const peru = await prisma.country.upsert({
    where: { name: "PERU" },
    update: {},
    create: { name: "PERU" },
  });

  // Departamentos
  const lima = await prisma.department.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, countryId: peru.id, name: "LIMA" },
  });
  await prisma.department.upsert({ where: { id: 2 }, update: {}, create: { id: 2, countryId: peru.id, name: "AREQUIPA" } });
  await prisma.department.upsert({ where: { id: 3 }, update: {}, create: { id: 3, countryId: peru.id, name: "CUSCO" } });
  await prisma.department.upsert({ where: { id: 4 }, update: {}, create: { id: 4, countryId: peru.id, name: "PIURA" } });
  await prisma.department.upsert({ where: { id: 5 }, update: {}, create: { id: 5, countryId: peru.id, name: "LA LIBERTAD" } });

  // Provincias
  const provLima = await prisma.province.upsert({ where: { id: 1 }, update: {}, create: { id: 1, departmentId: lima.id, name: "LIMA" } });
  await prisma.province.upsert({ where: { id: 2 }, update: {}, create: { id: 2, departmentId: lima.id, name: "CALLAO" } });

  // Distritos de Lima
  const districts = [
    "LIMA", "MIRAFLORES", "SAN ISIDRO", "SURCO", "LA MOLINA",
    "SAN BORJA", "BARRANCO", "CHORRILLOS", "SAN MIGUEL", "JESUS MARIA",
    "LINCE", "PUEBLO LIBRE", "MAGDALENA", "BREÑA", "RIMAC",
  ];
  for (let i = 0; i < districts.length; i++) {
    await prisma.district.upsert({ where: { id: i + 1 }, update: {}, create: { id: i + 1, provinceId: provLima.id, name: districts[i] } });
  }

  // Cargos
  const cargosData = [
    { name: "Técnico Instalador", description: "Responsable de installations en campo" },
    { name: "Técnico Soporte", description: "Soporte técnico y mantenimiento" },
    { name: "Vendedor", description: "Captación y gestión de clientes" },
    { name: "Administrador", description: "Administración general del sistema" },
  ];
  for (const c of cargosData) {
    await prisma.position.upsert({
      where: { id: c.name },
      update: {},
      create: { id: c.name.toLowerCase().replace(/ /g, "_"), name: c.name, description: c.description },
    });
  }

  // Tipos de Activo
  const tiposActivo = ["Router", "ONT/Modem", "Cable Fibra", "Splitter", "Caja de Distribución", "Herramienta"];
  for (const t of tiposActivo) {
    await prisma.assetType.upsert({
      where: { id: t.toLowerCase().replace(/ /g, "_").replace("/", "_") },
      update: {},
      create: { id: t.toLowerCase().replace(/ /g, "_").replace("/", "_"), name: t },
    });
  }

  // Unidades de Medida
  const unidades = [
    { id: "und", name: "Unidad", abbreviation: "UND" },
    { id: "mt", name: "Metro", abbreviation: "M" },
    { id: "km", name: "Kilómetro", abbreviation: "KM" },
    { id: "cja", name: "Caja", abbreviation: "CJA" },
    { id: "rll", name: "Rollo", abbreviation: "RLL" },
  ];
  for (const u of unidades) {
    await prisma.measureUnit.upsert({ where: { id: u.id }, update: {}, create: u });
  }

  // Planes
  const planesData = [
    { id: "plan_50", name: "Plan Básico 50MB", speedMbps: 50, monthlyPrice: 39.90, description: "Ideal para uso básico en el hogar" },
    { id: "plan_100", name: "Plan Estándar 100MB", speedMbps: 100, monthlyPrice: 59.90, description: "Perfecto para familias" },
    { id: "plan_200", name: "Plan Premium 200MB", speedMbps: 200, monthlyPrice: 89.90, description: "Para hogares con alto consumo" },
    { id: "plan_500", name: "Plan Ultra 500MB", speedMbps: 500, monthlyPrice: 129.90, description: "Para gamers y streamers" },
    { id: "plan_1000", name: "Plan Empresarial 1GB", speedMbps: 1000, monthlyPrice: 199.90, description: "Para empresas y negocios" },
  ];
  for (const p of planesData) {
    await prisma.plan.upsert({ where: { id: p.id }, update: {}, create: p });
  }

  console.log("✅ Seed completado.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
