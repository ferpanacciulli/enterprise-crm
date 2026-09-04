# Enterprise CRM

CRM full-stack: backend en Spring Boot 3.5.5 (Java 21) + frontend en React (Vite).

## Estructura

```
enterprise-crm/
├── backend/    # API REST (Spring Boot, PostgreSQL, Redis, JWT)
└── frontend/   # SPA en React (Vite)
```

## 1. Levantar la infraestructura (Postgres + Redis)

Desde `backend/`, con Docker Desktop corriendo:

```powershell
cd backend
docker compose up -d
```

## 2. Levantar el backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

La primera vez que arranca:
- Flyway aplica las migraciones (`V1` schema inicial, `V2` seed de roles, `V3` tabla de productos).
- Un `DataSeeder` crea un usuario admin de prueba y 3 productos de ejemplo (uno queda en bajo stock a propósito).

**Usuario de prueba:** `admin@crm.com` / `Admin123!`

La API queda en `http://localhost:8080`. Swagger en `http://localhost:8080/swagger-ui/index.html`.

## 3. Levantar el frontend

```powershell
cd frontend
npm install
npm run dev
```

La app queda en `http://localhost:5173`. Ya viene configurada (`.env`) para hablar con el backend en `http://localhost:8080` — si cambiás el puerto del backend, actualizá `VITE_API_URL` ahí.

## Qué incluye

**Backend**
- Auth con JWT (registro / login), passwords con BCrypt
- CRUD completo de **Clientes** (`/api/customers`)
- CRUD completo de **Inventario / Productos** (`/api/products`), con endpoint de bajo stock y ajuste de stock
- Manejo global de excepciones (404, 400 con detalle de campo, 409 duplicados, 401 credenciales)
- Entities de Opportunity, Activity, Notification y AuditLog ya modeladas (repository listo), pendientes de su propio CRUD — el patrón para armarlas es el mismo que Customer/Product

**Frontend**
- Login / Registro
- Dashboard con métricas (clientes, productos, bajo stock)
- Gestión de Clientes (alta, edición, baja)
- Gestión de Inventario (alta, edición, baja, ajuste rápido de stock +/-, filtro de bajo stock)

## Próximos pasos sugeridos

- CRUD de Opportunity (vinculado a Customer y a un User "owner")
- CRUD de Activity (vinculado a Opportunity)
- Sistema de notificaciones (la entity ya existe)
- Roles/permisos por endpoint (hoy cualquier usuario autenticado puede todo — falta `@PreAuthorize`)
