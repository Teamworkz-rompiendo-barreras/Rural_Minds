# Notas de Implementación Rural Minds (v2.0)

## Resumen de Cambios

Se ha actualizado la arquitectura para soportar los 4 perfiles de usuario y el branding "Inclusión con Denominación de Origen".

### 1. Base de Datos (Supabase / SQLAlchemy)

#### Nuevas Tablas y Modificaciones

**Tabla `organizations` (Entidades):**
- Se añadió `org_type`: Enum ('enterprise', 'municipality') para distinguir Ayuntamientos de Empresas.
- Se añadió `municipality_id`: UUID (FK a `organizations.id`) para vincular empresas con su ayuntamiento validador.
- Se añadió `branding_logo_url` y `primary_color_override` para personalización básica.

**Tabla `challenges` (Proyectos/Vacantes):**
- Se añadió `is_public`: Boolean para visibilidad en el explorador de talento.
- Relación existente con `tenant_id` (Organization) se mantiene para filtrar por municipio (a través de la empresa o directamente).

**Tabla `applications` (Candidaturas):**
- Se mantiene la estructura. Estado soporta: 'pending', 'reviewed', 'accepted', 'rejected'.

#### Scripts de Migración (Recomendado)
Para aplicar estos cambios en producción (Supabase SQL Editor):

```sql
-- Agregar tipos de organización
ALTER TABLE organizations ADD COLUMN org_type VARCHAR(50) DEFAULT 'enterprise';
ALTER TABLE organizations ADD COLUMN municipality_id UUID REFERENCES organizations(id);

-- Agregar visibilidad a proyectos
ALTER TABLE challenges ADD COLUMN is_public BOOLEAN DEFAULT TRUE;

-- Índices recomendados
CREATE INDEX idx_org_municipality ON organizations(municipality_id);
CREATE INDEX idx_challenge_public ON challenges(is_public);
```

### 2. Frontend (React + Tailwind)

#### Sistema de Diseño
- **Fuentes**: Atkinson Hyperlegible (Texto) y Futura/Jost (Títulos).
- **Colores**:
  - `P1` (Superficie Clara): `#F0F4EF` (Sage/Blanco Roto)
  - `P2` (Acción/Oscuro): `#0F5C2E` (Verde Rural Profundo)
  - `N900` (Texto): `#0D1321` (Navy/Negro)
  - `Accent`: `#D4A373` (Dorado Tierra)

#### Estructura de Rutas
- `/admin`: Dashboard Global (Teamworkz)
- `/municipality-dashboard`: Vista para Ayuntamientos.
- `/enterprise-dashboard`: Vista para Empresas (Gestión de Proyectos y Ajustes).
- `/talent-dashboard`: Vista para Candidatos (Explorador y Perfil Sensorial).
- `/create-project`: Formulario de creación de vacantes inclusivas.

### 3. Seguridad (RLS - Row Level Security)
*Notas para configuración en Supabase:*

- **Proyectos (challenges)**:
  - `SELECT`: Permitir a todos si `is_public = true`.
  - `INSERT/UPDATE`: Solo usuarios con `role = 'enterprise'` y que pertenezcan a la `organization_id`.
  
- **Candidaturas (applications)**:
  - `INSERT`: Solo usuarios con `role = 'talent'`.
  - `SELECT`: Usuario propio O Empresa dueña del proyecto asociado.

---
*Implementado por Antigravity (Google DeepMind)*
