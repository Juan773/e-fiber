/**
 * Datos de PRUEBA para desarrollo (rama "dev" de Neon).
 * NO ejecutar contra producción.
 *
 * - Idempotente: todos los registros usan IDs con prefijo "test-" y se recrean en cada ejecución.
 * - Teléfonos 900 000 xxx, DNIs 7xxxxxxx y correos @example.com: todos ficticios.
 * - Planes con precios reales de E-Fiber (100/200/300/500 Mbps).
 *
 * Uso:  npm run db:seed && npm run db:seed:test
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { addMonths, getDaysInMonth } from "date-fns";

const prisma = new PrismaClient();

// Fecha de referencia para decidir qué pagos están pagados/vencidos
const TODAY = new Date();

function assertNotProduction() {
  const url = process.env.DATABASE_URL ?? "";
  if (process.env.ALLOW_TEST_SEED !== "1" && !/ep-cold-heart/.test(url)) {
    throw new Error(
      "Este seed solo corre contra la rama dev de Neon. Si estás seguro de la base, ejecuta con ALLOW_TEST_SEED=1.",
    );
  }
}

// ─── Datos base ──────────────────────────────────────────────────────────────

const PLANS = [
  { id: "test-plan-100", name: "Plan Básico 100MB", speedMbps: 100, monthlyPrice: 50, description: "Internet estable para navegación y redes sociales" },
  { id: "test-plan-200", name: "Plan Intermedio 200MB", speedMbps: 200, monthlyPrice: 70, description: "Streaming HD, videollamadas y juegos en línea" },
  { id: "test-plan-300", name: "Plan Avanzado 300MB", speedMbps: 300, monthlyPrice: 100, description: "Streaming 4K para toda la familia" },
  { id: "test-plan-500", name: "Plan Premium 500MB", speedMbps: 500, monthlyPrice: 150, description: "Máximo rendimiento para muchos dispositivos" },
];

const EXTRA_DISTRICTS = ["LURIGANCHO", "SAN JUAN DE LURIGANCHO", "ATE", "SANTA ANITA", "CHACLACAYO"];

const EMPLOYEES = [
  { id: "test-emp-1", firstName: "Carlos", lastName: "Mendoza Ríos", docNumber: "70000001", position: "Técnico Instalador" },
  { id: "test-emp-2", firstName: "Luis", lastName: "Huamán Quispe", docNumber: "70000002", position: "Técnico Instalador" },
  { id: "test-emp-3", firstName: "Rosa", lastName: "Paredes Soto", docNumber: "70000003", position: "Técnico Soporte" },
  { id: "test-emp-4", firstName: "Miguel", lastName: "Castro Vega", docNumber: "70000004", position: "Vendedor" },
];

type Scenario =
  | "al_dia" // todo pagado hasta hoy
  | "debe_mes" // debe el mes actual (vencido)
  | "suspendido" // debe 2 meses, suscripción suspendida
  | "cancelado" // suscripción cancelada
  | "pendiente" // instalación aún no realizada
  | "en_proceso"
  | "inst_cancelada";

interface ClientSeed {
  firstName: string;
  lastName: string;
  gender: "Masculino" | "Femenino";
  district: string;
  address: string;
  plan: 100 | 200 | 300 | 500;
  /** Meses atrás en que se instaló (solo instalaciones completadas). */
  monthsAgo: number;
  scenario: Scenario;
  occupation: string;
  ruc?: boolean;
}

