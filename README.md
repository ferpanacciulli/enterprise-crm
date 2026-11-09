# CRM & Inventario

Sistema de gestión comercial (CRM + inventario + facturación) construido como aplicación web de página única (SPA). Originalmente desarrollado en Java (Spring Boot), fue migrado por completo a una arquitectura moderna de frontend con backend gestionado.

## Características

- **Dashboard** con métricas de ventas (últimos 6 meses), pipeline por etapa y stock bajo.
- **Clientes, oportunidades y productos** con CRUD completo.
- **Facturación** con detalle de ítems por factura.
- **Registro de auditoría** (audit logs).
- **Autenticación** con JWT de Supabase y renovación automática de sesión (refresh token).
- **Internacionalización de datos**: la API consume y produce JSON en `snake_case`; la capa `lib/api.js` convierte automáticamente a `camelCase` para el frontend.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| UI | React 19 + React Router 7 (data routers) |
| Build | Vite |
| Backend / BD | Supabase (PostgreSQL + Auth + REST API) |
| Gráficos | Componentes propios en SVG/CSS (`charts.jsx`, `charts.css`) |
| Hosting | Vercel (deploy automático desde `main`) |
| CI | GitHub Actions — build de producción en cada push/PR a `main` |

## Estructura del proyecto

```
frontend/
├── public/              # Assets estáticos
├── src/
│   ├── components/      # Componentes compartidos (gráficos)
│   ├── layouts/         # Layout principal de la app
│   ├── lib/             # Cliente de API, manejo de sesión, agregaciones
│   └── routes/          # Vistas: Dashboard, Customers, Products,
│                        # Opportunities, Invoices, AuditLogs, Login/Register
├── .env.example         # Plantilla de variables de entorno
└── vercel.json
```

## Puesta en marcha

### Prerrequisitos

- Node.js 22+
- Una cuenta gratuita en [Supabase](https://supabase.com)

### Instalación

```bash
cd frontend
npm install
```

### Variables de entorno

Copiá la plantilla y completá con los datos de tu proyecto de Supabase
(Dashboard → Project Settings → API):

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_CLAVE_ANON
```

> Nota: la clave anon es pública por diseño; la seguridad de los datos recae
> sobre las políticas de Row Level Security (RLS) configuradas en Supabase.
> El archivo `.env` real **no** se versiona.

### Desarrollo

```bash
npm run dev
```

### Build de producción

```bash
npm run build
npm run preview   # para probar el build localmente
```

## Despliegue

El proyecto se despliega automáticamente en **Vercel** con cada push a `main`.

Variables requeridas en Vercel (Project Settings → Environment Variables):
`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

Además, en el dashboard de Supabase deben estar registradas en **Redirect URLs**
las URLs de producción y previsualización de Vercel para que los flujos de
autenticación funcionen correctamente.

## Modelo de dominio

```
customers ──< opportunities ──< activities
                    │
                    ├──< opportunity_products >── products
                    │
                    └──< invoices ──< invoice_items
```

Las tablas (en `snake_case`) viven en Supabase y se acceden mediante la REST
API (`/rest/v1`); las rutas del frontend (por ej. `/opportunities/123/activities`)
se traducen a queries de PostgREST en `lib/api.js`.

## Seguridad

- Tokens de acceso y refresh almacenados en `localStorage`.
- Renovación proactiva y reactiva del JWT (`lib/api.js` + `lib/session.js`).
- Route guards en los loaders de React Router: las rutas protegidas validan
  la sesión antes de renderizar.