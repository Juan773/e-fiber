-- ============================================================
-- E-FIBER — Esquema inicial de base de datos
-- Ejecutar en: Supabase > SQL Editor
-- ============================================================

-- ─── Extensiones ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Geo (catálogos básicos) ──────────────────────────────────────────────────
CREATE TABLE paises (
  id   SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE departamentos (
  id       SERIAL PRIMARY KEY,
  pais_id  INT REFERENCES paises(id),
  nombre   VARCHAR(100) NOT NULL
);

CREATE TABLE provincias (
  id               SERIAL PRIMARY KEY,
  departamento_id  INT REFERENCES departamentos(id),
  nombre           VARCHAR(100) NOT NULL
);

CREATE TABLE distritos (
  id           SERIAL PRIMARY KEY,
  provincia_id INT REFERENCES provincias(id),
  nombre       VARCHAR(100) NOT NULL
);

-- Insertar Perú y Lima básico
INSERT INTO paises (nombre) VALUES ('PERU');
INSERT INTO departamentos (pais_id, nombre) VALUES (1, 'LIMA'), (1, 'AREQUIPA'), (1, 'CUSCO'), (1, 'PIURA'), (1, 'TRUJILLO');
INSERT INTO provincias (departamento_id, nombre) VALUES (1, 'LIMA'), (1, 'CALLAO'), (1, 'HUAURA');
INSERT INTO distritos (provincia_id, nombre) VALUES
  (1,'LIMA'), (1,'MIRAFLORES'), (1,'SAN ISIDRO'), (1,'SURCO'), (1,'LA MOLINA'),
  (1,'SAN BORJA'), (1,'BARRANCO'), (1,'CHORRILLOS'), (1,'SAN MIGUEL'),
  (1,'JESUS MARIA'), (1,'LINCE'), (1,'PUEBLO LIBRE');

-- ─── Perfiles de usuario ──────────────────────────────────────────────────────
CREATE TABLE perfiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombres    VARCHAR(100),
  apellidos  VARCHAR(100),
  role       VARCHAR(20) NOT NULL DEFAULT 'vendedor' CHECK (role IN ('admin','tecnico','vendedor')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: crear perfil al registrar usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO perfiles (id, nombres, apellidos, role)
  VALUES (NEW.id, '', '', 'vendedor');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Cargos ───────────────────────────────────────────────────────────────────
CREATE TABLE cargos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO cargos (nombre) VALUES ('Técnico Instalador'), ('Técnico Soporte'), ('Vendedor'), ('Administrador');

-- ─── Clientes ─────────────────────────────────────────────────────────────────
CREATE TABLE clientes (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo_documento      VARCHAR(20) NOT NULL DEFAULT 'DNI' CHECK (tipo_documento IN ('DNI','RUC','CE','PASAPORTE')),
  nro_documento       VARCHAR(20) NOT NULL,
  nombres             VARCHAR(100) NOT NULL,
  apellidos           VARCHAR(100) NOT NULL,
  genero              VARCHAR(20) CHECK (genero IN ('Masculino','Femenino','Otro')),
  fecha_nacimiento    DATE,
  estado_civil        VARCHAR(20) CHECK (estado_civil IN ('Soltero','Casado','Divorciado','Viudo','Conviviente')),
  direccion           VARCHAR(255),
  pais_id             INT REFERENCES paises(id) DEFAULT 1,
  departamento_id     INT REFERENCES departamentos(id),
  provincia_id        INT REFERENCES provincias(id),
  distrito_id         INT REFERENCES distritos(id),
  ocupacion           VARCHAR(50) CHECK (ocupacion IN ('Hogar','Dependiente','Independiente','Empresario','Estudiante','Otro')),
  correo              VARCHAR(150),
  telefono            VARCHAR(20),
  telefono_emergencia VARCHAR(20),
  estado              VARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo','Inactivo','Suspendido')),
  user_id             UUID REFERENCES auth.users(id),
  avatar_url          TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tipo_documento, nro_documento)
);

-- ─── Empleados ────────────────────────────────────────────────────────────────
CREATE TABLE empleados (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo_documento      VARCHAR(20) NOT NULL DEFAULT 'DNI' CHECK (tipo_documento IN ('DNI','RUC','CE','PASAPORTE')),
  nro_documento       VARCHAR(20) NOT NULL UNIQUE,
  nombres             VARCHAR(100) NOT NULL,
  apellidos           VARCHAR(100) NOT NULL,
  genero              VARCHAR(20) CHECK (genero IN ('Masculino','Femenino','Otro')),
  fecha_nacimiento    DATE,
  estado_civil        VARCHAR(20),
  direccion           VARCHAR(255),
  pais_id             INT REFERENCES paises(id) DEFAULT 1,
  departamento_id     INT REFERENCES departamentos(id),
  provincia_id        INT REFERENCES provincias(id),
  distrito_id         INT REFERENCES distritos(id),
  correo              VARCHAR(150),
  telefono            VARCHAR(20),
  cargo_id            UUID REFERENCES cargos(id),
  estado              VARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo','Inactivo')),
  user_id             UUID REFERENCES auth.users(id),
  avatar_url          TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Activos ──────────────────────────────────────────────────────────────────
CREATE TABLE tipos_activo (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE unidades_medida (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre       VARCHAR(100) NOT NULL,
  abreviatura  VARCHAR(20) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE activos (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre           VARCHAR(150) NOT NULL,
  tipo_activo_id   UUID REFERENCES tipos_activo(id),
  unidad_medida_id UUID REFERENCES unidades_medida(id),
  descripcion      TEXT,
  stock            INT NOT NULL DEFAULT 0,
  precio_unitario  DECIMAL(10,2),
  estado           VARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo','Inactivo')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO tipos_activo (nombre) VALUES ('Router'), ('ONT/Modem'), ('Cable Fibra'), ('Splitter'), ('Caja de Distribución');
INSERT INTO unidades_medida (nombre, abreviatura) VALUES ('Unidad','UND'), ('Metro','M'), ('Kilómetro','KM'), ('Caja','CJA');

-- ─── Planes ───────────────────────────────────────────────────────────────────
CREATE TABLE planes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre          VARCHAR(100) NOT NULL,
  descripcion     TEXT,
  velocidad_mbps  INT NOT NULL,
  precio_mensual  DECIMAL(10,2) NOT NULL,
  estado          VARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo','Inactivo')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO planes (nombre, velocidad_mbps, precio_mensual) VALUES
  ('Plan Básico 50MB',  50,  39.90),
  ('Plan Estándar 100MB', 100, 59.90),
  ('Plan Premium 200MB',  200, 89.90),
  ('Plan Ultra 500MB',    500, 129.90),
  ('Plan Empresarial 1GB', 1000, 199.90);

-- ─── Instalaciones ────────────────────────────────────────────────────────────
CREATE TABLE instalaciones (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id            UUID NOT NULL REFERENCES clientes(id),
  empleado_id           UUID REFERENCES empleados(id),
  plan_id               UUID NOT NULL REFERENCES planes(id),
  direccion_instalacion VARCHAR(255) NOT NULL,
  pais_id               INT REFERENCES paises(id) DEFAULT 1,
  departamento_id       INT REFERENCES departamentos(id),
  provincia_id          INT REFERENCES provincias(id),
  distrito_id           INT REFERENCES distritos(id),
  fecha_programada      DATE,
  fecha_completada      DATE,
  estado                VARCHAR(20) NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente','En Proceso','Completada','Cancelada')),
  observaciones         TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Subscripciones ───────────────────────────────────────────────────────────
CREATE TABLE subscripciones (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id      UUID NOT NULL REFERENCES clientes(id),
  instalacion_id  UUID NOT NULL REFERENCES instalaciones(id),
  plan_id         UUID NOT NULL REFERENCES planes(id),
  fecha_inicio    DATE NOT NULL,
  fecha_fin       DATE NOT NULL,
  precio_mensual  DECIMAL(10,2) NOT NULL,
  estado          VARCHAR(20) NOT NULL DEFAULT 'Activa' CHECK (estado IN ('Activa','Vencida','Suspendida','Cancelada')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Prórrogas ────────────────────────────────────────────────────────────────
CREATE TABLE prorrogas (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscripcion_id       UUID NOT NULL REFERENCES subscripciones(id),
  fecha_inicio_anterior DATE NOT NULL,
  fecha_fin_anterior    DATE NOT NULL,
  nueva_fecha_fin       DATE NOT NULL,
  motivo                TEXT,
  aprobado_por          UUID REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Comprobantes (Boletas / Facturas) ────────────────────────────────────────
CREATE TABLE comprobantes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo             VARCHAR(10) NOT NULL CHECK (tipo IN ('BOLETA','FACTURA')),
  serie            VARCHAR(5) NOT NULL,
  correlativo      INT NOT NULL,
  cliente_id       UUID NOT NULL REFERENCES clientes(id),
  subscripcion_id  UUID REFERENCES subscripciones(id),
  items            JSONB NOT NULL DEFAULT '[]',
  subtotal         DECIMAL(10,2) NOT NULL,
  igv              DECIMAL(10,2) NOT NULL,
  total            DECIMAL(10,2) NOT NULL,
  estado           VARCHAR(20) NOT NULL DEFAULT 'Borrador' CHECK (estado IN ('Borrador','Emitido','Anulado','Error')),
  nubefact_id      VARCHAR(100),
  enlace_pdf       TEXT,
  enlace_xml       TEXT,
  fecha_emision    DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tipo, serie, correlativo)
);

-- ─── Función para updated_at automático ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_clientes_updated_at      BEFORE UPDATE ON clientes       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_empleados_updated_at     BEFORE UPDATE ON empleados      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_activos_updated_at       BEFORE UPDATE ON activos        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_instalaciones_updated_at BEFORE UPDATE ON instalaciones  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_subscripciones_updated_at BEFORE UPDATE ON subscripciones FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_comprobantes_updated_at  BEFORE UPDATE ON comprobantes   FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Row Level Security (RLS) ─────────────────────────────────────────────────
ALTER TABLE perfiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados       ENABLE ROW LEVEL SECURITY;
ALTER TABLE activos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE planes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE instalaciones   ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscripciones  ENABLE ROW LEVEL SECURITY;
ALTER TABLE prorrogas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE comprobantes    ENABLE ROW LEVEL SECURITY;

-- Política: usuarios autenticados pueden leer/escribir todo (simplificado para inicio)
CREATE POLICY "auth_all" ON perfiles       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON clientes       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON empleados      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON activos        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON planes         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON instalaciones  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON subscripciones FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON prorrogas      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON comprobantes   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON cargos         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON tipos_activo   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON unidades_medida FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE cargos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_activo     ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidades_medida  ENABLE ROW LEVEL SECURITY;

-- Geo es pública
CREATE POLICY "public_read" ON paises         FOR SELECT USING (true);
CREATE POLICY "public_read" ON departamentos  FOR SELECT USING (true);
CREATE POLICY "public_read" ON provincias     FOR SELECT USING (true);
CREATE POLICY "public_read" ON distritos      FOR SELECT USING (true);