const CLIENTS: ClientSeed[] = [
  { firstName: "María", lastName: "Torres Guzmán", gender: "Femenino", district: "LURIGANCHO", address: "Alameda de Ñaña Mz. B Lt. 12", plan: 200, monthsAgo: 8, scenario: "al_dia", occupation: "Hogar" },
  { firstName: "José", lastName: "Ramírez Flores", gender: "Masculino", district: "LURIGANCHO", address: "Av. Balaguer calle 2 Mz. D Lt. 4", plan: 300, monthsAgo: 7, scenario: "al_dia", occupation: "Independiente" },
  { firstName: "Ana", lastName: "Quispe Mamani", gender: "Femenino", district: "CHACLACAYO", address: "Jr. Los Pinos 145", plan: 100, monthsAgo: 7, scenario: "debe_mes", occupation: "Estudiante" },
  { firstName: "Pedro", lastName: "Salazar Núñez", gender: "Masculino", district: "ATE", address: "Av. Nicolás Ayllón 3320", plan: 500, monthsAgo: 6, scenario: "al_dia", occupation: "Empresario", ruc: true },
  { firstName: "Lucía", lastName: "Chávez Ortiz", gender: "Femenino", district: "LURIGANCHO", address: "Urb. Los Jardines Mz. F Lt. 9", plan: 200, monthsAgo: 6, scenario: "suspendido", occupation: "Dependiente" },
  { firstName: "Jorge", lastName: "Vargas León", gender: "Masculino", district: "SANTA ANITA", address: "Calle Las Gardenias 210", plan: 300, monthsAgo: 5, scenario: "al_dia", occupation: "Dependiente" },
  { firstName: "Carmen", lastName: "Rojas Díaz", gender: "Femenino", district: "SAN JUAN DE LURIGANCHO", address: "Av. Próceres de la Independencia 1780", plan: 200, monthsAgo: 5, scenario: "al_dia", occupation: "Hogar" },
  { firstName: "Raúl", lastName: "Gutiérrez Pinto", gender: "Masculino", district: "LURIGANCHO", address: "Asoc. Santa María Mz. A Lt. 3", plan: 100, monthsAgo: 4, scenario: "debe_mes", occupation: "Independiente" },
  { firstName: "Sofía", lastName: "Mendoza Cruz", gender: "Femenino", district: "ATE", address: "Jr. Huancayo 455", plan: 300, monthsAgo: 4, scenario: "al_dia", occupation: "Estudiante" },
  { firstName: "Diego", lastName: "Herrera Campos", gender: "Masculino", district: "CHACLACAYO", address: "Av. Nicolás de Piérola 890", plan: 500, monthsAgo: 4, scenario: "cancelado", occupation: "Empresario" },
  { firstName: "Valeria", lastName: "Castillo Reyes", gender: "Femenino", district: "LURIGANCHO", address: "Alameda de Ñaña Mz. H Lt. 21", plan: 200, monthsAgo: 3, scenario: "al_dia", occupation: "Dependiente" },
  { firstName: "Fernando", lastName: "Aguilar Medina", gender: "Masculino", district: "SAN JUAN DE LURIGANCHO", address: "Urb. Canto Rey Mz. C Lt. 15", plan: 300, monthsAgo: 2, scenario: "al_dia", occupation: "Independiente" },
  { firstName: "Patricia", lastName: "Morales Vega", gender: "Femenino", district: "SANTA ANITA", address: "Calle Los Cedros 88", plan: 100, monthsAgo: 2, scenario: "debe_mes", occupation: "Hogar" },
  { firstName: "Ricardo", lastName: "Silva Ramos", gender: "Masculino", district: "LURIGANCHO", address: "Av. Balaguer calle 6 Mz. K Lt. 2", plan: 200, monthsAgo: 1, scenario: "al_dia", occupation: "Dependiente" },
  { firstName: "Gabriela", lastName: "Paz Fernández", gender: "Femenino", district: "ATE", address: "Jr. Las Magnolias 312", plan: 300, monthsAgo: 0, scenario: "al_dia", occupation: "Estudiante" },
  { firstName: "Andrés", lastName: "Córdova Lima", gender: "Masculino", district: "LURIGANCHO", address: "Asoc. Los Álamos Mz. E Lt. 7", plan: 200, monthsAgo: 0, scenario: "pendiente", occupation: "Independiente" },
  { firstName: "Elena", lastName: "Ruiz Palacios", gender: "Femenino", district: "CHACLACAYO", address: "Calle Morón 120", plan: 100, monthsAgo: 0, scenario: "pendiente", occupation: "Hogar" },
  { firstName: "Martín", lastName: "Benítez Soto", gender: "Masculino", district: "SAN JUAN DE LURIGANCHO", address: "Av. Wiesse 2450", plan: 500, monthsAgo: 0, scenario: "pendiente", occupation: "Empresario" },
  { firstName: "Daniela", lastName: "Espinoza Luna", gender: "Femenino", district: "LURIGANCHO", address: "Urb. Los Jardines Mz. B Lt. 18", plan: 300, monthsAgo: 0, scenario: "en_proceso", occupation: "Dependiente" },
  { firstName: "Hugo", lastName: "Navarro Tapia", gender: "Masculino", district: "ATE", address: "Jr. Tacna 670", plan: 200, monthsAgo: 0, scenario: "inst_cancelada", occupation: "Independiente" },
];

