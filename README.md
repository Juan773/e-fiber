# E-Fiber — Sistema de Gestión

Sistema web para gestionar clientes, instalaciones, subscripciones, prórrogas y facturación electrónica SUNAT de una empresa de distribución de fibra óptica.

## Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **UI:** Tailwind CSS (diseño naranja E-Fiber)
- **ORM:** Prisma
- **Base de datos:** MySQL (local) → Supabase/PostgreSQL (producción)
- **Facturación SUNAT:** Nubefact API

## Módulos

| Módulo | Ruta |
|---|---|
| Dashboard | `/home/dashboard` |
| Clientes | `/home/customer/list-customer` |
| Empleados | `/home/employee/list-employee` |
| Cargos | `/home/employee/cargos` |
| Activos | `/home/asset/list-asset` |
| Planes | `/home/plans/list-plans` |
| Instalaciones | `/home/installation/list-installation` |
| Subscripciones | `/home/subscription/list-subscription` |
| Prórrogas | `/home/extension/list-extension` |
| Facturación | `/home/billing/list-billing` |

---

## ▶️ Instalación local (MySQL)

### Requisitos previos

- Node.js 18+
- MySQL corriendo localmente (XAMPP, WAMP, Laragon, o MySQL standalone)

### 1. Instalar dependencias

```bash
cd e-fiber-app
npm install
```

### 2. Crear la base de datos en MySQL

Abre phpMyAdmin o MySQL Workbench y ejecuta:

```sql
CREATE DATABASE efiber CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tu configuración MySQL. Si usas XAMPP sin contraseña:

```
DATABASE_URL="mysql://root:@localhost:3306/efiber"
```

### 4. Crear las tablas y cargar datos iniciales

```bash
npm run db:migrate   # Crea todas las tablas
npm run db:seed      # Carga datos iniciales (Perú, planes, cargos, etc.)
```

### 5. Correr el proyecto

```bash
npm run dev
# Abrir http://localhost:3000
```

---

## Comandos útiles

```bash
npm run db:studio    # Abrir Prisma Studio (ver/editar datos visualmente)
npm run db:reset     # Borrar todo y volver a crear (¡elimina datos!)
npm run db:seed      # Cargar datos iniciales
```

---

## Migrar a producción (Supabase / PostgreSQL)

Cuando quieras pasar a la nube, solo cambia en `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"   # ← cambiar de "mysql" a "postgresql"
  url      = env("DATABASE_URL")
}
```

Y actualiza `DATABASE_URL` con la URL de Supabase. Todos los modelos son compatibles.

---

## Estructura del proyecto

```
e-fiber-app/
├── app/
│   ├── api/                        # Backend (API Routes)
│   │   ├── clientes/               # GET + POST
│   │   ├── clientes/[id]/          # PUT + DELETE
│   │   ├── empleados/, cargos/     # ídem
│   │   ├── activos/, planes/       # ídem
│   │   ├── instalaciones/          # ídem
│   │   ├── subscripciones/         # ídem
│   │   ├── prorrogas/              # ídem
│   │   ├── comprobantes/           # ídem
│   │   ├── geo/                    # Países, deptos, provincias, distritos
│   │   └── dashboard/             # KPIs
│   └── home/                       # Frontend (páginas)
├── components/
│   ├── layout/                     # Sidebar, Navbar
│   └── shared/                     # DataTable, Modal, StatusBadge, etc.
├── lib/
│   ├── db.ts                       # Prisma Client singleton
│   └── nubefact/                   # Cliente API Nubefact (SUNAT)
├── prisma/
│   ├── schema.prisma               # Modelos de la base de datos
│   └── seed.ts                     # Datos iniciales
└── types/index.ts                  # Tipos TypeScript
```
