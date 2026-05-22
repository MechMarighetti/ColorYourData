# Encuesta de Color Favorito y Huella Digital

Proyecto educativo para recolectar datos de encuestas de color con análisis de huella digital, desplegable en Vercel con base de datos Supabase.

## Setup Local

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar Supabase
- Crear cuenta en [supabase.com](https://supabase.com)
- Crear nuevo proyecto
- Copiar `.env.example` a `.env.local`:
  ```bash
  cp .env.example .env.local
  ```
- Completar con tus credenciales desde **Settings → API**:
  - `SUPABASE_URL`: Project URL
  - `SUPABASE_KEY`: anon public key
  - `SUPABASE_SERVICE_KEY`: service_role key

### 3. Crear tablas en Supabase
Ir a **SQL Editor** y ejecutar:

```sql
CREATE TABLE IF NOT EXISTS respuestas (
  id BIGSERIAL PRIMARY KEY,
  color TEXT NOT NULL,
  ip TEXT,
  country TEXT,
  region TEXT,
  latitude TEXT,
  longitude TEXT,
  user_agent TEXT,
  platform TEXT,
  language TEXT,
  screen_resolution TEXT,
  color_depth TEXT,
  timezone TEXT,
  cpu_cores TEXT,
  device_memory TEXT,
  fingerprint TEXT,
  tiempo_seleccion TEXT,
  clics_erroneos TEXT,
  movimientos_mouse TEXT,
  porcentaje_scroll TEXT,
  pausas_scroll TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Crear índice para IP (queries más rápidas)
CREATE INDEX idx_respuestas_ip ON respuestas(ip);
```

### 4. Ejecutar localmente
```bash
npm start
```

Servidor en `http://localhost:3000`

## Deploy en Vercel

### 1. Conectar repo a Vercel
```bash
npm install -g vercel
vercel
```

### 2. Configurar Variables de Entorno en Vercel
En el dashboard de Vercel → Project Settings → Environment Variables:

```
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_KEY = your-anon-public-key
SUPABASE_SERVICE_KEY = your-service-role-key
NODE_ENV = production
```

### 3. Deploy
```bash
vercel --prod
```

O conecta el repo en Vercel dashboard para deploy automático en cada push.

## Estructura de Datos Recolectados

La tabla `respuestas` almacena:
- **Color elegido**: `color`
- **IP**: `ip`
- **Geolocalización**: `country`, `region`, `latitude`, `longitude`
- **Datos técnicos**: `user_agent`, `platform`, `language`, `screen_resolution`, `color_depth`, `timezone`, `cpu_cores`, `device_memory`
- **Huella digital**: `fingerprint`
- **Comportamiento** (si hay consentimiento): `tiempo_seleccion`, `clics_erroneos`, `movimientos_mouse`, `porcentaje_scroll`, `pausas_scroll`
- **Timestamp**: `timestamp`

## Endpoints

- `POST /guardar-color` - Guardar selección de color
- `GET /api/stats` - Estadísticas globales
- `GET /api/perfil/:id` - Perfil de sesión
- `GET /api/mi-perfil` - Perfil por IP actual
- `GET /timeline-data` - Historial por IP

## Frontend

Está en `public/`. Archivos principales:
- `index.html` - Encuesta principal
- `stats.html` - Estadísticas
- `perfil.html` - Perfil de usuario
- `timeline.html` - Línea de tiempo