const ASSETS = [
  { id: "test-asset-1", name: "Router Huawei WiFi AX2", type: "router", unit: "und", stock: 18, unitPrice: 120, description: "Router doble banda WiFi 6" },
  { id: "test-asset-2", name: "Router TP-Link Archer C50", type: "router", unit: "und", stock: 6, unitPrice: 85, description: "Router doble banda AC1200" },
  { id: "test-asset-3", name: "ONT Huawei HG8145V5", type: "ont_modem", unit: "und", stock: 22, unitPrice: 95, description: "ONT GPON con WiFi" },
  { id: "test-asset-4", name: "Cable drop fibra 1 hilo", type: "cable_fibra", unit: "rll", stock: 9, unitPrice: 180, description: "Rollo de 1 km" },
  { id: "test-asset-5", name: "Conector rápido SC/APC", type: "herramienta", unit: "cja", stock: 14, unitPrice: 45, description: "Caja x 100 unidades" },
  { id: "test-asset-6", name: "Splitter PLC 1x8", type: "splitter", unit: "und", stock: 11, unitPrice: 35, description: "Splitter para caja NAP" },
  { id: "test-asset-7", name: "Caja NAP 16 puertos", type: "caja_de_distribución", unit: "und", stock: 4, unitPrice: 150, description: "Caja de distribución exterior" },
];

// ─── Utilidades ──────────────────────────────────────────────────────────────

const pad = (n: number, len: number) => String(n).padStart(len, "0");
const round2 = (n: number) => Math.round(n * 100) / 100;
const METHODS = ["Yape", "Plin", "Transferencia", "Efectivo"];

function installDate(monthsAgo: number, idx: number): Date {
  // Día del mes variado (entre 3 y 24) para que el prorrateo sea distinto en cada cliente
  const base = addMonths(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1), -monthsAgo);
  let day = 3 + ((idx * 7) % 22);
  if (monthsAgo === 0) day = Math.min(day, Math.max(1, TODAY.getDate() - 1)); // nunca en el futuro
  return new Date(base.getFullYear(), base.getMonth(), day, 10);
}

/** Misma lógica que app/api/installations/[id]/route.ts → generarPagos. */
function buildPayments(start: Date, price: number) {
  const list: { month: number; year: number; amount: number; dueDate: Date; isProrated: boolean }[] = [];
  const totalDays = getDaysInMonth(start);
  const remaining = totalDays - start.getDate() + 1;
  list.push({
    month: start.getMonth() + 1,
    year: start.getFullYear(),
    amount: round2((price / totalDays) * remaining),
    dueDate: start,
    isProrated: true,
  });
  for (let i = 1; i <= 11; i++) {
    const b = addMonths(start, i);
    const due = new Date(b.getFullYear(), b.getMonth(), 1);
    list.push({ month: due.getMonth() + 1, year: due.getFullYear(), amount: price, dueDate: due, isProrated: false });
  }
  return list;
}

// ─── Limpieza de datos de prueba previos ─────────────────────────────────────

async function cleanup() {
  const testSubs = { subscription: { id: { startsWith: "test-" } } };
  await prisma.invoice.deleteMany({ where: { id: { startsWith: "test-" } } });
  await prisma.payment.deleteMany({ where: testSubs });
  await prisma.extension.deleteMany({ where: testSubs });
  await prisma.subscription.deleteMany({ where: { id: { startsWith: "test-" } } });
  await prisma.installation.deleteMany({ where: { id: { startsWith: "test-" } } }); // equipos en cascada
  await prisma.client.deleteMany({ where: { id: { startsWith: "test-" } } });
  await prisma.employee.deleteMany({ where: { id: { startsWith: "test-" } } });
  await prisma.asset.deleteMany({ where: { id: { startsWith: "test-" } } });
}

