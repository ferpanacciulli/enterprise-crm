# Enterprise CRM

CRM full-stack: backend en Spring Boot 3.5.5 (Java 21) + frontend en React (Vite).

## Estructura

```
enterprise-crm/
├── backend/    # API REST (Spring Boot, PostgreSQL, Redis, JWT)
└── frontend/   # SPA en React (Vite)
```

## 1. Elegir motor de base de datos (perfiles de Spring)

El proyecto soporta más de un motor sin tocar código, vía **perfiles**:

| Perfil | Motor | Necesita Docker | Cuándo usarlo |
|---|---|---|---|
| `h2` (default) | H2, en un archivo local (`data/crmdb.mv.db`) | No | Probar el proyecto sin instalar nada |
| `postgresql` | PostgreSQL real | Sí (o instalado nativo) | Desarrollo "real" / antes de producción |

Las migraciones de Flyway (`V1`, `V3`) son las **mismas** para los dos motores — las probé manualmente contra H2 en modo de compatibilidad PostgreSQL y corren sin cambios. Si el día de mañana sumás MySQL, probablemente necesites ajustar sintaxis (`BIGSERIAL` no existe ahí) y armar un perfil `application-mysql.yml` + su propia carpeta de migraciones — la arquitectura ya está pensada para eso, solo falta ese perfil puntual.

**No hace falta declarar el perfil para usar H2** — es el default en `application.yml` (`spring.profiles.active: h2`).

Para usar PostgreSQL en cambio, con Docker corriendo (`docker compose up -d` desde `backend/`):
```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=postgresql"
```

## 2. Levantar el backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Con el perfil `h2` (default), esto ya alcanza — no necesitás Docker ni nada instalado, H2 se crea sola como un archivo en `backend/data/`.

La primera vez que arranca:
- Flyway aplica las migraciones (`V1` schema inicial + seed de roles, `V3` tabla de productos).
- Un `DataSeeder` crea un usuario admin de prueba y 3 productos de ejemplo (uno queda en bajo stock a propósito).
- Podés inspeccionar la base en el navegador: `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:file:./data/crmdb;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE`, user `sa`, sin contraseña).

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
- CRUD completo de **Oportunidades** (`/api/opportunities`), ligadas a un Cliente y a un dueño (el usuario autenticado que la crea)
- Historial de **mensajes/interacciones** por oportunidad (`/api/opportunities/{id}/activities`) — llamadas, emails, reuniones, tareas, notas
- CRUD completo de **Inventario / Productos** (`/api/products`), con búsqueda por nombre/SKU/categoría y endpoint de bajo stock
- **Reserva automática de stock**: agregar un producto a una oportunidad (`/api/opportunities/{id}/products`) descuenta el stock al instante; sacarlo o borrar la oportunidad lo devuelve
- **Historial de movimientos de stock** por producto (`/api/products/{id}/stock-movements`) — ajustes manuales, reservas/liberaciones automáticas y ventas facturadas, con quién y cuándo
- **Foto de producto**: se sube como archivo y se guarda en base64 en la propia base (sin servidor de archivos aparte) — límite recomendado 2MB por imagen
- **Facturación** (`/api/invoices`): elegís cliente + productos con cantidad, se valida stock de todas las líneas antes de tocar nada, se descuenta el inventario, y queda la factura con numeración correlativa (`INV-000001`)
- Manejo global de excepciones (404, 400 con detalle de campo, 409 duplicados, 401 credenciales) con logging real de errores no controlados
- Entities de Notification y AuditLog ya modeladas (repository listo), pendientes de su propio CRUD

**Frontend**
- Login / Registro
- Dashboard con métricas (clientes, oportunidades abiertas, valor del pipeline, productos, bajo stock)
- Gestión de Clientes (alta, edición, baja)
- Gestión de Oportunidades (alta con selector de cliente, edición, baja) + vista de detalle con productos reservados y el timeline de mensajes
- Gestión de Inventario (alta, edición, baja, foto de producto, ajuste rápido de stock +/-, filtro de bajo stock, buscador con debounce, modal de historial de movimientos)
- **Facturación**: armado de factura con líneas dinámicas (agregar/quitar productos antes de confirmar), y una vista de detalle imprimible (`window.print()`, con CSS de impresión que oculta la navbar)

**Frontend** — React 19 + React Router 7 en **modo data router** (`createBrowserRouter` / `RouterProvider`), no el modo declarativo clásico:
- **Loaders**: cada ruta carga sus datos (`useLoaderData`) antes de renderizar — no hay `useEffect` + `useState` para el fetch inicial en ninguna pantalla.
- **Actions + `useFetcher`**: los formularios (alta/edición/baja de Customer y Product, ajuste de stock) se mandan como `<fetcher.Form>` a la `action` de la ruta. React Router revalida el loader solo después de cada submit exitoso — la tabla se refresca sin que el componente pida el reload a mano.
- **Guard de auth vía loader**: `AppLayout` tiene un loader que redirige a `/login` si no hay token, antes de pintar un solo frame de UI protegida (reemplaza el patrón de componente `<ProtectedRoute>`).
- **`errorElement`**: si un loader tira un error (ej: la API cae, o el token expiró), lo atrapa una pantalla de error declarativa en vez de que la SPA quede en un estado roto.
- **Estado en la URL**: el filtro "solo bajo stock" de Inventario vive en el query string (`?lowStock=1`) vía `useSearchParams`, así que es bookmarkeable y dispara la revalidación del loader automáticamente.
- Login / Registro / Dashboard con métricas / CRUD de Clientes / CRUD de Inventario

## Tests

```powershell
cd backend
.\mvnw.cmd test
```

Hay dos capas:
- **Unitarios** (`ProductServiceTest`, `AuthServiceTest`, `OpportunityProductServiceTest`) — con Mockito, sin levantar Spring. Cubren la lógica de negocio más sensible: stock insuficiente, duplicados, la reserva/liberación automática de inventario.
- **De integración** (`AuthControllerIntegrationTest`, `ProductControllerIntegrationTest`) — levantan el contexto completo de Spring contra un H2 en memoria propio de los tests (perfil `test`, ver `src/test/resources/application-test.yml`), y pegan HTTP real contra los endpoints.

## CI

`.github/workflows/backend-ci.yml` y `frontend-ci.yml` corren en cada push/PR a `main`: compilan y testean el backend, y hacen el build de producción del frontend. Se activan solos apenas el repo esté en GitHub — no hace falta configurar nada.

## Deploy

Ver [`DEPLOY.md`](./DEPLOY.md) — guía paso a paso para backend en Railway (con Postgres gestionado) y frontend en Vercel. Esa parte requiere tus propias cuentas, no se puede automatizar del todo.

## Bug corregido en esta versión

`V1__initial_schema.sql` ya sembraba los roles (`ADMIN`, `MANAGER`, `SALES_REPRESENTATIVE`) al final del script. Existía además un `V2__seed_roles.sql` que insertaba lo mismo — Flyway iba a tirar un duplicate key violation apenas corriera. Se eliminó `V2` (era redundante).

## Próximos pasos sugeridos

- CRUD de Opportunity (vinculado a Customer y a un User "owner")
- CRUD de Activity (vinculado a Opportunity)
- Sistema de notificaciones (la entity ya existe)
- Roles/permisos por endpoint (hoy cualquier usuario autenticado puede todo — falta `@PreAuthorize`)
