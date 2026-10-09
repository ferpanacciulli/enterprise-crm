# Guía de deploy

## Opcion B - Full-stack (Railway + frontend en Vercel)

En Railway tenes las 2 cosas juntas en un mismo proyecto: el backend Java y su
Postgres. Neon queda como alternativa (abajo) si preferis la base afuera.

### B1. Backend + Postgres en Railway

1. Entra a [railway.app](https://railway.app) y crea una cuenta con GitHub.
2. **New Project -> Deploy from GitHub repo** -> elegi tu repo `enterprise-crm`.
3. Cuando te pregunte el **Root Directory**, pone `backend`.
4. Railway detecta Maven solo. Si te pide start command, pone:
   `java -Dserver.port=$PORT -jar target/*.jar`
5. **Agrega la base**: dentro del mismo proyecto, `+ New -> Database -> PostgreSQL`.
   Railway crea las variables `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` solas.
6. En la pestana **Variables** del servicio backend, agrega:
   ```
   SPRING_PROFILES_ACTIVE=postgresql
   SPRING_DATASOURCE_URL=jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}
   SPRING_DATASOURCE_USERNAME=${{Postgres.PGUSER}}
   SPRING_DATASOURCE_PASSWORD=${{Postgres.PGPASSWORD}}
   JWT_SECRET=<genera uno nuevo, ver paso 7>
   ```
   Railway permite referenciar variables de otro servicio con `${{Postgres.VARIABLE}}` -
   asi no copias contrasenas a mano.
7. **Generar un JWT_SECRET propio** (nunca reuses el que esta en el repo, ese
   es solo para desarrollo local). Corre esto en tu maquina y pega el resultado:
   ```powershell
   # PowerShell
   [Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))
   ```
8. Deploy. Railway te da una URL tipo `https://enterprise-crm-backend-production.up.railway.app`
   - guardala, la necesitas para el frontend.
9. Proba que funciona entrando a `https://tu-url.up.railway.app/swagger-ui/index.html`.
   (Flyway crea las tablas solo en el primer arranque, no hay que correr SQL a mano.)

### B2. Frontend en Vercel (contra tu backend real)

1. Entra a [vercel.com](https://vercel.com) y crea una cuenta con GitHub.
2. **Add New -> Project** -> elegi el mismo repo.
3. En **Root Directory**, pone `frontend`. Vercel detecta Vite automaticamente.
4. En **Environment Variables**, agrega:
   ```
   VITE_API_URL=https://tu-url.up.railway.app
   ```
   (la URL del backend que copiaste en el paso anterior, sin la barra final). No pongas VITE_DEMO_MODE aca - ese es solo para la Opcion A.
5. Deploy. Vercel te da un link tipo `https://enterprise-crm-tuusuario.vercel.app`.

### B3. Un ajuste de CORS a tener en cuenta

`SecurityConfig.java` hoy permite CORS desde cualquier origen (`allowedOriginPatterns: "*"`),
lo cual esta bien para desarrollo pero no es lo mas prolijo en produccion. Una vez que
tengas la URL final de Vercel, si queres endurecerlo, cambia en `SecurityConfig.java`:

```java
config.setAllowedOriginPatterns(java.util.List.of("*"));
```
por:
```java
config.setAllowedOriginPatterns(java.util.List.of("https://enterprise-crm-tuusuario.vercel.app"));
```

No es obligatorio para que funcione, pero es la diferencia entre "funciona" y
"esta pensado para produccion" si alguien lee el codigo.

## Alternativa: Neon como base externa (en vez del Postgres de Railway)

Si preferis usar tu base de Neon en lugar del Postgres que crea Railway,
el backend puede ir igual en Railway o en Render, cambiando solo las
variables del datasource:

```
SPRING_PROFILES_ACTIVE=postgresql
SPRING_DATASOURCE_URL=jdbc:postgresql://ep-orange-leaf-b5nl15wj-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require
SPRING_DATASOURCE_USERNAME=neondb_owner
SPRING_DATASOURCE_PASSWORD=<tu password de Neon>
JWT_SECRET=<genera uno nuevo>
```

El password va SOLO en el dashboard del servicio, nunca en el repo.
Ya dejé un `backend/render.yaml` con la base por si preferís Render para
el backend (occasionalmente Railway cambia sus límites del plan gratis).

## Nota: las credenciales AWS de Neon que pasaste

Las variables `AWS_ENDPOINT_URL_S3` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
son para **Neon S3** (backups / branching a object storage). El backend
**no las necesita**: se conecta por el string de Postgres
(`SPRING_DATASOURCE_URL`), no por S3. No las pongas en Railway/Render ni en
el repo. Y como ya circularon en un chat, rotalas en Neon
(Settings -> API keys / S3 credentials) cuando puedas, por las dudas.