// ─── Seed ────────────────────────────────────────────────────────────────────

async function main() {
  assertNotProduction();
  console.log("🧪 Generando datos de prueba (rama dev)...");
  await cleanup();

  // Planes E-Fiber
  for (const p of PLANS) {
    await prisma.plan.upsert({ where: { id: p.id }, update: p, create: p });
  }
  const planBySpeed = new Map(PLANS.map((p) => [p.speedMbps, p]));

  // prisma/seed.ts inserta geo con IDs fijos sin avanzar las secuencias de Postgres
  for (const table of ["Department", "Province", "District"]) {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 0) + 1, false)`,
    );
  }

  // Geo: Perú → Lima → Lima + distritos del este de Lima
  const peru = await prisma.country.upsert({ where: { name: "PERU" }, update: {}, create: { name: "PERU" } });
  const dep =
    (await prisma.department.findFirst({ where: { name: "LIMA", countryId: peru.id } })) ??
    (await prisma.department.create({ data: { name: "LIMA", countryId: peru.id } }));
  const prov =
    (await prisma.province.findFirst({ where: { name: "LIMA", departmentId: dep.id } })) ??
    (await prisma.province.create({ data: { name: "LIMA", departmentId: dep.id } }));
  const districtId = new Map<string, number>();
  for (const name of EXTRA_DISTRICTS) {
    const d =
      (await prisma.district.findFirst({ where: { name, provinceId: prov.id } })) ??
      (await prisma.district.create({ data: { name, provinceId: prov.id } }));
    districtId.set(name, d.id);
  }
  const geo = (district: string) => ({
    countryId: peru.id,
    departmentId: dep.id,
    provinceId: prov.id,
    districtId: districtId.get(district),
  });

  // Cargos y empleados
  for (const e of EMPLOYEES) {
    const position =
      (await prisma.position.findFirst({ where: { name: e.position } })) ??
      (await prisma.position.create({ data: { name: e.position } }));
    await prisma.employee.create({
      data: {
        id: e.id,
        docNumber: e.docNumber,
        firstName: e.firstName,
        lastName: e.lastName,
        phone: `90000${e.id.slice(-1)}000`,
        email: `${e.firstName.toLowerCase()}.tecnico@example.com`,
        positionId: position.id,
      },
    });
  }
  const installers = ["test-emp-1", "test-emp-2"];

  // Inventario
  const assetTypes = await prisma.assetType.findMany();
  const units = await prisma.measureUnit.findMany();
  for (const a of ASSETS) {
    await prisma.asset.create({
      data: {
        id: a.id,
        name: a.name,
        description: a.description,
        stock: a.stock,
        unitPrice: a.unitPrice,
        assetTypeId: assetTypes.find((t) => t.id === a.type)?.id,
        measureUnitId: units.find((u) => u.id === a.unit)?.id,
      },
    });
  }

  // Clientes, instalaciones, suscripciones, pagos y comprobantes
  let boleta = 0;
  let factura = 0;
  const counts = { clients: 0, installations: 0, subscriptions: 0, payments: 0, invoices: 0 };

  for (let i = 0; i < CLIENTS.length; i++) {
    const c = CLIENTS[i];
    const n = i + 1;
    const plan = planBySpeed.get(c.plan)!;
    const clientId = `test-client-${pad(n, 2)}`;
    const docNumber = c.ruc ? `2060000${pad(n, 4)}` : `7${pad(1000000 + n, 7)}`;
    const address = `${c.address}, ${c.district.charAt(0) + c.district.slice(1).toLowerCase()} - Lima`;

    await prisma.client.create({
      data: {
        id: clientId,
        docType: c.ruc ? "RUC" : "DNI",
        docNumber,
        firstName: c.firstName,
        lastName: c.lastName,
        gender: c.gender,
        birthDate: new Date(1970 + ((n * 3) % 30), (n * 5) % 12, 1 + ((n * 11) % 27)),
        maritalStatus: ["Soltero", "Casado", "Conviviente"][n % 3],
        occupation: c.occupation,
        address,
        email: `${c.firstName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}.${n}@example.com`,
        phone: `900000${pad(n, 3)}`,
        status: c.scenario === "cancelado" || c.scenario === "inst_cancelada" ? "Inactivo" : "Activo",
        ...geo(c.district),
      },
    });
    counts.clients++;

    const completed = ["al_dia", "debe_mes", "suspendido", "cancelado"].includes(c.scenario);
    const start = installDate(c.monthsAgo, n);
    const statusMap: Record<Scenario, string> = {
      al_dia: "Completada",
      debe_mes: "Completada",
      suspendido: "Completada",
      cancelado: "Completada",
      pendiente: "Pendiente",
      en_proceso: "En Proceso",
      inst_cancelada: "Cancelada",
    };
    const scheduled = completed ? start : new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + 2 + (n % 5), 9);

    const equipment: Prisma.InstallationEquipmentCreateWithoutInstallationInput[] = completed
      ? [
          { type: "ONT", brand: "Huawei", model: "HG8145V5", serialNumber: `48575443${pad(n * 7919, 8)}`, action: "Instalado" },
          { type: "Router", brand: "Huawei", model: "WiFi AX2", serialNumber: `3MROU24C${pad(28000000 + n * 37, 8)}`, action: "Instalado" },
        ]
      : [];
    if (c.scenario === "suspendido" || n === 2) {
      // Un cambio de router registrado en acta técnica
      equipment.push({ type: "Router", brand: "TP-Link", model: "Archer C50", serialNumber: `TPL${pad(n * 1013, 9)}`, action: "Retirado" });
    }

    const installationId = `test-inst-${pad(n, 2)}`;
    await prisma.installation.create({
      data: {
        id: installationId,
        clientId,
        planId: plan.id,
        employeeId: c.scenario === "pendiente" && n % 2 === 0 ? null : installers[n % 2],
        installationAddress: address,
        ...geo(c.district),
        scheduledDate: scheduled,
        completedDate: completed ? start : null,
        status: statusMap[c.scenario],
        contractNumber: pad(300 + n, 6),
        contractDate: completed ? start : new Date(TODAY.getFullYear(), TODAY.getMonth(), Math.max(1, TODAY.getDate() - 3)),
        usageType: c.ruc ? "Comercial" : n % 4 === 0 ? "Familiar-Comercial" : "Familiar",
        contractTermMonths: 6,
        technicalActNumber: completed ? pad(500 + n, 6) : null,
        ipAddress: completed ? `10.20.${Math.floor(n / 10)}.${100 + n}` : null,
        materials: completed ? `Cable drop ${60 + n * 5} m, 2 conectores SC/APC, roseta óptica, 4 grapas` : null,
        receivedBy: completed ? `${c.firstName} ${c.lastName}` : null,
        receivedByRelation: completed ? "Titular" : null,
        notes:
          c.scenario === "inst_cancelada"
            ? "Cliente canceló antes de la instalación: sin cobertura en su calle."
            : c.scenario === "en_proceso"
              ? "Técnico en camino. Tendido de fibra desde caja NAP 16."
              : c.scenario === "pendiente"
                ? "Coordinar horario por WhatsApp."
                : null,
        equipment: { create: equipment },
      },
    });
    counts.installations++;

    if (!completed) continue;

    // Suscripción (misma lógica que al completar una instalación)
    const subscriptionId = `test-sub-${pad(n, 2)}`;
    const subStatus = c.scenario === "suspendido" ? "Suspendida" : c.scenario === "cancelado" ? "Cancelada" : "Activa";
    await prisma.subscription.create({
      data: {
        id: subscriptionId,
        clientId,
        installationId,
        planId: plan.id,
        startDate: start,
        endDate: addMonths(start, 12),
        monthlyPrice: plan.monthlyPrice,
        status: subStatus,
        suspendedAt: c.scenario === "suspendido" ? new Date(TODAY.getFullYear(), TODAY.getMonth(), 11) : null,
      },
    });
    counts.subscriptions++;

    // Pagos
    const payments = buildPayments(start, plan.monthlyPrice);
    const due = payments.filter((p) => p.dueDate <= TODAY);
    const unpaidFromEnd = c.scenario === "debe_mes" ? 1 : c.scenario === "suspendido" ? 2 : 0;
    const paidPayments: typeof payments = [];

    for (let k = 0; k < payments.length; k++) {
      const p = payments[k];
      const isDue = p.dueDate <= TODAY;
      const dueIdx = due.indexOf(p);
      const unpaid = isDue && dueIdx >= due.length - unpaidFromEnd;
      const cancelledAfter = c.scenario === "cancelado" && dueIdx >= due.length - 1;

      let status = "Pendiente";
      if (cancelledAfter || (c.scenario === "cancelado" && !isDue)) status = "Anulado";
      else if (unpaid) status = TODAY.getDate() > 10 || p.dueDate.getMonth() !== TODAY.getMonth() ? "Vencido" : "Pendiente";
      else if (isDue) status = "Pagado";

      const paid = status === "Pagado";
      const paymentDate = paid ? new Date(p.dueDate.getFullYear(), p.dueDate.getMonth(), p.isProrated ? p.dueDate.getDate() : 2 + ((n + k) % 8), 15) : null;
      if (paid) paidPayments.push(p);

      await prisma.payment.create({
        data: {
          subscriptionId,
          month: p.month,
          year: p.year,
          amount: p.amount,
          lateFee: status === "Vencido" && c.scenario === "suspendido" ? 10 : 0,
          discount: n === 1 && k === 3 ? 20 : 0, // descuento por referido
          status,
          dueDate: p.dueDate,
          paymentDate,
          paymentMethod: paid ? METHODS[(n + k) % METHODS.length] : null,
          notes: n === 1 && k === 3 ? "Descuento S/ 20 por referir a un amigo" : null,
          isProrated: p.isProrated,
          notified: status === "Vencido",
          notificationStage: status === "Vencido" ? (c.scenario === "suspendido" ? 4 : 3) : 0,
          lastNotifiedAt: status === "Vencido" ? new Date(TODAY.getFullYear(), TODAY.getMonth(), 10, 9) : null,
        },
      });
      counts.payments++;
    }

    // Prórroga para un cliente
    if (n === 6) {
      await prisma.extension.create({
        data: {
          subscriptionId,
          previousStartDate: start,
          previousEndDate: addMonths(start, 12),
          newEndDate: addMonths(start, 13),
          reason: "Compensación por corte de servicio de 3 días (avería en troncal).",
        },
      });
    }

    // Comprobantes de los últimos 2 pagos cobrados
    for (const p of paidPayments.slice(-2)) {
      const isFactura = Boolean(c.ruc);
      const sequential = isFactura ? ++factura : ++boleta;
      const subtotal = round2(p.amount);
      const igv = round2((subtotal * 18) / 100);
      await prisma.invoice.create({
        data: {
          id: `test-inv-${isFactura ? "F" : "B"}-${pad(sequential, 4)}`,
          type: isFactura ? "FACTURA" : "BOLETA",
          series: isFactura ? "F901" : "B901", // serie reservada para pruebas
          sequential,
          clientId,
          subscriptionId,
          items: [
            {
              description: `Servicio fibra óptica — ${plan.name} (${pad(p.month, 2)}/${p.year})${p.isProrated ? " prorrateo" : ""}`,
              cantidad: 1,
              unitPrice: subtotal,
              igv,
              subtotal,
            },
          ],
          subtotal,
          igv,
          total: round2(subtotal + igv),
          status: n === 7 && sequential % 2 === 0 ? "Anulado" : "Emitido",
          issueDate: new Date(p.dueDate.getFullYear(), p.dueDate.getMonth(), Math.max(p.dueDate.getDate(), 5), 12),
        },
      });
      counts.invoices++;
    }
  }

  console.log("✅ Datos de prueba creados:", counts, {
    employees: EMPLOYEES.length,
    assets: ASSETS.length,
    plans: PLANS.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
